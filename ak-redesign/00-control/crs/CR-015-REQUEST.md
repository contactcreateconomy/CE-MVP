# CR-015 — index-prefix fixes (legitimacy.recompute, recognition.rollup) + exact removal bulk estimate

**Status: APPROVED + EXECUTED in-session (founder instruction, 2026-10-04, [CR-010a][GLM] message).**
Branch: `demo-world` · commit: see CHANGELOG / `[CR-015][GLM]`

## Problem

Both projection jobs fail on ANY run (static index-order violation, surfaced during P6 settle on the local backend):

1. `jobs/legitimacy:recompute` — the recently-active-actor discovery scan queries
   `rawEvents.by_user_time` starting at `occurredAt`, skipping the index's leading `userId`.
   Convex rejects the range: *"Index fields: [userId, occurredAt, …] Query fields: [occurredAt]"*.
2. `jobs/recognition:rollup` — the per-user aggregate scan queries
   `recognitionEvents.by_user_window` starting at `window`, skipping `userId`. Same rejection.
   (Rollup feeds the Podium projection — this is the "Podium" failure.)
3. `demoWorld/remove:removalStatus` — `take(1000)` silently capped the bulk estimate
   at 1,000 registered rows; the pilot imports ~15k+.

## Change (additive only)

- `schema.ts`: `rawEvents.index("by_time", ["occurredAt"])`, `recognitionEvents.index("by_window", ["window"])`
- `jobs/legitimacy.ts`: discovery scan → `by_time` (semantics unchanged: recent events desc, take 500)
- `jobs/recognition.ts`: aggregate scan → `by_window` (semantics unchanged: window d30, take 500)
- `demoWorld/remove.ts`: `removalStatus` → `query("demoRegistry").count()` (exact)

## Tests

`tests/convex/cr-015-index-fixes.test.ts` — convex-test does not validate index field order,
so the job scans are pinned by post-fix behavior (recompute writes `legitimacyScores` for a
recent actor; rollup completes); the removalStatus case is red/green against the old 1,000 cap.
Live verification: both jobs ran clean on the local backend after push (P6 settle re-run).

## Risk

Low: two new indexes (online backfill, additive), two query rewrites onto the correct index,
one count fix in a demo-only helper. No table/field changes, no production writer behaviour touched.
