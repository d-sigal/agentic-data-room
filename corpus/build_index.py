"""
Builds corpus/_index.md and corpus/_slug_to_asset.json from the per-doc
markdown files. Run this whenever a per-doc file changes.

Output:
  - _index.md            : concatenated corpus, used as cached system-prompt block.
  - _slug_to_asset.json  : citation contract — slug -> { title, filename, drive_id,
                           mime_type, serve_as }. NO URLs are baked in; the front-end
                           is responsible for serving each file under whatever path
                           it wants and rendering [doc:slug] markers as links.

Flags:
  --upload-files          : also extract per-sheet CSVs from the Series B xlsx,
                            upload new/changed sheets to the Anthropic Files API,
                            and persist claude_file_id + sha256 into the manifest.
  --xlsx PATH             : local path to the xlsx; if omitted, download from
                            Drive using the drive_id in ASSETS (requires
                            GOOGLE_APPLICATION_CREDENTIALS env var).
  --upload-legal-docs     : upload new/changed legal/governance PDFs from
                            corpus/legal/ to the Anthropic Files API and persist
                            claude_file_id + sha256 into the manifest.
  --legal-docs-dir PATH   : directory containing the legal PDFs; defaults to
                            corpus/legal/.
"""
import argparse
import csv as csv_mod
import hashlib
import io
import json
import os
import sys
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent / ".env")
except ImportError:
    pass

CORPUS_DIR = Path(__file__).parent
SECTIONS_ORDER = ["overview", "acquisition", "product", "finance"]
SECTION_TITLES = {
    "overview": "Overview",
    "acquisition": "Acquisition",
    "product": "Product",
    "finance": "Finance",
}

# --- Asset metadata (single source of truth) ---
# Document registry lives in corpus/manifest.json so that no document IDs are
# hardcoded in source. corpus/manifest.example.json shows the expected shape
# and is used as a fallback when manifest.json does not exist.
_MANIFEST_PATH = CORPUS_DIR / "manifest.json"
if not _MANIFEST_PATH.exists():
    _MANIFEST_PATH = CORPUS_DIR / "manifest.example.json"
_MANIFEST: dict = json.loads(_MANIFEST_PATH.read_text())
ASSETS: dict[str, dict] = _MANIFEST.get("assets", {})

# Legal / governance documents uploaded to the Anthropic Files API.
# These are NOT in the corpus text (_index.md). They are attached at query
# time by legal_doc_router when a question warrants it. The registry comes from
# the "legal_docs" key of corpus/manifest.json. Place the PDFs in corpus/legal/
# (or --legal-docs-dir) named exactly as each "filename" value.
LEGAL_DOCS: dict[str, dict] = _MANIFEST.get("legal_docs", {})

# --- Sheet extraction config ---
# Maps xlsx tab name -> manifest slug (kebab-case).
SHEET_SLUG_MAP: dict[str, str] = {
    "P&L": "pnl",
    "Balance Sheet": "balance-sheet",
    "Cash Flow": "cash-flow",
    "Assumptions": "assumptions",
    "Revenue Build": "revenue-build",
    "Headcount": "headcount",
    "SG&A": "sga",
    "KPIs": "kpis",
    "Scenarios": "scenarios",
}

SHEET_TITLE_MAP: dict[str, str] = {v: k for k, v in SHEET_SLUG_MAP.items()}

# Cover is navigation-only; skip it.
SKIP_SHEETS: set[str] = {"Cover"}


def _file_id(asset: dict) -> str | None:
    """
    The id the UI uses to open a cited file through /api/library/files/<id>.
    Google Drive: the drive_id. Local library: "local_" + base64url(local_path),
    matching web/src/lib/local_library.js.
    """
    if asset.get("drive_id"):
        return asset["drive_id"]
    lp = asset.get("local_path")
    if lp:
        import base64
        return "local_" + base64.urlsafe_b64encode(lp.encode()).decode().rstrip("=")
    return None


