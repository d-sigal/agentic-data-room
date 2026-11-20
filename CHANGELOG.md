# Changelog

## 0.1.0 (unreleased)

First public release.

- Chat over a curated, prompt-cached corpus with `[doc:slug]` citations and fixed refusals.
- Structured answers: TLDR, paragraph, KPI grid, table, sources.
- Sheet router: spreadsheet tabs attached as CSV through the Files API for cell-level questions.
- Legal router: contract PDFs attached on demand, quoted not paraphrased, gated to full access.
- Email OTP login, allowlist, two access groups, admin user management, admin chat browser.
- Document library served through the backend from Google Drive or a local directory.
- Eval runner with baseline and files modes.
- Sample data room: Probably Covered Inc., ten documents, a 10-tab model, three contracts, 15-question eval.
- `make demo` ten-minute setup with in-memory store and local library.
- Security hardening before release: required `AUTH_SECRET` in production, OTP attempt limit and constant-time compare, path normalization in the local library, server-derived folder access checks, admin-only user listing, allowlist re-check on every request, markdown link scheme allowlist, request size limits, security headers, Sentry tunnel left to the framework.
