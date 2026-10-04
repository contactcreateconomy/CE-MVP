---
id: CR-012
type: CR-REQUEST
author-model: GLM
status: OPEN
date: 2026-10-04
---

# CR-012 — Legitimacy account_age should read `users.createdAt ?? _creationTime`

Territory: convex. Retires CR-010b / gate decision D-1 (PM decision A5.4).
Why: `convex/jobs/legitimacy.ts:142-143` computes the `account_age` component from `users._creationTime`. `_creationTime` cannot be backdated in Convex 1.34.1 (stripped from inserts — `database.d.ts:184-189`), so every user inserted by a backfilled/migrated/imported corpus scores `account_age = days/180 ≈ 0`; the `1e-9` floor (`legitimacy.ts:44-47`) only prevents a literal zero — the geometric mean still collapses to roughly the same tiny value for all such users, flattening legitimacy-weighted Signals, reach and the honest-vs-bad-actor contrast the demo world exists to test. `users.createdAt` is the field signup actually writes (`lib/founder.ts:156`, `canonicalSignupFields`) and both existing seeders set it.
Ask: read `createdAt ?? _creationTime` for the account-age component. One-line change, demo-agnostic (any backdated user corpus hits the same bug). Test: legitimacy account_age with a backdated `createdAt` vs `_creationTime`.
Reply in `CR-012-RESPONSE.md` (TEAM-WORKFLOW format). Status in this header is updated by Opus only.
