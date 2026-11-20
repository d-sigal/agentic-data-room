# Security

This app handles confidential company data by design. Read this before deploying it with real documents.

## Data handling

- **Use a dedicated Anthropic workspace** for the data room, with a key used nowhere else, and confirm the retention and training settings for your account. The corpus, the attached spreadsheets and contracts, and every investor question go to the API.
- **Files API uploads persist** until deleted. `make upload` uploads spreadsheet tabs and contract PDFs. Delete them from the workspace when a raise closes.
- **Investors never get a storage link.** Files stream through `/api/library/files/<id>` behind the session. In Drive mode the service account needs viewer access only.
- **The chat log is sensitive.** `User chats` shows every question every investor asked. Admins only. Treat it like the data room itself.
- **Logs.** The server logs login attempts, file access, and errors with emails. Point `pino` at a sink you control. Sentry and Hotjar are off unless configured; if you enable them, review what they capture.

## Access

- Allowlist with email OTP. Nobody not on the list can request a code; unknown emails get a generic success response so the list is not enumerable.
- Two groups. `financial-only` sees a subset of the corpus and the library. Define it in `web/src/lib/access.js`.
- Sessions are signed JWTs in an HttpOnly, Secure, SameSite=Strict cookie, seven days. `AUTH_SECRET` is required in production; the server refuses to start without one.
- Rate limit of one code request per minute per email, applied before the allowlist check. Codes come from a CSPRNG, expire after five minutes, and are invalidated after five wrong guesses. Every failure returns the same message.
- Every API route re-checks the allowlist on each call, so deactivating or deleting a user cuts off their existing session immediately.
- File ids are normalized and checked against the library root; the top-level folder used for group checks is derived server-side.

## What the app does not do

- It does not stop a logged-in investor from copying answers. The UI banner should say so.
- It does not encrypt the KV store. Redis holds sessions, threads, the allowlist, and cached listings. Use a managed Redis with auth and TLS.
- It does not validate uploaded documents. The corpus is trusted input.

## Local demo mode

Without `REDIS_URL` the store is in memory and without `GOOGLE_SERVICE_ACCOUNT_KEY` the library is a local directory. Both are for `make demo` on a laptop. File ids in local mode encode a path and are checked against the library root; a path outside it returns 404.

## Reporting

Open a private security advisory on the repository or email the maintainer listed in the repo profile. Do not open a public issue for a vulnerability.
