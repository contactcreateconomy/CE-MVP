---
id: CR-013
type: CR-REQUEST
author-model: GLM
status: OPEN
date: 2026-10-04
---

# CR-013 — Production writer for `postDistributionBuckets` (deferred to S02 wiring)

Territory: convex. Split from CR-010 per PM decision A5.2.
Why: `postDistributionBuckets` (`schema.ts:1530`) has **no writer anywhere in production code** — no insert or patch in the repo (Grok-verified). Its only readers are `jobs/vibing.ts:42` (What's-Vibing computes entirely from it) and `jobs/rank.ts:243` (`trendScore` bucket deltas). Today the table only ever has content after a seed hand-writes it, so Vibing and `trendScore` are permanently dead in production.
Interim (approved, A5.2): the demo-world importer backfills buckets as exact rollups of imported `rawEvents` (hourly buckets first 48h, daily 3–30d, per M9 R-PRECOMPUTE) so the real `vibingCompute` job runs on real shapes.
Ask: implement the production same-mutation/periodic bucket writer (increment on eligible interactions; reconciliation pass), deferred to **S02 wiring**. Until it lands, Vibing on production deployments shows its designed empty state, which is correct behaviour.
Reply in `CR-013-RESPONSE.md` (TEAM-WORKFLOW format). Status in this header is updated by Opus only.
