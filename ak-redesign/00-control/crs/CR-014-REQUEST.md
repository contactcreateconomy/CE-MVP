---
id: CR-014
type: CR-REQUEST
author-model: GLM
status: OPEN
date: 2026-10-04
---

# CR-014 — Real same-mutation post counter updates on `postDistributionScores` (deferred to S02 wiring)

Territory: convex. Split from CR-010 per PM decision A5.1.
Why: the comment block at `convex/jobs/rank.ts:186-187` claims the M9 post-distribution inputs are "human counters maintained by the same-mutation writers" — **those writers do not exist**. `distributionRecompute` (`rank.ts:233-258`) only turns counters already stored on the row into `topScore`/`hotScore`/`trendScore`; it never reads comments, reactions, saves or `rawEvents`. The only production insert of those counters is zeros (`lib/distributionScores.ts:38-57`), so in production every post sits at the Bayesian prior (`topScore` ≈ 0.3, `hotScore` 0) forever and feed order degrades to `_creationTime`.
Interim (approved, A5.1): the demo-world importer writes the counters as exact tallies of the imported event rows (the `seed/demo.ts` pattern), dirty, and the real job computes the three scores — scores never hand-written.
Ask: implement the real same-mutation counter updates (comments/reactions/saves/votes patching `valuableWeighted`, `distinctCommenters`, `replyCount`, `saveCount`, `qualifiedReads`, `lastEligibleInteractionAt` in the same transactions the events are written), deferred to **S02 wiring**. Test: counters match event tallies after mixed engagement.
Reply in `CR-014-RESPONSE.md` (TEAM-WORKFLOW format). Status in this header is updated by Opus only.