def parse_frontmatter(text: str) -> tuple[dict, str]:
    """Strip YAML-style frontmatter and return (meta_dict, body_str)."""
    if not text.startswith("---\n"):
        return {}, text
    end = text.find("\n---\n", 4)
    if end == -1:
        return {}, text
    fm_block = text[4:end]
    body = text[end + 5:]
    meta = {}
    for line in fm_block.split("\n"):
        if ":" in line:
            k, _, v = line.partition(":")
            meta[k.strip()] = v.strip()
    return meta, body


def _load_existing_sheets() -> dict:
    """Read sheets data from the current manifest so we can preserve it on rebuild."""
    p = CORPUS_DIR / "_slug_to_asset.json"
    if not p.exists():
        return {}
    try:
        data = json.loads(p.read_text())
        return (
            data.get("slugs", {})
            .get("finance-financial-model", {})
            .get("sheets", {})
        )
    except Exception:
        return {}


def _load_existing_legal_docs() -> dict:
    """Read legal_docs block from the current manifest so we can preserve it on rebuild."""
    p = CORPUS_DIR / "_slug_to_asset.json"
    if not p.exists():
        return {}
    try:
        data = json.loads(p.read_text())
        return data.get("legal_docs", {})
    except Exception:
        return {}


def build_index(
    sheets_override: dict | None = None,
    legal_docs_override: dict | None = None,
) -> None:
    """
    Walk per-doc files, write _index.md and _slug_to_asset.json.

    sheets_override:     if provided, replaces the sheets block for
                         finance-financial-model. If None, preserves existing.
    legal_docs_override: if provided, replaces the top-level legal_docs block.
                         If None, preserves existing.
    """
    docs_by_section: dict[str, list] = {}
    seen_slugs: set[str] = set()

    for section in SECTIONS_ORDER:
        section_dir = CORPUS_DIR / section
        if not section_dir.exists():
            continue
        for md_file in sorted(section_dir.rglob("*.md")):
            text = md_file.read_text()
            meta, body = parse_frontmatter(text)
            slug = meta.get("slug", md_file.stem)
            if slug not in ASSETS:
                raise RuntimeError(
                    f"{md_file} has slug {slug!r} which is not in ASSETS table. "
                    f"Add it to build_index.py before continuing."
                )
            seen_slugs.add(slug)
            docs_by_section.setdefault(section, []).append({
                "slug": slug,
                "title": ASSETS[slug]["title"],
                "body": body.strip(),
            })

    unused = set(ASSETS) - seen_slugs
    if unused:
        print(f"warning: ASSETS keys with no matching MD file: {sorted(unused)}")

    # Build manifest: deep-copy ASSETS so we can mutate safely.
    manifest_slugs = {k: dict(v) for k, v in ASSETS.items()}
    for v in manifest_slugs.values():
        v["file_id"] = _file_id(v)

    # Determine which sheets data to persist.
    sheets_data = sheets_override if sheets_override is not None else _load_existing_sheets()
    if sheets_data:
        manifest_slugs["finance-financial-model"]["sheets"] = sheets_data

    # Persist legal_docs block (separate from corpus slugs).
    # Merge stored upload data (claude_file_id, sha256) with static metadata
    # from LEGAL_DOCS (drive_id, mime_type, serve_as) so both are always present.
    stored = legal_docs_override if legal_docs_override is not None else _load_existing_legal_docs()
    legal_docs_data: dict = {}
    for slug, static in LEGAL_DOCS.items():
        entry = {**static, "file_id": _file_id(static)}
        if slug in stored:
            entry.update(stored[slug])  # upload fields win; static fills gaps
        legal_docs_data[slug] = entry

    manifest: dict = {"slugs": manifest_slugs}
    if legal_docs_data:
        manifest["legal_docs"] = legal_docs_data
    (CORPUS_DIR / "_slug_to_asset.json").write_text(json.dumps(manifest, indent=2))

    # Write _index.md
    out: list[str] = []
    out.append("# Investor Data Room: Corpus Index\n\n")
    out.append(
        "This is the consolidated corpus loaded as the cached system-prompt block in the "
        "investor Q&A app. Each document below is delimited by `<doc id=\"slug\">` tags. "
        "When citing a fact, emit `[doc:slug]`.\n"
    )

    for section in SECTIONS_ORDER:
        if section not in docs_by_section:
            continue
        out.append(f"\n# Section: {SECTION_TITLES[section]}\n")
        for doc in docs_by_section[section]:
            out.append(f'\n<doc id="{doc["slug"]}" title="{doc["title"]}">\n')
            out.append(doc["body"])
            out.append('\n</doc>\n')

    (CORPUS_DIR / "_index.md").write_text("".join(out))

    # Remove the legacy URL map if it still exists.
    legacy = CORPUS_DIR / "_slug_to_url.json"
    if legacy.exists():
        legacy.unlink()
        print(f"Removed legacy {legacy.name}")

    print(f"\nIndexed {len(seen_slugs)} docs across {len(docs_by_section)} sections.")
    for s in SECTIONS_ORDER:
        if s in docs_by_section:
            print(f"  {s}: {len(docs_by_section[s])}")
    print(f"\n_index.md            : {(CORPUS_DIR / '_index.md').stat().st_size:,} bytes")
    print(f"_slug_to_asset.json  : {(CORPUS_DIR / '_slug_to_asset.json').stat().st_size:,} bytes")


