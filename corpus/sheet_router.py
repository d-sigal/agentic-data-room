"""
Sheet router — maps a user query to a list of Anthropic file_ids (up to 4)
for the financial-model CSV sheets to attach to the message.

Strategy:
1. Fast keyword/regex map (deterministic, no API call).
2. If no keyword match, fall back to a Haiku 4.5 classifier call.
3. Cap result at 4 sheets.

Usage:
    from corpus.sheet_router import route_sheets

    manifest = json.loads(Path("corpus/_slug_to_asset.json").read_text())
    file_ids = route_sheets(query, manifest)
    # file_ids is a list[str] of claude_file_id values, possibly empty.
"""
from __future__ import annotations

import re
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    pass

# System-prompt addendum injected when CSV sheets are attached.
# Append this to the base prompt rules block (not the cached corpus block).
SHEETS_ADDENDUM = """
## Sheet-files rule

One or more CSV documents from `financial_model.xlsx` are attached to
the user message. Apply these rules:

- **CSV is source of truth for cell values.** Read numeric values directly from
  the attached CSV row/column that matches the question (year, quarter, line
  item). The CSV supersedes summary values in the corpus narrative if they differ.
- **Parent slug only.** Always cite `[doc:finance-financial-model]` — do not
  introduce new citation slugs for individual sheet tabs.
- **What-if refusal still applies.** Attached CSVs provide lookup precision, not
  scenario modelling. Decline what-if questions even when CSVs are present.
- **Trust the cell.** If the CSV value differs from the corpus narrative, report
  the CSV value and note the discrepancy.
"""

# ---------------------------------------------------------------------------
# Keyword/regex patterns per sheet slug.
# Order within each list doesn't matter; any single match is enough to select
# that sheet.  Patterns are applied case-insensitively.
# ---------------------------------------------------------------------------
_PATTERNS: dict[str, list[str]] = {
    "pnl": [
        r"\brevenue\b",
        r"\bnet income\b",
        r"\bnet loss\b",
        r"\bebitda\b",
        r"\bgross profit\b",
        r"\bgross margin\b",
        r"\bp&l\b",
        r"\bincome statement\b",
        r"\bcogs\b",
        r"\bcost of (sales|goods|revenue)\b",
        r"\bopex\b",
        r"\boperating (expense|loss|profit)\b",
        r"\bplatform fee revenue\b",
        r"\btake.rate revenue\b",
    ],
    "balance-sheet": [
        r"\bbalance sheet\b",
        r"\bcash (balance|position|on hand)\b",
        r"\btotal assets\b",
        r"\bliabilit",
        r"\bequity\b",
        r"\bworking capital\b",
        r"\breceivables?\b",
        r"\bpayables?\b",
        r"\bdeferred revenue\b",
    ],
    "cash-flow": [
        r"\bcash flow\b",
        r"\bburn\b",
        r"\brunway\b",
        r"\bfree cash\b",
        r"\bcapex\b",
        r"\boperating cash\b",
        r"\bfinancing (activit|cash)\b",
        r"\bnet cash\b",
    ],
    "assumptions": [
        r"\bassumption",
        r"\binputs?\b",
        r"\bdrivers?\b",
        r"\battach rate\b",
        r"\btake rate\b",
        r"\baverage premium\b",
        r"\bmultiplier\b",
        r"\bcoefficient\b",
        r"\bwhat does .{0,20}mean\b",
        r"\bx ?3\b",
        r"\bunit conversion\b",
        r"\bmonthly (input|rate)\b",
    ],
    "revenue-build": [
        r"\brevenue build\b",
        r"\bgwp\b",
        r"\bgross written premium",
        r"\bpolic(y|ies) (count|volume|issued)\b",
        r"\bpolicies\b",
        r"\bper partner\b",
        r"\bpartner (revenue|ramp|cohort)\b",
        r"\bcheckouts?\b",
        r"\bx ?3\b",
    ],
    "headcount": [
        r"\bheadcount\b",
        r"\bftes?\b",
        r"\bfull.time equivalent",
        r"\bhires?\b",
        r"\bhiring plan\b",
        r"\bsalar",
        r"\bteam size\b",
        r"\bemployees?\b",
    ],
    "sga": [
        r"\bsg&a\b",
        r"\bsga\b",
        r"\bmarketing (spend|budget|expense)\b",
        r"\bg&a\b",
        r"\bgeneral and administrative\b",
        r"\blegal (cost|expense|spend)\b",
        r"\btravel\b",
        r"\bsoftware (cost|spend)\b",
        r"\brent\b",
    ],
    "kpis": [
        r"\bkpis?\b",
        r"\bltv\b",
        r"\bcac\b",
        r"\bpayback\b",
        r"\bnet revenue retention\b",
        r"\bnrr\b",
        r"\barr\b",
        r"\bchurn\b",
        r"\bloss ratio\b",
        r"\bgross margin per policy\b",
        r"\bstraight.through\b",
        r"\bkey metrics?\b",
    ],
    "scenarios": [
        r"\bscenarios?\b",
        r"\bbear\b",
        r"\bbull\b",
        r"\bbase case\b",
        r"\bdownside\b",
        r"\bupside\b",
        r"\bsensitivit",
    ],
}

# Compiled once at import time for speed.
_COMPILED: dict[str, list[re.Pattern]] = {
    slug: [re.compile(p, re.IGNORECASE) for p in patterns]
    for slug, patterns in _PATTERNS.items()
}

MAX_SHEETS = 4


