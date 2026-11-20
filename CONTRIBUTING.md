# Contributing

Issues and pull requests are welcome. A few things that make them easy to merge.

## Before you open a PR

- `make eval` and `make eval-files` pass on the sample corpus, or the PR explains which expectations changed and why.
- `make check` passes: no secrets, production build green.
- The Python and JavaScript routers stay in sync if you touched either.
- No company data, no real names, no document ids. The sample corpus is fictional on purpose. If you add sample documents, keep them that way.

## Good first contributions

- Loaders for other sources: Notion, Confluence, SharePoint, a plain folder of PDFs.
- A second library backend (S3, Dropbox).
- Streaming for the structured answer.
- More eval questions that catch real failure modes you have seen.
- Translations of `PROMPT.md` with the refusal strings kept exact.

## Style

American English in docs and UI copy. Plain sentences. No em dashes.

## Recording a walkthrough

`docs/media/record-walkthrough.js` is a `playwright-cli` hero script. Log in once in a named session, run the script, and convert the WebM with ffmpeg. Re-record when the UI changes.
