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
| 2026-09-05 | P4-02 (`convex/posts.ts`) + P4-03 (`convex/tags.ts`, TagPicker component) | **Composer rebuild on the canonical backend** — type-select + 7 typed forms at `/new-post` (canonical per `00-ROUTES.md`). The live composer still writes legacy `forumPosts` (pre-Transition reference flow). Blocks: TagPicker embed, CAP-087 rejection surfaces (State D.1), draft/eligibility UI states. Route name resolved 2026-09-04; the real blocker is the backend migration, not naming. | Possibly P4-13 territory (user-tracked) — if so, P4-13's slice scope should be amended to own it explicitly. |
| 2026-09-05 | P4-05 (`convex/toolRatings.ts`) | **Rating form on `/tools/[slug]`** — CONTRACT-2-tool-profile States 4–9 (submit form with 1–5 + N/A controls, edit mode, withdraw + confirmation, 403 feedback). P4-04 shipped the profile zero-state; P4-05 shipped the mutations; the form appears in no slice's files-touched. | Also unowned: the ratingsPage pagination UI (contract Actions 5 — cursor mechanics themselves are an Open Question). |
