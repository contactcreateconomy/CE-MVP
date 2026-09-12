# KNOWN-UI-GAPS — backend shipped, UI orphaned, no slice owns the surface

**Purpose:** mutations/queries exist and are tested, but the member-facing
UI that consumes them is not built AND no slice's files-touched names it.
Each entry gets logged the session the gap is noticed; the end-of-phase
report reads this file instead of reconstructing from memory. Started
2026-09-05 (P4-05 session).

**Not logged here:** surfaces with a NAMED future owner (e.g. CAP-114
rating moderation UI is Phase 7's), archetype gaps flagged in contracts
(see `AGENT-START-HERE` §1b + SCREEN-SCORES), and screens merely not yet
reached in build order.

| Date noticed | Slice that shipped backend | Gap | Notes |
|---|---|---|---|
| ~~2026-09-05~~ | ~~P4-02 + P4-03~~ | ~~**Composer rebuild on the canonical backend**~~ | **CLOSED 2026-09-10 by B2** (`b903739`) — the composer submits through canonical `posts.createPost`. |
| ~~2026-09-05~~ | ~~P4-05 (`convex/toolRatings.ts`)~~ | ~~**Rating form on `/tools/[slug]`** (CONTRACT-2 States 4–9) + ratingsPage pagination~~ | **CLOSED 2026-09-12** — `rating-form.tsx` (submit/edit/withdraw, N/A only on value_for_money) + `tools.listRatings` cursor continuation; acceptance suite `p4-05b-rating-form.test.ts` (13 tests). |
