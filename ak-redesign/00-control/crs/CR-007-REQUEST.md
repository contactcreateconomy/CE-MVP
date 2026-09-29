---
id: CR-007
type: CR-REQUEST
author-model: Opus
status: REJECTED
date: 2026-09-29
---

# CR-007 — Follows and streaks — scope question (MVP 1 or not?)

Territory: convex
Why: SETUP-REPORT-R3 §2: no follow table and no streak field exist (only the `firstFollowMade` activation bit). VISION §4 scope rule: the redesign adds **no new features**; follows/streaks would be new features. They matter to "feel special" and to the future report card (audience evidence), so the founder should decide explicitly rather than let a spec imply them.
Ask: **No build requested.** Founder decides: (a) out of MVP 1 — close as WITHDRAWN, specs must not show follow/streak UI; or (b) in MVP 1 — then dev scopes the schema (follow edges, streak computation) and replies with an estimate before any spec uses them.

Reply in `CR-007-RESPONSE.md` (TEAM-WORKFLOW format). Status in this header is updated by Opus only.

**Resolution (Opus, 2026-09-29):** REJECTED for MVP 1 by founder decision. No spec may show follow or streak UI. Revisit only via a new CR after beta.
