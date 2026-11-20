# The eval loop

Write the questions before the first prompt. Grow them with every bug.

## Shape

`playground/eval_questions.json` is a list. Each entry:

```json
{
  "id": "easy-growth-price",
  "category": "easy lookup",
  "question": "What does the Growth plan cost?",
  "must_include": ["$4,000", "18%"],
  "expected_citations": ["product-overview"],
  "must_not_include": ["$3,500"],
  "_note": "The superseded pricing sheet lists $3,500."
}
```

Optional keys: `expected_refusal_phrase` (exact substring of a refusal sentence in `PROMPT.md`), `with_legal_docs` (an object whose keys replace the question's when the runner is in legal-docs mode, for questions where a refusal should become a quote).

Keep five buckets: easy lookups, financial figures, refusals (off-corpus, what-if, legal), multi-document synthesis, cell lookups. Keep ids stable.

## Grading

Substring match on `must_include` and `must_not_include`, slug presence for `expected_citations`, substring for the refusal phrase. All must pass for a question to count. A failure prints which check failed, which points at the right thing to fix: `must_include` is usually the corpus, `expected_citations` is usually the prompt's citation rules, the refusal check is usually a drifted refusal string.

Crude grading is a feature. It keeps the refusal wording exact and makes the questions precise. But read the answers in the report, not only the pass count. A pass with a wrong explanation is a bug you have not written a test for yet.

## Modes

```bash
make eval         # corpus only
make eval-files   # sheets and legal PDFs attached through the routers
```

Run both before shipping a prompt or corpus change. They fail differently. Baseline catches corpus and prompt regressions; files mode catches router and addendum regressions.

## When a question is wrong

The question can be wrong. The x3 question in the sample was first written with an expected explanation that was itself a guess; the correct fix was to document the multiplier in the corpus and rewrite the expectation. If an answer looks right and the grader disagrees, check the grader first. Forbid the fabricated rationales, not the words a correct answer needs to deny them.

## What the history looked like

In the original deployment the set roughly doubled over two weeks and the pass rate dipped three times: a prompt tweak that broke citations, the first run with spreadsheet attachments, and a corpus resync. All three were caught within minutes because the eval ran after every change.
