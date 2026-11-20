# Architecture

## The request

Every chat turn is one Messages API call with two system blocks and the conversation history:

```
system = [
  { type: "text", text: <PROMPT.md rules block> },                           // not cached, iterate freely
  { type: "text", text: <corpus/_index.md>, cache_control: { type: "ephemeral" } }  // cached
]
messages    = conversation history; the last user message may carry document blocks
tools       = [respond]            // structured output schema
tool_choice = { type: "tool", name: "respond" }
temperature = 0.1
```

The rules block is small and changes often, so it is not cached. The corpus block is large and stable, so it is. After the first request in a cache window, corpus tokens are billed at the cache-read rate. The split is the whole point: you can edit the prompt all day without paying to re-cache the corpus.

The `respond` tool forces structured output: `tldr` (one sentence), `blocks` (paragraph, kpi-grid, table), and `sources` (slug and title for every citation). The UI never parses prose. Refusals come back as the fixed sentence in `tldr` with an empty `blocks` list.

## The corpus

`corpus/<section>/*.md`, one file per document, with `slug`, `title`, `note` frontmatter. `corpus/build_index.py` concatenates them into `corpus/_index.md` as `<doc id="slug" title="...">` blocks grouped by section, and writes `corpus/_slug_to_asset.json`, the citation manifest.

The manifest is the contract between the model and the UI. For each slug: title, filename, mime type, how to serve it, and a `file_id` the UI passes to `/api/library/files/<id>`. In Drive mode the id is the Drive file id. In local mode it is `local_` plus the base64url of the path under `corpus/library/`.

Nothing in the corpus is retrieved. It is all there, every time.

## Cell-level questions: the sheet router

A curated summary of a ten-tab model cannot answer "what is Q4 net revenue in the model?". So:

1. `build_index.py --upload-files` extracts every tab of `corpus/finance/financial_model.xlsx` to CSV, hashes it, and uploads new or changed tabs to the Anthropic Files API once. File ids and hashes go into the manifest under the model's slug.
2. At question time, `sheet_router` picks up to four tabs. First a regex table per tab (`revenue`, `net income`, `p&l` for the P&L tab, and so on). If nothing matches, a Haiku call classifies the question against the tab list. Nothing matches, nothing attached.
3. The chosen CSVs go on the last user message as document blocks, and a short addendum is appended to the rules block: the CSV is the source of truth for cell values, cite only the parent model slug, what-if questions are still refused.

The same pattern runs for contracts: `legal_doc_router` attaches up to two PDFs from `corpus/legal/` when the question names a partner, a clause, or a corporate-structure term, with an addendum that says quote the clause, keep the qualifications, no legal advice, cite the slug. Legal attachments are gated to the full-access group. Both routers run in parallel.

Python and JavaScript versions of each router exist (`corpus/*.py` for the playground and eval, `web/src/lib/*.js` for the app). Keep the keyword tables in sync.

## The web app

Next.js App Router. Routes under `web/src/app/api/`:

- `auth/request-code`, `auth/verify-code`, `auth/me`, `auth/logout`: email OTP with an allowlist in the KV store, signed JWT session cookie, 7-day expiry. Without `RESEND_API_KEY` the code is printed to the server console.
- `chat`: the call above, plus routing, plus the per-group corpus filter.
- `library`, `library/files/[fileId]`: folder listing and file streaming through the backend. Investors never see a Drive link. Backend is Google Drive when `GOOGLE_SERVICE_ACCOUNT_KEY` is set, otherwise a local directory.
- `threads`: per-user conversation history.
- `admin/users/*`, `admin/chats/*`: invite, deactivate, delete, re-invite, change group, grant admin; read-only browser of every user's conversations.

Access groups: `full` sees everything. `financial-only` sees only the financial model slug in chat and only the configured library folders. One file, `web/src/lib/access.js`, defines both.

The KV store is Redis through ioredis when `REDIS_URL` is set, otherwise an in-process map (demo only).

## The eval

`playground/eval.py` runs `eval_questions.json` against the live API and writes a markdown report. Grading is deliberately crude: substring checks for required and forbidden phrases, slug presence for citations, exact-substring check for refusal sentences. The crudeness is a feature. It forces the refusal strings in `PROMPT.md` to stay exact, and it keeps the questions honest. Read the answers, not just the pass count.

Two flags attach files the way the app does: `--enable-sheets` and `--enable-legal-docs`. A question can carry a `with_legal_docs` block when its expectation flips between modes (a refusal becomes a quote).

## What is deliberately out

- Vector search. Add it when the corpus no longer fits, not before.
- Streaming to the client. The forced tool call returns the whole structured answer; the UI shows a thinking state. The Streamlit playground streams for prompt iteration.
- Deep links into pages or cells. Citations resolve to whole files. The sheet addendum names the tab in prose.
- Any computation. What-if questions are refused and sent to the real spreadsheet.