def _keyword_match(query: str) -> list[str]:
    """Return slugs whose keyword patterns fire on query, in definition order."""
    matched = []
    for slug, compiled in _COMPILED.items():
        if any(pat.search(query) for pat in compiled):
            matched.append(slug)
    return matched


# Default classifier prompt. Set LANGSMITH_API_KEY and LANGSMITH_SHEET_ROUTER_PROMPT
# to pull an override from LangSmith Hub at first use; this string is the fallback.
_CLASSIFIER_PROMPT_DEFAULT = (
    "An investor is asking the following question. You must decide whether it "
    "requires looking up a specific cell value from a financial model spreadsheet.\n\n"
    "ONLY return sheet names if the question asks for a specific number, metric, or "
    "line-item that lives inside the financial model (e.g. a quarterly revenue figure, "
    "a balance sheet amount, a KPI, a policy count). "
    "Do NOT return any sheets if the question is about product features, general "
    "pricing strategy, competitive landscape, team, or anything answered by "
    "non-model documents.\n\n"
    "If sheets are relevant, list up to 4, most relevant first — one slug per line. "
    "If no sheets are needed, reply with exactly: NONE\n\n"
    "Available sheets:\n{slug_lines}\n\n"
    "Question: {query}\n\n"
    "Answer:"
)

_classifier_prompt_cache: str | None = None


def _get_classifier_prompt() -> str:
    """
    Return the classifier prompt template, fetching from LangSmith hub
    (LANGSMITH_SHEET_ROUTER_PROMPT) on first call and caching the result for
    the process lifetime. Falls back to _CLASSIFIER_PROMPT_DEFAULT if the env
    vars are not set or the fetch fails.
    """
    global _classifier_prompt_cache
    if _classifier_prompt_cache is not None:
        return _classifier_prompt_cache

    import os
    api_key = os.environ.get("LANGSMITH_API_KEY")
    hub_name = os.environ.get("LANGSMITH_SHEET_ROUTER_PROMPT")
    if api_key and hub_name:
        try:
            import urllib.request, json as _json
            req = urllib.request.Request(
                f"https://api.smith.langchain.com/api/v1/commits/-/{hub_name}/latest",
                headers={"x-api-key": api_key},
            )
            with urllib.request.urlopen(req) as resp:
                data = _json.loads(resp.read())
            manifest = data["manifest"]
            if "first" in manifest.get("kwargs", {}):
                messages = manifest["kwargs"]["first"]["kwargs"]["messages"]
            else:
                messages = manifest["kwargs"]["messages"]
            _classifier_prompt_cache = messages[0]["kwargs"]["prompt"]["kwargs"]["template"]
            return _classifier_prompt_cache
        except Exception:
            pass

    _classifier_prompt_cache = _CLASSIFIER_PROMPT_DEFAULT
    return _classifier_prompt_cache


def _haiku_classify(query: str, available_slugs: list[str]) -> list[str]:
    """Ask Haiku 4.5 which sheets are relevant; return up to MAX_SHEETS slugs."""
    from anthropic import Anthropic

    client = Anthropic()
    slug_lines = "\n".join(f"- {s} ({SHEET_TITLE_MAP.get(s, s)})" for s in available_slugs)
    prompt = _get_classifier_prompt().format(slug_lines=slug_lines, query=query)
    resp = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=150,
        temperature=0,
        messages=[{"role": "user", "content": prompt}],
    )
    answer = resp.content[0].text.strip()
    if answer.upper() == "NONE" or not answer:
        return []
    slugs: list[str] = []
    for line in answer.splitlines():
        candidate = line.strip().lstrip("-").strip()
        if candidate in available_slugs and candidate not in slugs:
            slugs.append(candidate)
    return slugs[:MAX_SHEETS]


# Reverse lookup used in classifier prompt display names.
SHEET_TITLE_MAP: dict[str, str] = {
    "pnl": "P&L",
    "balance-sheet": "Balance Sheet",
    "cash-flow": "Cash Flow",
    "assumptions": "Assumptions",
    "revenue-build": "Revenue Build",
    "headcount": "Headcount",
    "sga": "SG&A",
    "kpis": "KPIs",
    "scenarios": "Scenarios",
}


def route_sheets(query: str, manifest: dict) -> list[str]:
    """
    Return up to 4 claude_file_id strings for the sheets most relevant to
    `query`, based on the uploaded file IDs in `manifest`.

    Returns an empty list if no sheets have been uploaded yet or if no match
    is found after Haiku classification.

    Args:
        query:    The user's raw question text.
        manifest: Parsed content of corpus/_slug_to_asset.json.
    """
    sheets_data: dict = (
        manifest.get("slugs", {})
        .get("finance-financial-model", {})
        .get("sheets", {})
    )
    # Only consider sheets that have been uploaded.
    available: dict[str, dict] = {
        slug: info
        for slug, info in sheets_data.items()
        if info.get("claude_file_id")
    }
    if not available:
        return []

    matched = _keyword_match(query)
    # Filter to only slugs we actually have file_ids for.
    matched = [s for s in matched if s in available]

    if not matched:
        matched = _haiku_classify(query, list(available.keys()))

    # De-duplicate while preserving order; cap at MAX_SHEETS.
    seen: set[str] = set()
    result: list[str] = []
    for slug in matched:
        if slug not in seen and slug in available:
            seen.add(slug)
            result.append(available[slug]["claude_file_id"])
        if len(result) >= MAX_SHEETS:
            break

    return result
