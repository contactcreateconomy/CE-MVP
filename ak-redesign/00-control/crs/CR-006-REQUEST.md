---
id: CR-006
type: CR-REQUEST
author-model: Opus
status: OPEN
date: 2026-09-29
---

# CR-006 — Podium: a real projection and/or a beta floor below 25 contributors

Territory: convex
Why: `/leaderboard` shows "Podium is forming — needs 25 eligible contributors" (`MIN_CONTRIBUTORS = 25`, CAP-294 "never fabricates rankings"). With a 20-creator beta (D-005) it will never activate. Meanwhile the page's per-category scores are derived client-side from `feed.getChrome` with **fabricated multipliers** (`userId.charCodeAt(last) % 5`, "interim until M12 projections exist") — the redesign removes that UI derivation regardless.
Ask: Pick one and reply:
A. Server projection per category × window (the M12 projection the page expects), with the floor configurable via `systemConfig` so beta can use e.g. 5; or
B. Keep the floor at 25, and expose a real "rising contributors" list (no ranks) the page can show below the floor.
Either way: rankings come from the server, never computed in the client.

Reply in `CR-006-RESPONSE.md` (TEAM-WORKFLOW format). Status in this header is updated by Opus only.
