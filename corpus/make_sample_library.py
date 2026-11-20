"""
Builds corpus/library/ (the files the document library serves and citations
open) from the sample corpus:

  - each per-doc markdown file is rendered to a PDF named as in the manifest
  - the financial model xlsx is copied into Finance/
  - a small Cap Table.xlsx is generated
  - the sample legal PDFs are copied into Legal/

Run after editing the sample docs:  python3 corpus/make_sample_library.py
Needs: reportlab, openpyxl.
"""
import json
import re
import shutil
from pathlib import Path

from openpyxl import Workbook
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors

CORPUS = Path(__file__).parent
LIB = CORPUS / "library"
SECTION_DIR = {"overview": "Overview", "acquisition": "Acquisition", "product": "Product", "finance": "Finance"}

manifest_path = CORPUS / "manifest.json"
if not manifest_path.exists():
    manifest_path = CORPUS / "manifest.example.json"
MANIFEST = json.loads(manifest_path.read_text())


def parse_frontmatter(text):
    if not text.startswith("---\n"):
        return {}, text
    end = text.find("\n---\n", 4)
    meta = {}
    for line in text[4:end].split("\n"):
        if ":" in line:
            k, _, v = line.partition(":")
            meta[k.strip()] = v.strip()
    return meta, text[end + 5:]


def inline(md):
    md = md.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    md = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", md)
    md = re.sub(r"`(.+?)`", r"<font face='Courier'>\1</font>", md)
    return md


def md_to_flowables(md, styles):
    out = []
    lines = md.split("\n")
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        if not line:
            i += 1
            continue
        if line.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                if not all(re.fullmatch(r":?-{2,}:?", c) for c in cells):
                    rows.append([Paragraph(inline(c), styles["cell"]) for c in cells])
                i += 1
            if rows:
                t = Table(rows, hAlign="LEFT", repeatRows=1)
                t.setStyle(TableStyle([
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
                    ("BACKGROUND", (0, 0), (-1, 0), colors.whitesmoke),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]))
                out.append(t)
                out.append(Spacer(1, 8))
            continue
        m = re.match(r"^(#{1,4})\s+(.*)", line)
        if m:
            level = len(m.group(1))
            out.append(Paragraph(inline(m.group(2)), styles[f"h{min(level, 3)}"]))
            i += 1
            continue
        if re.match(r"^\s*[-*]\s+", line) or re.match(r"^\s*\d+\.\s+", line):
            while i < len(lines) and (re.match(r"^\s*[-*]\s+", lines[i]) or re.match(r"^\s*\d+\.\s+", lines[i])):
                text = re.sub(r"^\s*([-*]|\d+\.)\s+", "", lines[i])
                out.append(Paragraph("• " + inline(text), styles["bullet"]))
                i += 1
            out.append(Spacer(1, 4))
            continue
        para = [line]
        i += 1
        while i < len(lines) and lines[i].strip() and not lines[i].startswith(("|", "#", "-", "*")) and not re.match(r"^\s*\d+\.\s+", lines[i]):
            para.append(lines[i].rstrip())
            i += 1
        out.append(Paragraph(inline(" ".join(para)), styles["body"]))
        out.append(Spacer(1, 6))
    return out


def make_styles():
    ss = getSampleStyleSheet()
    return {
        "h1": ParagraphStyle("h1", parent=ss["Heading1"], fontSize=18, spaceAfter=10),
        "h2": ParagraphStyle("h2", parent=ss["Heading2"], fontSize=14, spaceBefore=10, spaceAfter=6),
        "h3": ParagraphStyle("h3", parent=ss["Heading3"], fontSize=11.5, spaceBefore=8, spaceAfter=4),
        "body": ParagraphStyle("body", parent=ss["BodyText"], fontSize=9.5, leading=13),
        "bullet": ParagraphStyle("bullet", parent=ss["BodyText"], fontSize=9.5, leading=13, leftIndent=12),
        "cell": ParagraphStyle("cell", parent=ss["BodyText"], fontSize=8, leading=10),
        "meta": ParagraphStyle("meta", parent=ss["BodyText"], fontSize=8, textColor=colors.grey),
    }


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.grey)
    canvas.drawString(0.75 * inch, 0.5 * inch, "SAMPLE DATA ROOM DOCUMENT. Probably Covered Inc. is fictional.")
    canvas.drawRightString(LETTER[0] - 0.75 * inch, 0.5 * inch, f"Page {doc.page}")
    canvas.restoreState()


def render_pdf(md_path, out_path, title):
    meta, body = parse_frontmatter(md_path.read_text())
    styles = make_styles()
    doc = SimpleDocTemplate(str(out_path), pagesize=LETTER, leftMargin=0.75 * inch, rightMargin=0.75 * inch, topMargin=0.75 * inch, bottomMargin=0.8 * inch, title=title)
    flow = [Paragraph(title, styles["h1"])]
    if meta.get("note"):
        flow.append(Paragraph(inline(meta["note"]), styles["meta"]))
    flow.append(Spacer(1, 10))
    flow += md_to_flowables(body, styles)
    doc.build(flow, onFirstPage=header_footer, onLaterPages=header_footer)


def make_cap_table_xlsx(out_path):
    wb = Workbook()
    ws = wb.active
    ws.title = "Cap Table"
    rows = [
        ["Probably Covered Inc. cap table, fully diluted after Series A (September 2026)"],
        [],
        ["Holder", "Shares", "Ownership"],
        ["Founders", 9_500_000, 0.412],
        ["Series A investors", 4_381_068, 0.190],
        ["Seed investors", 2_836_165, 0.123],
        ["ESOP pool (12.0%, of which 7.1% granted)", 2_766_990, 0.120],
        ["Angels", 3_574_029, 0.155],
        ["Total fully diluted", 23_058_252, 1.0],
        [],
        ["Series A original issue price (USD)", 4.12],
        ["Valuation at last round (USD) = OIP x fully diluted shares", 94_999_998],
        ["Post-money (EUR, Dublin filing)", 87_400_000],
    ]
    for r in rows:
        ws.append(r)
    for row in ws.iter_rows(min_row=4, max_row=9):
        row[2].number_format = "0.0%"
    ws.column_dimensions["A"].width = 58
    ws.column_dimensions["B"].width = 16
    wb.save(out_path)


def main():
    if LIB.exists():
        shutil.rmtree(LIB)
    for d in list(SECTION_DIR.values()) + ["Legal"]:
        (LIB / d).mkdir(parents=True)

    rendered = copied = 0
    for section, folder in SECTION_DIR.items():
        for md in sorted((CORPUS / section).glob("*.md")):
            meta, _ = parse_frontmatter(md.read_text())
            slug = meta.get("slug", md.stem)
            asset = MANIFEST["assets"].get(slug)
            if not asset:
                print(f"skip {md}: slug {slug} not in manifest")
                continue
            target = LIB / asset["local_path"]
            if target.suffix == ".pdf":
                render_pdf(md, target, asset["title"])
                rendered += 1
            elif target.suffix == ".xlsx":
                if slug == "finance-financial-model":
                    shutil.copy(CORPUS / "finance" / "financial_model.xlsx", target)
                elif slug == "finance-cap-table":
                    make_cap_table_xlsx(target)
                copied += 1
    for slug, doc in MANIFEST["legal_docs"].items():
        src = CORPUS / "legal" / doc["filename"]
        if src.exists():
            shutil.copy(src, LIB / doc["local_path"])
            copied += 1
        else:
            print(f"warning: {src} not found")
    print(f"library built at {LIB}: {rendered} PDFs rendered, {copied} files copied")


if __name__ == "__main__":
    main()