# ---------------------------------------------------------------------------
# Sheet extraction + Anthropic Files upload
# ---------------------------------------------------------------------------

def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _extract_csv(wb, sheet_name: str) -> bytes:
    """Return UTF-8 CSV bytes for one worksheet (data_only values)."""
    ws = wb[sheet_name]
    buf = io.StringIO()
    writer = csv_mod.writer(buf)
    for row in ws.iter_rows(values_only=True):
        # Trim trailing None columns so CSVs aren't padded with empty commas.
        cells = list(row)
        while cells and cells[-1] is None:
            cells.pop()
        writer.writerow([("" if c is None else c) for c in cells])
    return buf.getvalue().encode("utf-8")




def upload_sheets(xlsx_path: Path) -> dict:
    """
    Extract per-sheet CSVs from xlsx, upload new/changed ones to Anthropic
    Files API, and return the updated sheets dict for the manifest.

    Idempotent: if a sheet's SHA-256 matches what's already stored, it is
    skipped with no API call.
    """
    try:
        import openpyxl
    except ImportError:
        raise RuntimeError(
            "openpyxl is required for sheet extraction. "
            "Run: pip install openpyxl"
        )
    from anthropic import Anthropic

    client = Anthropic()
    sheets_dir = CORPUS_DIR / "finance" / "sheets"
    sheets_dir.mkdir(parents=True, exist_ok=True)

    # Load what's already in the manifest.
    existing = _load_existing_sheets()

    wb = openpyxl.load_workbook(xlsx_path, data_only=True)
    updated: dict = dict(existing)  # start from existing, patch in changes

    uploaded = skipped = 0

    for tab_name in wb.sheetnames:
        if tab_name in SKIP_SHEETS:
            continue
        slug = SHEET_SLUG_MAP.get(tab_name)
        if slug is None:
            print(f"  warning: unrecognised tab '{tab_name}', skipping")
            continue

        csv_bytes = _extract_csv(wb, tab_name)
        sha = _sha256(csv_bytes)
        csv_path = sheets_dir / f"{slug}.csv"

        # Write CSV to disk regardless (keeps local files in sync with xlsx).
        csv_path.write_bytes(csv_bytes)

        stored = existing.get(slug, {})
        if stored.get("sha256") == sha and stored.get("claude_file_id"):
            skipped += 1
            print(f"  {slug}: unchanged — skipping upload")
            continue

        # Upload to Anthropic Files API.
        print(f"  {slug}: uploading …", end="", flush=True)
        file_resp = client.beta.files.upload(
            file=(f"{slug}.csv", io.BytesIO(csv_bytes), "text/plain"),
        )
        file_id = file_resp.id
        updated[slug] = {
            "title": SHEET_TITLE_MAP.get(slug, tab_name),
            "csv_path": f"finance/sheets/{slug}.csv",
            "claude_file_id": file_id,
            "sha256": sha,
        }
        uploaded += 1
        print(f" {file_id}")

    print(f"\nSheets: {uploaded} uploaded, {skipped} unchanged.")
    return updated


