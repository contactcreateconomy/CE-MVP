---
id: S00-PREP-REVIEW-R2
type: REVIEW
author-model: Grok
tool: Cursor
round: R2
status: ACTIVE
date: 2026-09-28
---

# S00-PREP re-review — guard fix (`1ea46e8`)

Re-ran the round-1 attacks against `convex/seed/devGuard.ts`, `scripts/lib/local-gate.mjs`, `scripts/reset-local.mjs`, `scripts/seed-demo.mjs`. Did not run a wipe, and did not execute the multi-colon selector (it would contact the cloud).

## Verdict: PASS WITH FIXES

Round-1 wipe paths are closed. Shell `CONVEX_DEPLOY_KEY` + `CONVEX_URL` are stripped before spawn. `CONVEX_DEPLOYMENT=anonymous:energetic-kangaroo-55` exits 1 from both `seed:demo` and `reset:local` (with a long password) before any CLI call. Missing password exits 1 before the wipe. Direct `seed/demo:seed` is covered: all four mutations call the loopback allowlist (`demo.ts:231`, `573`, `703`, `1170`). Probed that regex: named prod, other `https://*.convex.cloud` hosts, `127.0.0.1.evil.example`, userinfo tricks, and unset all refuse; `http://127.0.0.1:3210` and `http://localhost:3210` pass. Membership 28 and the three-layer wording in README / SETUP-REPORT-R3 are in the tree.

## SHOULD-FIX

- `scripts/lib/local-gate.mjs:86` — the selector is a prefix, not an exact name. `anonymous:anonymous-x:energetic-kangaroo-55` and `local:local-foo:energetic-kangaroo-55` both match. The CLI keeps only the last `:` segment (`deployment.ts:14-16`); for the `anonymous:` form that segment is not an `anonymous-*` name, so it resolves in the cloud project. `scripts/seed-check.mjs:11` has no preflight, so this path actually runs. `reset:local` / `seed:demo` still hit `preflightDevGuard` first. Why it matters: the gate still does not name the deployment the CLI will use, and `seed:check` has no second layer.
- `scripts/lib/local-gate.mjs:143-151` — a non-zero child whose status is `3221226505` or whose stderr matches `UV_HANDLE_CLOSING` is treated as a passed preflight when the refusal text is absent. Round-1 `convexRun` required non-empty stdout; this check does not. Why it matters: that is the remaining way a retargeted `import --replace-all` runs after a crash that ate the guard error.

## NIT

- `ak-redesign/00-control/history/SETUP-REPORT-R3.md:119-128` — "the key never reaches the child" is true for the shell. It is not true for a key stored in `.env.local`: the CLI reloads that file with `dotenv.config` after spawn (`deploymentSelection.ts:115-117`). Preflight still refuses a cloud URL, so this does not by itself wipe.
- `ak-redesign/00-control/history/SETUP-REPORT-R3.md:56` — still says 21 volatile tables. `feedExplorationState` made it 22 (`seed-check.mjs:31-38`). The v2 fingerprint note itself matches the code.
