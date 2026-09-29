---
id: PM-BRIEF
type: BRIEF
author-model: Opus
tool: Claude Code (cloud)
round: 1
status: FOR PM REVIEW
date: 2026-09-29
---

# PM-BRIEF — ground truth in one page

**What I found.** The engine is solid and the stack needs no rewrite. What users see is the PRD talking to itself: ~45 internal strings (CAP-IDs, "Phase 7", "honest empty", `rules.v1`, "Connect Convex") plus raw enum keys (`email_verified`, `community_top`, `roleArchetype`, "post comment"). There are no faces (avatars hardcoded null), notifications say "Someone", and the public profile shows no posts and no awards. The creator is never made to feel valued. The app also doesn't feel like an app yet: no manifest or icons, blank screens while loading, and the Create label in the tab bar is invisible. Forum and admin CSS are the same 1,073 lines copied, differing on one line. Your observations: all 12 numbered items confirmed. Of the 4 "keep" items, 3 are confirmed and 1 is partial (the tab bar). Nothing refuted (CURRENT-STATE §8).

**What surprised me.**
1. **Two places fabricate data.** `/category/[slug]` is a static fake post ("Maya Chen @mayabuilds", "Verified Verified Top Seller Lv 12") shown for every category. The leaderboard computes per-category scores from `userId.charCodeAt % 5`. On a product whose pitch is "every claim is sourced", this is the worst gap. The category fix needs no backend (`feed.list` already filters by type).
2. **"Sign-ups closed" isn't a UI bug.** Admission is fail-closed until a readiness row says `ready`. It's a business decision (D-009).
3. **Notifications can be fixed with a small CR.** The actor IDs are already stored; the query just drops them.
4. `/kit`, the internal component showcase, is publicly routable.

**Decisions the founder must make** (DECISIONS.md)
- **D-005** Ship line: S00–S05 → private beta with 20 creators. *Recommend yes.*
- **D-009** Front door: A invite-only waitlist (recommended) / B open / C closed and honest about it.
- **D-007** STYLE-KIT stays canonical; glow demoted to focus ring and progress bar only.
- **D-010** Profile tab goes to the creator's own profile instead of settings.
- **D-006** Replace the wiki-per-slice rule with STATUS.md plus one CHANGELOG line per accepted spec.
- **CR-007** Follows/streaks: MVP 1 or not? *Recommend not* (scope rule).

**Recommended first 2 specs**
1. **S00 Foundation.** It covers the single token source, state kit, app-feel, sheet primitive, shell/tab bar, the COPY-1 rule plus leak cleanup, motion principles, and deleting dead components. Every later spec stands on it, and most of the trust gains are here.
2. **S01 First visit & join.** Once D-009 is answered, this fixes the front door. I moved the composer to S04 to keep journey order. If the founder's composer ideas are ready first, swap S01 and S04; only S00 blocks it.

**Send to the dev now** (the ship line needs them): CR-003 avatars, CR-004 notification context, CR-008 profile posts + awards. Also CR-002 (crons): the influence-signal jobs have never run locally, so check prod.

**Risks**
- **Perfection trap:** 15 specs are indexed and only 6 are before the ship line. Hold the line.
- **Backend dependency:** S05, the heart of "feel special", waits on 3 CRs from one dev. Ask this week.
- **Self-acceptance:** R3 marked the broken title clamp as "renders". Gates must be run by someone other than the builder, at 390.
- **Rule collision:** PRD hard rules ("never invent a token", "nothing outside the register") will fight redesign specs. AGENTS.md §0 now scopes them, but builders must actually read §0.
- **Admin drift:** admin keeps its own CSS copy until S00 lands. After S00, no one may edit tokens in an app file.