def upload_legal_docs(legal_docs_dir: Path) -> dict:
    """
    Scan legal_docs_dir for PDFs matching filenames in LEGAL_DOCS, upload
    new/changed ones to Anthropic Files API, and return the updated legal_docs
    dict for the manifest.

    Idempotent: files whose SHA-256 matches the stored value are skipped.
    """
    from anthropic import Anthropic

    client = Anthropic()
    existing = _load_existing_legal_docs()
    updated: dict = dict(existing)

    uploaded = skipped = missing = 0

    for slug, meta in LEGAL_DOCS.items():
        pdf_path = legal_docs_dir / meta["filename"]
        if not pdf_path.exists():
            print(f"  {slug}: not found at {pdf_path} — skipping")
            missing += 1
            continue

        pdf_bytes = pdf_path.read_bytes()
        sha = _sha256(pdf_bytes)

        stored = existing.get(slug, {})
        if stored.get("sha256") == sha and stored.get("claude_file_id"):
            skipped += 1
            print(f"  {slug}: unchanged — skipping upload")
            continue

        print(f"  {slug}: uploading …", end="", flush=True)
        file_resp = client.beta.files.upload(
            file=(meta["filename"], io.BytesIO(pdf_bytes), "application/pdf"),
        )
        file_id = file_resp.id
        updated[slug] = {
            "title": meta["title"],
            "filename": meta["filename"],
            "category": meta["category"],
            "claude_file_id": file_id,
            "sha256": sha,
        }
        uploaded += 1
        print(f" {file_id}")

    print(f"\nLegal docs: {uploaded} uploaded, {skipped} unchanged, {missing} not found.")
    if missing:
        print(
            "  Place the missing PDFs in the legal-docs directory and re-run "
            "--upload-legal-docs."
        )
    return updated


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Rebuild the corpus index (and optionally upload files)."
    )
    parser.add_argument(
        "--upload-files",
        action="store_true",
        help="Extract per-sheet CSVs from the financial model xlsx and upload to Anthropic Files API.",
    )
    parser.add_argument(
        "--xlsx",
        metavar="PATH",
        help="Local path to the xlsx. If omitted, uses corpus/finance/financial_model.xlsx.",
    )
    parser.add_argument(
        "--upload-legal-docs",
        action="store_true",
        help="Upload new/changed legal/governance PDFs to the Anthropic Files API.",
    )
    parser.add_argument(
        "--legal-docs-dir",
        metavar="PATH",
        help="Directory containing the legal PDFs. Defaults to corpus/legal/.",
    )
    args = parser.parse_args()

    sheets_override: dict | None = None
    legal_docs_override: dict | None = None

    if args.upload_files:
        if args.xlsx:
            xlsx_path = Path(args.xlsx).expanduser().resolve()
            if not xlsx_path.exists():
                print(f"error: --xlsx path not found: {xlsx_path}", file=sys.stderr)
                return 1
        else:
            xlsx_path = CORPUS_DIR / "finance" / "financial_model.xlsx"
            if not xlsx_path.exists():
                print(
                    f"error: xlsx not found at {xlsx_path}\n"
                    "Pass --xlsx PATH to specify the file location.",
                    file=sys.stderr,
                )
                return 1

        print(f"Extracting sheets from {xlsx_path.name} …")
        sheets_override = upload_sheets(xlsx_path)

    if args.upload_legal_docs:
        legal_dir = (
            Path(args.legal_docs_dir).expanduser().resolve()
            if args.legal_docs_dir
            else CORPUS_DIR / "legal"
        )
        if not legal_dir.exists():
            print(
                f"error: legal-docs directory not found: {legal_dir}\n"
                "Create it and place the PDFs there, or pass --legal-docs-dir PATH.",
                file=sys.stderr,
            )
            return 1
        print(f"Uploading legal docs from {legal_dir} …")
        legal_docs_override = upload_legal_docs(legal_dir)

    build_index(sheets_override=sheets_override, legal_docs_override=legal_docs_override)
    return 0


if __name__ == "__main__":
    sys.exit(main())
