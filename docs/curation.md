# Curating a corpus

The corpus is editorial work. The agent does the typing, a human makes the cut. These are the rules that held up under investor questions.

## One document, one file

Each document becomes one markdown file under `corpus/<section>/` with frontmatter:

```
---
slug: product-overview
title: Product Overview
note: Current product, pricing, and 2026 roadmap. Source of truth for pricing.
---
```

The `note` is read by the model. Use it to say what the document is for and, when it matters, that it is the source of truth for something. Sections are `overview`, `acquisition`, `product`, `finance`; the order is set in `build_index.py`.

Write plain prose with the numbers in it. Tables are fine for anything tabular. Keep each document to the length a careful analyst would read: 300 to 700 words for most, more for the financial model.

## What to leave out, and write it down

Exclude by default:

- Legal contracts, corporate records, equity instruments, IP filings, employment agreements. They are long, they are precise, and they belong in the legal router (attached on demand) rather than in the corpus.
- Superseded versions of anything. Two documents with two prices means the model picks one. If the old one must stay for history, mark it superseded in the title, the note, and the body, and name the document that replaces it.
- Low-signal files: org charts as images, internal data sheets, chart-only decks with no text.

Keep an exclusion list in your own notes or in the manifest. The next person to touch the corpus will otherwise add them back.

## Numbers of record

When the same figure appears in several documents, decide which one is the figure of record and say so in the frontmatter note of that document. The prompt tells the model to prefer the financial model for financial outputs and the most recent document otherwise. The corpus must make that preference possible.

Watch for currency and unit traps. A cap table with a placeholder cell in another currency will get quoted. A monthly input that is multiplied inside a tab will get a theory invented about it. If a coefficient or formula label needs explaining, explain it in the document; the prompt forbids the model from inventing mechanics.

## The financial model: three layers per tab

A spreadsheet pasted as text is noise. Extract each tab in three layers:

1. **Purpose.** One or two sentences: what the tab is and what feeds it.
2. **Key values observed.** A small table of the numbers an investor would actually ask for: annual totals, the quarters that matter, the headline ratios. Not every cell.
3. **Narrative.** Two hundred words of plain English on what the tab shows, the trend, and any caveat.

Then add a hard rule to the prompt: no what-if. A static extract cannot recompute the model, and the model will try if you let it. Cell-level precision comes from the sheet router, which attaches the real CSV of the relevant tabs at question time.

## Chart-only documents

Export to PDF and let the model read the chart visually, then write the values into the markdown with an explicit note that bar values are estimates and only labeled numbers are exact. Reconcile against any other document that reports the same thing and say which one wins.

## Refresh

When source documents change: edit the markdown, run `make index`, run the eval. If the spreadsheet changed, run `make upload` (only changed tabs are re-uploaded) and `make eval-files`. Corpus drift is the most common way answers go stale; make the refresh a habit, not a project.
