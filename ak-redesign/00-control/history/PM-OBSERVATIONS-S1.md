---
id: PM-OBSERVATIONS-S1
type: NOTES
author: Claude (PM), from CONTACT-390/1440 + SETUP-REPORT-R3
date: 2026-09-28
status: INPUT for ground truth (Opus must confirm or refute each item)
---

# PM observations — first look at the real product (seeded, 390 + 1440)

Ranked by damage to the one feeling (TRUST) and to "make everyone feel special".
These are hypotheses from thumbnails. Opus: verify each against full-size baselines + code, and mark CONFIRMED / REFUTED / PARTIAL in CURRENT-STATE.

## What works (keep)
- Dark theme is coherent; content density on feed and discussion reads well at 390.
- The Review verdict block (score, per-dimension ratings, pros/cons, linked tool) is a real differentiator. Reddit/X have nothing like it.
- A bottom tab bar exists; the notification unread badge works.
- The seed content voice is credible, so the baselines are judgeable.

## P0 — trust killers
1. **Internal spec text leaks into the user-facing UI.** Seen on screen:
   - Review verdict: "display-only, never feeds the community aggregate ('toolRatings' is the sole aggregate feed)"
   - Discussion: "Thread intelligence … renders when the MAX pass ships (Phase 7)"
   - Profile awards: "Awards shelf arrives with the Wave-7 reputation enrichment (CAP-297) — honest empty for now"
   - Settings: "no OAuth or profile fetch in v1", "derivation-trail invalidation", "Re-accept (rules.v1)"
   - Raw keys as labels: `email_verified ✓`, `basic_profile_complete ✓`
   Likely app-wide. Needs a full grep audit (CAP-, Phase, Wave, v1, MAX, table/field names, snake_case in JSX strings).
2. **"New sign-ups are currently closed" is the first message on every auth gate.** For a visitor, the product says "closed". Confirm whether this is intended beta config or a seed/config default. If intended, the copy and placement still need design.
3. **The long-title 2-line clamp is broken.** The fixture title renders 4–5 lines at 390, and the fixture's own text says this means "the two-line clamp regressed". SETUP-REPORT-R3 marked it as "renders". → Builder self-acceptance is not acceptance.

## P0 — feel-special is absent
4. **The creator has no home.** `/profile` redirects to settings. The public profile (`/users/maya`) shows no posts, and Awards is empty even though 26 badges were seeded. A creator can't see or show their own body of work.
5. **Notifications are anonymous and raw.** The actor is "Someone"; labels are type names ("post comment", "signal level changed", "help resolution"); no post title, no avatar, no preview. The recognition moment, which is exactly where the vision says appreciation must land, is dead.
6. **No avatars anywhere** (`avatarUrl: null` hardcoded in the profile projections). Every person is an initial. Community with no faces reads as low trust.

## P1 — polish / app-feel
7. Feed cards show moderation actions as text (`Why this? Hide Mute Report`) on every card: noise. They belong in an overflow menu.
8. Dates are absolute (`28/9/2026`) on cards, relative elsewhere ("40m ago"). Inconsistent.
9. Center "Create" tab: the label is invisible (blue on blue).
10. Landing: duplicate "Explore free resources" (primary CTA + secondary link). Logged-in users get an identical landing with no path to their feed.
11. Desktop 1440: the hero carousel (779 LOC) takes the whole first fold with an empty grey image area; the left sidebar is almost empty; the feed is a narrow middle column. Mobile-first is right: design at 390 and let desktop follow.
12. Loading states: spinner / blank / skeleton mix (already in RAW-INVENTORY §E).

## Structural: style kit vs VISION
The repo's `STYLE-KIT.md` is already extracted from DS v2 with product logic stripped and tokens reconciled to the shipped app (see RECONCILIATION-NOTE). Good: the structural mismatch (9 categories, streaks, level names) is not a live problem.
The live tension is **aesthetic**: STYLE-KIT keeps the "Electric" glow system (glow-sm/md/lg/text/pulse + four app glows for pills, card hover, progress track). VISION says iOS minimal and "motion must serve a purpose, not an RGB light".
Proposed rule for Opus to record as a DECISION: **STYLE-KIT is the canonical token source; VISION wins on aesthetic direction where they conflict.** S00 rules on each glow use: keep, tone down or remove.

## Backend / CR candidates (do not fix; log as proposed CRs)
- Six crons failing on `.withIndex` without the leading field (SETUP-REPORT-R3 §7). Includes `jobs/legitimacy:recompute`, `rankIntegritySweep` and `analytics/projections` — the future influence-report-card signals. Dev team to check prod logs.
- Avatars (projection hardcodes null).
- Follows and streaks: don't exist. Decide whether they are MVP 1 at all (vision scope rule: no new features).
- Notification actor/context: check whether the data exists and only the UI drops it (polish), or the payload lacks it (CR).
- Server drafts (CAP-531) and the podium 25-contributor floor (from PM-HANDOFF §5).
