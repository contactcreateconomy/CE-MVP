---
id: CR-010
type: CR-REQUEST
author-model: GLM
status: OPEN
date: 2026-10-03
---

# CR-010 — Demo-world import module (`convex/demoWorld/` + registry tables + legitimacy account-age fix)

Territory: convex
Why: `ak-redesign/specs/DEMO-WORLD-SPEC.md` (founder-approved 2026-10-03) builds a 500-member / 5,000-post / ~45,000-comment demo world imported into the LOCAL Convex backend. P0 recon (`scripts/demo-world/reports/P0-REPORT.md`) proved the public mutations cannot be the import path (fail-closed moderation classifier leaves everything `pending`; rate limits; no backdatable timestamps — every create mutation stamps `Date.now()` server-side). The platform-sanctioned pattern is direct internal inserts guarded like `convex/seed/demo.ts` (loopback `seed/devGuard.ts` — the strong guard, no CR-001 debt).
Ask:
1. **New module `convex/demoWorld/`** — internal mutations only, importing tools/users/posts(+payloads)/comments/engagement/ratings/rawEvents/buckets/notifications with explicit backdated document timestamps, following `seed/demo.ts` conventions (no `writeAudited`, no `auditLog` noise). Every entry point calls `seed/devGuard.assertLocalDeployment` (loopback allowlist, same as `seed/demo.ts`). Images land in `_storage` via an internal action (`ctx.storage.store`).
2. **Two new tables**: `demoRegistry { table, docId, batch }` (transactional registration of every demo row — powers one-script removal + replay parity) and `demoGroundTruth` (P7: per-member traits/tiers/bad-actor roles, per-post latent quality + verified sources, per-comment planned sentiment/intent/stance). Both are additive; no existing table's schema changes.
3. **Fix (CR-010b, decision D-1):** `convex/jobs/legitimacy.ts:142-143` computes the `account_age` legitimacy component from `users._creationTime`. `_creationTime` cannot be backdated (Convex 1.34.1 strips it from inserts), so every imported member scores account-age ≈ 0 and the geometric mean collapses legitimacy for ALL of them uniformly. `users.createdAt` is the field signup actually writes (and both seeders set it). Ask: read `createdAt ?? _creationTime`. This is a correctness fix independent of the demo (any backdated/migrated user corpus hits the same bug).
4. Tests alongside the existing convex suite: devGuard wiring on the new module, registry add/remove round-trip, idempotent re-import, and (for 010b) legitimacy account_age with backdated `createdAt`.
No deletion of existing seeds or scripts (founder rule). Prod deploys remain founder-only; the module refuses any non-loopback deployment.
Scope guard: if D-2 is declined, the bucket backfill in ask 1 drops out; asks 1–3 are otherwise independent of gate decisions D-2…D-5.

Reply in `CR-010-RESPONSE.md` (TEAM-WORKFLOW format). Status in this header is updated by Opus only.
