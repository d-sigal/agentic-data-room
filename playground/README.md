# Playground

Streamlit chat for iterating on `PROMPT.md` against the corpus, and the eval runner. Not for investor-facing use.

## Run

```bash
make setup                      # once
set -a && source .env && set +a
cd playground && streamlit run app.py
```

Opens on http://localhost:8501. Edit `../PROMPT.md` while it runs; the next message picks up the change. The sidebar shows last-turn citations and token usage including the cache hit rate: the first turn writes the cache, later turns should show mostly cache reads.

Set `LANGSMITH_API_KEY` and `LANGSMITH_PROMPT` to pull the rules block from LangSmith Hub instead of the file. Set `LANGSMITH_TRACING=true` to trace.

## Eval

```bash
make eval          # corpus only
make eval-files    # sheets and legal docs attached (run `make upload` first)
python eval.py --model claude-sonnet-4-6 --out report.md
```

Writes `eval-report-<timestamp>.md` with every answer and its auto-grades. See `../docs/eval.md`.

## Notes

- `python3 corpus/build_index.py` regenerates `_index.md` and `_slug_to_asset.json` after any corpus change. The playground reads both from disk per request.
- A citation to a slug that is not in the manifest is a hallucinated slug. Tighten the prompt or fix the corpus.
