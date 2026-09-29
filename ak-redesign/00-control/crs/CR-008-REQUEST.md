---
id: CR-008
type: CR-REQUEST
author-model: Opus
status: OPEN
date: 2026-09-29
---

# CR-008 — Profile body of work: the author's posts and the awards shelf

Territory: convex
Why: VISION: the creator must feel valued; today they have no home. `convex/profile/page.ts` returns no posts at all, `awardsShelf: []` hardcoded ("CAP-297 W7 — honest empty placeholder"), `metrics: null`, although the seed has 26 badges in the `badges` table and 60 posts. `feed.list` has no author filter, so the UI can't assemble it either. Needed by S05.
Ask: 1. A paginated query "posts by author handle" (published, visibility-respecting, same card shape as `feed.list` so the UI reuses the feed card).
2. `awardsShelf` populated from `badges` (label, earnedAt, kind), respecting profile privacy.
3. Optional (say if cheap): per-profile counts the UI can show honestly (posts, valuables received).
No new scoring — raw facts only.

Reply in `CR-008-RESPONSE.md` (TEAM-WORKFLOW format). Status in this header is updated by Opus only.
