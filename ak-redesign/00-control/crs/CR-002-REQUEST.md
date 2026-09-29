---
id: CR-002
type: CR-REQUEST
author-model: Opus
status: OPEN
date: 2026-09-29
---

# CR-002 — Fix six cron jobs that throw on `.withIndex` (index prefix order)

Territory: convex
Why: SETUP-REPORT-R3 §7: the local backend enforces index-prefix order; these jobs throw on every fire (`Tried to query index … didn't use the index fields in order`). Several are the future **influence report-card signals** (VISION §1/§7) — legitimacy, rank integrity, analytics projections — so today they produce nothing. Confirmed in code, e.g. `convex/jobs/legitimacy.ts:103` queries `rawEvents.by_user_time` with only `q.gte("occurredAt", since)`.

| Function | Index | Missing leading field |
|---|---|---|
| `admin/homeAlertWriters:rankIntegritySweep` | `integrityFlags.by_actor_disposition` | `actorUserId` |
| `analytics/projections:l08Core` | `rawEvents.by_eventType_time` | `eventType` |
| `analytics/projections:orphanSweep` | `rawEvents.by_eventType_time` | `eventType` |
| `jobs/legitimacy:recompute` | `rawEvents.by_user_time` | `userId` |
| `jobs/maxRefresh:sweep` (every 15 min) | `comments.by_post_depth_created` | `postId` |
| `jobs/repeatInfringer:evaluate` | `strikes.by_user_active` | `userId` |
Ask: 1. For each job: add the leading-field equality, iterate the leading values, or add a correctly ordered index (schema change → same-commit fingerprint rule in TEAM-WORKFLOW).
2. **Check prod logs** (`energetic-kangaroo-55`) for the same errors — cloud may be failing silently too. Report findings in the response.
3. Priority: the three influence-signal jobs (`legitimacy:recompute`, `rankIntegritySweep`, `analytics/projections:*`) first.

Reply in `CR-002-RESPONSE.md` (TEAM-WORKFLOW format). Status in this header is updated by Opus only.
