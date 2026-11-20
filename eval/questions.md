# Eval question set

Fifteen questions for the Probably Covered sample data room. The machine-readable version is `playground/eval_questions.json`. Each question lists what the answer must include, which document slugs it should cite, and, for refusal cases, the exact phrase the bot is expected to use.

Refusal phrases are checked verbatim:

- Off-corpus questions: "not covered in the data room"
- What-if questions that need the model re-run: "running the live model"
- Legal document questions when legal docs are not attached: "isn't in this corpus"

## Easy lookup

### 1. easy-growth-price

Question: What does the Growth plan cost?

Expected answer: $4,000 per month platform fee plus an 18% take rate on gross written premium. Cite `product-overview`.

Must include: `$4,000`, `18%`. Must not include: `$3,500` (the superseded 2024 price).

### 2. easy-partner-count

Question: How many distribution partners are signed?

Expected answer: 14 signed distribution partners as of September 30, 2026. Cite `acquisition-partners`.

Must include: `14`.

### 3. easy-team-size

Question: How many people work at Probably Covered and what share is engineering?

Expected answer: 84 FTEs, of which 39 (46%) are in engineering and data. Cite `finance-kpis`.

Must include: `84`, `46%`.

## Financial

### 4. financial-2028-revenue

Question: What is projected net revenue in 2028?

Expected answer: $176.0M in the base case. Cite `finance-financial-model`.

Must include: `$176`.

### 5. financial-2025-gross-margin

Question: What was gross margin in 2025?

Expected answer: 71%. Cite `finance-financial-model`.

Must include: `71%`.

### 6. financial-nrr

Question: What is net revenue retention?

Expected answer: 131% as of Q3 2026. Cite `finance-kpis`.

Must include: `131%`.

### 15. financial-x3-multiplier

Question: What does the x3 in the Revenue Build tab mean?

Expected answer: Attach rate is entered as a monthly input, so the Revenue Build tab multiplies the monthly policy count by 3 to get a quarterly policy count. It is a month-to-quarter calendar conversion, not a policy duration or a three-period assumption. Cite `finance-financial-model`.

Must include: `monthly`, `quarterly`. Must not include the fabricated rationales: `three consecutive months`, `seasonality factor`, `stock versus flow`, `renewal factor applied`. Denying them ("it is not a duration") is fine.

## Refusal

### 7. refusal-what-if

Question: What would 2028 revenue be if the attach rate doubled?

Expected answer: Decline to compute. The data room holds static model outputs; answering requires running the live model, which the finance team can do on request. May state the base case ($176.0M at a 13.5% attach rate) and cite `finance-financial-model`.

Expected refusal phrase: `running the live model`.

### 8. refusal-off-corpus

Question: What is the population of Texas?

Expected answer: Decline. The topic is not covered in the data room. No citation.

Expected refusal phrase: `not covered in the data room`. Must not include: `million`.

### 9. refusal-legal

Question: What does clause 7.2 of the Yuber agreement say?

Expected answer without `--enable-legal-docs`: Decline, because the Yuber agreement text isn't in this corpus. The bot may say that the memo and partner docs summarize the agreement (three-year term from May 1, 2025, 25% revenue share) but must not quote or paraphrase the clause.

Expected refusal phrase: `isn't in this corpus`. Must not include: `exclusiv`.

Note: with `--enable-legal-docs`, the expected behavior flips. Clause 7.2 of `contract-partner-yuber.pdf` is the exclusivity clause (US exclusivity for gig-worker coverage), and the bot should quote it and cite `contract-partner-yuber`. The JSON carries a `with_legal_docs` block that the runner swaps in for that mode.

## Synthesis

### 10. synthesis-roadmap

Question: Walk me through the 2026 roadmap by quarter.

Expected answer: Q1 eBuy launch and claims automation v2; Q2 Dublin entity live for EU partners; Q3 parametric flight-delay product; Q4 self-serve Starter tier and a 20-partner target. Cite `product-overview`.

Must include: `eBuy`, `Dublin`, `parametric`, `self-serve`.

### 11. synthesis-competitive

Question: Who are the main competitors?

Expected answer: Kovr (closest, embedded insurance API, Europe-first), Bolt-On Protect (gadget-only), Trovr (consumer app, not B2B), and legacy carriers' direct APIs. Cite `product-competitive-landscape`.

Must include: `Kovr`, `Bolt-On`.

### 12. synthesis-risks

Question: What are the biggest concentration risks?

Expected answer: Carrier concentration (Alpha Mutual underwrites 58% of GWP) and partner concentration (Yuber is 34% of GWP). May also mention state-by-state regulatory risk. Cite `overview-investor-memo`.

Must include: `Alpha Mutual`, `Yuber`.

## Cell lookup

### 13. cell-q4-2026-revenue

Question: What is Q4 2026 net revenue in the model?

Expected answer: $20.4M (Q4 2026E). Cite `finance-financial-model`.

Must include: `20.4`.

Note: designed for `--enable-sheets`. The value is on the KPIs tab, the P&L tab, and the Revenue Build tab of `financial_model.xlsx`. It is also in the model doc, so the question passes without sheets.

### 14. cell-valuation-last-round

Question: What was the valuation at the last round?

Expected answer: $95.0M post-money at the Series A ($4.12 per share x 23,058,252 fully diluted shares = $94,999,998). Cite `finance-cap-table`.

Must include: `$95`. Must not include: `87.4`, `EUR`, the euro sign.

Note: the cap table carries a legacy "Post-money (EUR, Dublin filing)" cell of 87.4M EUR. It is a statutory filing artifact, not a valuation basis.

## How to run

```
cd playground
export ANTHROPIC_API_KEY=sk-ant-...
python eval.py
```

Options:

- `--enable-sheets` attaches per-question CSV extracts of `financial_model.xlsx` (uploaded by `corpus/build_index.py --upload-files`). Use this to test the cell lookup questions against the workbook itself.
- `--enable-legal-docs` attaches the legal PDFs from `corpus/legal/` (uploaded by `corpus/build_index.py --upload-legal-docs`). With this flag, question 9 is expected to quote clause 7.2 instead of refusing.
- `--model <model-id>` overrides the default model.

The runner writes a markdown report to `playground/eval-report-<timestamp>.md` with one section per question showing the answer, citations, and pass or fail on each check.
