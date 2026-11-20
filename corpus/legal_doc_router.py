"""
Legal-doc router — maps a user query to a list of Anthropic file_ids (up to 2)
for the legal/governance PDFs to attach to the message.

Strategy:
1. Fast keyword/regex map (deterministic, no API call).
2. If no keyword match, fall back to a Haiku 4.5 classifier call.
3. Cap result at MAX_LEGAL_DOCS.

Usage:
    from corpus.legal_doc_router import route_legal_docs

    manifest = json.loads(Path("corpus/_slug_to_asset.json").read_text())
    file_ids = route_legal_docs(query, manifest)
    # file_ids is a list[str] of claude_file_id values, possibly empty.
"""
from __future__ import annotations

import re

# System-prompt addendum injected when legal/governance docs are attached.
# Append this to the base prompt rules block (not the cached corpus block).
LEGAL_ADDENDUM = """
## Legal-document rule

One or more legal or governance PDF documents are attached to the user message.
Apply these rules:

- **Quote, don't paraphrase obligations.** For contract terms, quote the specific
  clause rather than summarising it to avoid misrepresentation.
- **Include qualifications.** If a clause has conditions or exceptions, include
  them in your answer — do not flatten them away.
- **Factual questions only.** State what the document says; do not give legal
  advice or interpret enforceability.
- **Cite the slug.** Always include `[doc:slug]` for every legal document you
  draw a fact from. Use the slug matching the attached document.
"""

# ---------------------------------------------------------------------------
# Keyword/regex patterns per legal-doc slug.
# Any single match triggers attachment of that document.
# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# Keyword/regex patterns per legal-doc slug. Any single match attaches that
# document. Slugs must exist in the "legal_docs" section of corpus/manifest.json.
# ---------------------------------------------------------------------------
_PATTERNS: dict[str, list[str]] = {
    "contract-partner-yuber": [
        r"\byuber\b",
        r"\bdistribution agreement\b",
        r"\bgig.worker (agreement|contract|exclusiv)",
    ],
    "contract-carrier-alpha": [
        r"\balpha mutual\b",
        r"\bcarrier (agreement|contract|capacity)\b",
        r"\bcapacity (agreement|cap|limit)\b",
        r"\bloss ratio corridor\b",
        r"\bprofit commission\b",
    ],
    "governance-corporate-structure": [
        r"\bcorporate structure\b",
        r"\blegal structure\b",
        r"\bentity structure\b",
        r"\bholding company\b",
        r"\bsubsidiar",
        r"\bcorporate entities\b",
        r"\bhow many entities\b",
        r"\bwhich entities\b",
        r"\bdelaware\b",
        r"\bireland ltd\b",
    ],
}

# Broad patterns that suggest *some* contract is relevant but don't pin a slug.
# Used to trigger the Haiku fallback instead of skipping.
_BROAD_PATTERNS: list[str] = [
    r"\b(partner|carrier|distribution) (agreement|contract|terms)",
    r"\bcapacity agreement\b",
    r"\bcarrier (agreement|contract|terms)\b",
    r"\bpartnership agreement\b",
    r"\bcontract (term|clause|provision|length|duration|renewal|exclusiv)",
    r"\bcontract with\b",
    r"\bagreement with\b",
    r"\bsigned (agreement|contract)\b",
    r"\bexclusiv(ity|e) (clause|agreement|arrangement)\b",
    r"\brevenue share\b",
    r"\bfee structure\b",
]

# Compiled once at import time.
_COMPILED: dict[str, list[re.Pattern]] = {
    slug: [re.compile(p, re.IGNORECASE) for p in patterns]
    for slug, patterns in _PATTERNS.items()
}
_BROAD_COMPILED: list[re.Pattern] = [
    re.compile(p, re.IGNORECASE) for p in _BROAD_PATTERNS
]

MAX_LEGAL_DOCS = 2

_CLASSIFIER_PROMPT = (
    "An investor is reviewing a data room and asking the following question. "
    "You must decide whether attaching specific legal or governance PDFs would "
    "help answer it.\n\n"
    "ONLY return document slugs if the question is specifically about:\n"
    "- The terms, clauses, or details of a particular partner or carrier contract\n"
    "- The company's corporate/legal entity structure\n"
    "- Governance documents such as the corporate structure chart\n\n"
    "Do NOT attach documents for general questions about product, financials, "
    "team, or competitive landscape.\n\n"
    "If relevant, list up to {max_docs} slugs most relevant first — one per line. "
    "If none apply, reply with exactly: NONE\n\n"
    "Available documents:\n{slug_lines}\n\n"
    "Question: {query}\n\n"
    "Answer:"
)


def _keyword_match(query: str) -> list[str]:
    """Return slugs whose patterns fire on query, in definition order."""
    matched = []
    for slug, compiled in _COMPILED.items():
        if any(pat.search(query) for pat in compiled):
            matched.append(slug)
    return matched


def _broad_match(query: str) -> bool:
    """Return True if the query mentions contracts/agreements broadly."""
    return any(pat.search(query) for pat in _BROAD_COMPILED)


def _haiku_classify(query: str, available_slugs: list[str], title_map: dict[str, str]) -> list[str]:
    from anthropic import Anthropic

    client = Anthropic()
    slug_lines = "\n".join(f"- {s} ({title_map.get(s, s)})" for s in available_slugs)
    prompt = _CLASSIFIER_PROMPT.format(
        max_docs=MAX_LEGAL_DOCS,
        slug_lines=slug_lines,
        query=query,
    )
    resp = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=100,
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
    return slugs[:MAX_LEGAL_DOCS]


def route_legal_docs(query: str, manifest: dict) -> list[str]:
    """
    Return up to MAX_LEGAL_DOCS claude_file_id strings for the legal/governance
    documents most relevant to `query`.

    Returns an empty list if no documents have been uploaded yet or if the
    query doesn't warrant attaching any legal docs.

    Args:
        query:    The user's raw question text.
        manifest: Parsed content of corpus/_slug_to_asset.json.
    """
    legal_data: dict = manifest.get("legal_docs", {})
    available: dict[str, dict] = {
        slug: info
        for slug, info in legal_data.items()
        if info.get("claude_file_id")
    }
    if not available:
        return []

    title_map = {slug: info.get("title", slug) for slug, info in available.items()}

    matched = _keyword_match(query)
    matched = [s for s in matched if s in available]

    if not matched and _broad_match(query):
        matched = _haiku_classify(query, list(available.keys()), title_map)

    seen: set[str] = set()
    result: list[str] = []
    for slug in matched:
        if slug not in seen and slug in available:
            seen.add(slug)
            result.append(available[slug]["claude_file_id"])
        if len(result) >= MAX_LEGAL_DOCS:
            break

    return result
