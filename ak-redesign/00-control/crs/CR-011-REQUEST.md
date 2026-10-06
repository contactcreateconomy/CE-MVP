---
id: CR-011
type: CR-REQUEST
author-model: GLM
status: OPEN
date: 2026-10-04
---

# CR-011 — Demo-world import module (`convex/demoWorld/` + `demoRegistry` / `demoGroundTruth`)

Territory: convex. Retires CR-010 ask 1+2 (CR-010 split into CR-011…CR-014 per PM decision A5.4).
Why: `ak-redesign/specs/DEMO-WORLD-SPEC.md` (founder-approved) imports a 500-member / 5,000-post / ~45k-comment world into the LOCAL backend. P0 recon + Grok review confirmed public mutations cannot be the path (fail-closed classifier leaves posts `pending`; rate limits; timestamps stamped `Date.now()` server-side). The sanctioned pattern is direct internal inserts guarded like `convex/seed/demo.ts`.
Ask:
1. **New module `convex/demoWorld/`** — internal mutations (+ internalActions for image upload) importing tools/users/posts(+payloads, incl. a dedicated `postNews` insert with `sourceOfTruthUrl` + `keyClaims`)/comments/engagement/ratings/rawEvents/buckets/notifications with explicit backdated document timestamps, replicating every real-mutation side effect enumerated in `scripts/demo-world/reports/P0-REPORT.md` §F (rawEvents `comment.created`/`comment.reacted` with `isCountableAtWrite:false` on negatives, `activityLedger` rows, `isQuestion`, `bumpThreadActivity`, typed notifications, `acceptedByUserId`, exact-tally counters + `dirtySince`, bucket rollups). Every entry point calls `seed/devGuard.assertLocalDeployment` (loopback allowlist). `postDistributionScores` counters = exact tallies of imported events; scores computed only by the real jobs (A5.1).
2. **Two new tables**: `demoRegistry { table: v.string(), docId: v.string(), batch: v.string() }` (transactional registration — one-script removal + replay parity) and `demoGroundTruth` (P7). Additive only; no existing table changes.
3. **Images** via internalAction `ctx.storage.store` (action-only per `storage.d.ts:173-176`); covers → existing `postSeoMeta.ogImageAssetId`, avatars → existing `users.avatarAssetId`. **Feed display of covers/avatars is S02 wiring under this CR's follow-up, NOT demo scope** (A5.3) — `feed.ts:100-122` returns no cover and the app never reads `avatarAssetId` today.
4. Tests: devGuard wiring on the new module, registry add/remove round-trip, idempotent re-import (same fingerprint keys), payload-shape parity for all 8 active types.
No deletion of existing seeds or scripts (founder rule). Prod deploys stay founder-only; the module refuses non-loopback deployments.
Reply in `CR-011-RESPONSE.md` (TEAM-WORKFLOW format). Status in this header is updated by Opus only.
