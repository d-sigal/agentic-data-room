"""
Eval runner. Runs the question set against the current prompt + corpus
and writes a markdown report you can scan for failures.

Run:
    cd playground
    export ANTHROPIC_API_KEY=sk-ant-...
    python eval.py                         # baseline (no sheet files)
    python eval.py --enable-sheets         # with per-query CSV attachments
    python eval.py --model claude-...      # override model

With --enable-sheets the runner:
  1. Reads corpus/_slug_to_asset.json for uploaded sheet file_ids.
  2. Calls sheet_router.route_sheets() before each question to pick ≤4 sheets.
  3. Attaches the CSV files as document blocks in the user message.
  4. Prepends SHEETS_ADDENDUM to the prompt rules block.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path

from anthropic import Anthropic
from dotenv import load_dotenv
from langsmith import traceable
from langsmith.wrappers import wrap_anthropic

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")
import os
# LangSmith tracing is opt-in: set LANGSMITH_TRACING=true and LANGSMITH_API_KEY.
os.environ.setdefault("LANGSMITH_PROJECT", "agentic-data-room")
CORPUS_INDEX = ROOT / "corpus" / "_index.md"
ASSET_MAP = ROOT / "corpus" / "_slug_to_asset.json"
QUESTIONS_FILE = Path(__file__).parent / "eval_questions.json"
DEFAULT_MODEL = "claude-sonnet-4-6"

CITATION_RE = re.compile(r"\[doc:([a-z0-9-]+)\]")

# Beta header required when document blocks with file_id are in the request.
FILES_BETA = "files-api-2025-04-14"


def fetch_prompt() -> str:
    """
    Return the rules block. Default: read PROMPT.md from the repo root
    (everything after the header's closing "---" line). Optional: set
    LANGSMITH_API_KEY and LANGSMITH_PROMPT to pull a LangSmith Hub prompt.
    """
    name = os.environ.get("LANGSMITH_PROMPT")
    api_key = os.environ.get("LANGSMITH_API_KEY")
    if name and api_key:
        import urllib.request, json as _json
        req = urllib.request.Request(
            f"https://api.smith.langchain.com/api/v1/commits/-/{name}/latest",
            headers={"x-api-key": api_key},
        )
        with urllib.request.urlopen(req) as resp:
            data = _json.loads(resp.read())
        manifest = data["manifest"]
        if "first" in manifest.get("kwargs", {}):
            messages = manifest["kwargs"]["first"]["kwargs"]["messages"]
        else:
            messages = manifest["kwargs"]["messages"]
        return messages[0]["kwargs"]["prompt"]["kwargs"]["template"]
    raw = (ROOT / "PROMPT.md").read_text()
    idx = raw.find("\n---\n")
    return raw[idx + 5:].strip() if idx != -1 else raw.strip()


@traceable(run_type="chain", name="eval-question")
def run_one(
    client: Anthropic,
    model: str,
    prompt_rules: str,
    corpus: str,
    question: str,
    file_ids: list[str] | None = None,
) -> dict:
    """
    Run a single question and return the raw result dict.

    When file_ids is provided, the user message is structured as a list of
    document blocks (one per file) followed by the question text.  The Files
    API beta header is added automatically.
    """
    system_blocks = [
        {"type": "text", "text": prompt_rules},
        {
            "type": "text",
            "text": corpus,
            "cache_control": {"type": "ephemeral"},
        },
    ]

    if file_ids:
        user_content: list[dict] = [
            {
                "type": "document",
                "source": {"type": "file", "file_id": fid},
            }
            for fid in file_ids
        ]
        user_content.append({"type": "text", "text": question})
        messages = [{"role": "user", "content": user_content}]
        response = client.messages.create(
            model=model,
            max_tokens=1500,
            temperature=0.1,
            system=system_blocks,
            messages=messages,
            extra_headers={"anthropic-beta": FILES_BETA},
        )
    else:
        messages = [{"role": "user", "content": question}]
        response = client.messages.create(
            model=model,
            max_tokens=1500,
            temperature=0.1,
            system=system_blocks,
            messages=messages,
        )

    answer = "".join(
        block.text for block in response.content if block.type == "text"
    )
    citations = list(dict.fromkeys(CITATION_RE.findall(answer)))
    return {
        "answer": answer,
        "citations": citations,
        "attached_files": file_ids or [],
        "input_tokens": response.usage.input_tokens,
        "cache_read": getattr(response.usage, "cache_read_input_tokens", 0),
        "cache_write": getattr(response.usage, "cache_creation_input_tokens", 0),
        "output_tokens": response.usage.output_tokens,
    }


def grade(question: dict, result: dict) -> dict:
    """Auto-grade what we can; everything else is for human review."""
    answer = result["answer"]
    grades: dict[str, bool | str] = {}

    must_include = question.get("must_include", [])
    miss = [s for s in must_include if s.lower() not in answer.lower()]
    grades["must_include"] = "PASS" if not miss else f"MISSING: {miss}"

    expected_slugs = question.get("expected_citations", [])
    cited = result["citations"]
    if expected_slugs:
        missing_cites = [s for s in expected_slugs if s not in cited]
        grades["expected_citations"] = (
            "PASS" if not missing_cites else f"MISSING: {missing_cites}"
        )
    else:
        grades["expected_citations"] = "n/a"

    refusal_phrase = question.get("expected_refusal_phrase")
    if refusal_phrase:
        grades["refusal"] = (
            "PASS" if refusal_phrase.lower() in answer.lower() else "FAIL"
        )
    else:
        grades["refusal"] = "n/a"

    must_not_include = question.get("must_not_include", [])
    bad = [s for s in must_not_include if s.lower() in answer.lower()]
    grades["must_not_include"] = "PASS" if not bad else f"FOUND: {bad}"

    return grades


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--out", default=None, help="Output markdown path")
    parser.add_argument(
        "--enable-sheets",
        action="store_true",
        help="Attach relevant sheet CSVs to each question via the Anthropic Files API.",
    )
    parser.add_argument(
        "--enable-legal-docs",
        action="store_true",
        help="Attach relevant legal/governance PDFs to each question via the Anthropic Files API.",
    )
    args = parser.parse_args()

    prompt_rules = fetch_prompt()
    corpus = CORPUS_INDEX.read_text()
    questions = json.loads(QUESTIONS_FILE.read_text())

    # Load manifest and routers only when the relevant mode is on.
    manifest: dict = {}
    route_sheets = None
    route_legal_docs = None
    sheets_addendum = ""
    legal_addendum = ""

    if args.enable_sheets or args.enable_legal_docs:
        if not ASSET_MAP.exists():
            print(
                "error: corpus/_slug_to_asset.json not found. "
                "Run corpus/build_index.py first.",
                file=sys.stderr,
            )
            return 1
        manifest = json.loads(ASSET_MAP.read_text())
        sys.path.insert(0, str(ROOT))

    if args.enable_sheets:
        sheets_data = (
            manifest.get("slugs", {})
            .get("finance-financial-model", {})
            .get("sheets", {})
        )
        if not any(s.get("claude_file_id") for s in sheets_data.values()):
            print(
                "warning: no claude_file_id entries found in manifest for sheets. "
                "Run corpus/build_index.py --upload-files first.",
                file=sys.stderr,
            )
        from corpus.sheet_router import route_sheets as _route_sheets, SHEETS_ADDENDUM
        route_sheets = _route_sheets
        sheets_addendum = SHEETS_ADDENDUM

    if args.enable_legal_docs:
        if not any(v.get("claude_file_id") for v in manifest.get("legal_docs", {}).values()):
            print(
                "warning: no claude_file_id entries found in manifest for legal docs. "
                "Run corpus/build_index.py --upload-legal-docs first.",
                file=sys.stderr,
            )
        from corpus.legal_doc_router import route_legal_docs as _route_legal, LEGAL_ADDENDUM
        route_legal_docs = _route_legal
        legal_addendum = LEGAL_ADDENDUM

    client = wrap_anthropic(Anthropic())
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    mode_parts = []
    if args.enable_sheets:
        mode_parts.append("sheets")
    if args.enable_legal_docs:
        mode_parts.append("legal")
    mode_tag = ("-" + "-".join(mode_parts)) if mode_parts else ""
    out_path = Path(args.out) if args.out else (
        Path(__file__).parent / f"eval-report-{timestamp}{mode_tag}.md"
    )

    lines: list[str] = []
    lines.append(f"# Eval report — {timestamp}\n")
    lines.append(f"- model: `{args.model}`\n")
    lines.append(f"- sheets mode: `{'enabled' if args.enable_sheets else 'disabled'}`\n")
    lines.append(f"- legal-docs mode: `{'enabled' if args.enable_legal_docs else 'disabled'}`\n")
    lines.append(f"- prompt: `{os.environ.get('LANGSMITH_PROMPT') or 'PROMPT.md'}`\n")
    lines.append(f"- corpus chars: {len(corpus):,} (~{len(corpus)//4:,} tokens)\n")
    lines.append(f"- questions: {len(questions)}\n\n")
    lines.append("---\n\n")

    pass_count = 0
    total_input = total_cache_read = total_cache_write = total_output = 0

    @traceable(
        run_type="chain",
        name="eval-run",
        metadata={"model": args.model, "n_questions": len(questions),
                  "sheets": args.enable_sheets, "legal_docs": args.enable_legal_docs},
    )
    def run_all_questions():
        nonlocal pass_count, total_input, total_cache_read, total_cache_write, total_output
        for idx, q in enumerate(questions, 1):
            _run_question(idx, q)
        return {"pass_count": pass_count, "total": len(questions)}

    def _run_question(idx, q):
        nonlocal pass_count, total_input, total_cache_read, total_cache_write, total_output
        print(f"[{idx}/{len(questions)}] {q['id']}: {q['question'][:60]}...", flush=True)

        file_ids: list[str] = []
        addenda = []
        if args.enable_sheets and route_sheets is not None:
            sheet_ids = route_sheets(q["question"], manifest)
            file_ids.extend(sheet_ids)
            if sheet_ids:
                addenda.append(sheets_addendum)
        if args.enable_legal_docs and route_legal_docs is not None:
            legal_ids = route_legal_docs(q["question"], manifest)
            file_ids.extend(legal_ids)
            if legal_ids:
                # Tell the model which slug each attached legal doc carries,
                # the same way the web route does, so citations resolve.
                id_to_meta = {
                    v["claude_file_id"]: (slug, v.get("title", slug))
                    for slug, v in manifest.get("legal_docs", {}).items()
                    if v.get("claude_file_id")
                }
                slug_lines = "\n".join(
                    f"- [doc:{id_to_meta[f][0]}] \u2014 {id_to_meta[f][1]}"
                    for f in legal_ids if f in id_to_meta
                )
                addenda.append(
                    legal_addendum
                    + "\nAttached legal documents and their citation slugs:\n"
                    + slug_lines
                )
        effective_rules = prompt_rules + ("".join("\n\n" + a for a in addenda))

        result = run_one(
            client, args.model, effective_rules, corpus, q["question"],
            file_ids=file_ids if file_ids else None,
        )
        # Some questions flip expectations when legal docs are attached
        # (a refusal becomes a quote). The JSON carries a with_legal_docs block.
        gq = {**q, **q["with_legal_docs"]} if (args.enable_legal_docs and q.get("with_legal_docs")) else q
        grades = grade(gq, result)

        all_pass = all(v == "PASS" or v == "n/a" for v in grades.values())
        if all_pass:
            pass_count += 1

        total_input += result["input_tokens"]
        total_cache_read += result["cache_read"]
        total_cache_write += result["cache_write"]
        total_output += result["output_tokens"]

        lines.append(f"## {idx}. `{q['id']}` — {q['category']}\n")
        lines.append(f"**Status:** {'PASS' if all_pass else 'NEEDS REVIEW'}\n\n")
        lines.append(f"**Q:** {q['question']}\n\n")
        if result["attached_files"]:
            lines.append(f"**Files attached:** {len(result['attached_files'])}\n\n")
        lines.append(f"**A:**\n\n```\n{result['answer']}\n```\n\n")
        lines.append("**Auto-grades:**\n\n")
        for k, v in grades.items():
            lines.append(f"- {k}: {v}\n")
        lines.append(
            f"\n**Tokens:** input {result['input_tokens']:,} · "
            f"cache read {result['cache_read']:,} · "
            f"cache write {result['cache_write']:,} · "
            f"output {result['output_tokens']:,}\n\n"
        )
        lines.append("---\n\n")

    run_all_questions()

    lines.append("## Summary\n\n")
    lines.append(f"- Auto-grade pass: **{pass_count}/{len(questions)}**\n")
    lines.append(f"- Total tokens: input {total_input:,} · "
                 f"cache read {total_cache_read:,} · "
                 f"cache write {total_cache_write:,} · "
                 f"output {total_output:,}\n")
    if total_input + total_cache_read > 0:
        hit_rate = total_cache_read / (total_input + total_cache_read) * 100
        lines.append(f"- Cache hit rate: {hit_rate:.0f}%\n")

    out_path.write_text("".join(lines))
    print(f"\nReport written: {out_path}")
    print(f"Auto-grade: {pass_count}/{len(questions)} pass")
    return 0


if __name__ == "__main__":
    sys.exit(main())
