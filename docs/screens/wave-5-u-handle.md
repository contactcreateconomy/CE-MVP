# Profile (merged Profile + Distribution)

**Status (2026-09-18 screen audit correction):** LIVE — base profile (Overview/Journal) compliant with CONTRACT-5-u-handle-FINAL.md. The M12 Metrics-tab enrichment (CONTRACT-7-profile-economy-FINAL.md) is **partially built**: the Metrics tab, Reach/Signals/Awards triad, A8 ladder, join/leave, and leaderboard opt-out are live; the CAP-299 Create-Distribution modal, `distributionLevelAssignments`-derived ladder status (holdover/demoted/dormant), and the stale Overview awards-shelf placeholder remain open — logged in CHANGELOG, not built this pass (scope/risk).

**Route:** `/u/[handle]`
**Status:** LIVE, ROUTE DRIFT — live `/users/[handle]` at PRD/app/apps/forum/src/app/(app)/(shell)/users/[handle]/page.tsx (Metrics tab NOT STARTED — only Overview-era code exists)
**Route drift:** spec `/u/[handle]` vs live `/users/[handle]` — DECISION NEEDED: rename live route to match spec, OR update spec to match live route. Not silently picked.
**Contract:** PRD/02-contracts/wave-5/CONTRACT-5-u-handle-FINAL.md (Wave-5B base: Overview + Journal) + PRD/02-contracts/wave-7/CONTRACT-7-profile-economy-FINAL.md (Wave-7C Metrics-tab enrichment addendum — one screen, two contract documents, per inventory §"Enrichment addenda")
**Slice(s):** P5-07 (base tabs + handle reserve); P7E-09 (Metrics tab: triad + ladder + join/leave + CAP-312 full hide + A8)

## Layout

Contract-5 §6 Components Used names the **"Entity-profile tabbed layout (§12)"** — a generic §12 citation with no §12.x subsection pinned — with Avatar (2xl/3xl per self/other), Pill/Tag (completion badges — per-field, not a progress bar), §11.3 card family (identity card; Journal Summary milestones), Stats Card (Metrics W7 placeholder), Skeleton, nav tabs, paginated list for Ledger. Inventory Template archetype: "Entity profile, tabbed (Overview / Journal / Metrics)". Contract-5 §3 States A supplies the tab set; the Wave-7C addendum fills the reserved Metrics tab.

```
+--------------------------------------------------------------+
| [ Avatar 2xl/3xl (self/other) ]  displayName · @handle       |
|   identity card: roleArchetype? · toolsUsed[] · bio ·        |
|   per-field completion pills (CAP-150 — NOT a progress bar)  |
+--------------------------------------------------------------+
| Tabs: [ Overview ] [ Journal ] [ Metrics ]                    |
|                                                              |
| Overview (anonymous + member; anonymous-safe branch)          |
|   identity + per-field completion badges                     |
|   Awards shelf + M12 triad + ladder — RESERVED, render        |
|   empty/placeholder until W7 (Contract-5 §3 A)               |
|                                                              |
| Journal (SELF-ONLY at launch; hidden for non-self)            |
|   [ Summary ] rolled-up aggregates + milestones (cards)      |
|   [ Ledger ]  raw append-only activityLedger entries,        |
|               paginated (A1 data table)                      |
|                                                              |
| Metrics (reserved W5 → filled by Wave-7C / P7E-09)           |
|   Reach · Signals · Awards stats-card triad                  |
|     (public "Signals" = activeSignals — E-econ-2)            |
|   A8 tiered ladder: current + below + next milestone +       |
|     silhouette above; three-component progress               |
|     (Reach% · Signal% · sustained-days)                      |
|   [ Join ] / [ Leave ] buttons (member; join never auto)     |
|   Create-Distribution modal — defensive/idempotent path      |
|     only (CAP-565 auto-creates at signup; does not render    |
|     on the normal path)                                      |
|   CAP-312 opt-out (users.leaderboardOptOut, written on       |
|     /settings/profile): hides the FULL public economy        |
|     surface — triad + ladder + badges                        |
+--------------------------------------------------------------+
| handle not-found → route not-found (CAP-550 uniqueness/       |
| reserve failed to map)                                       |
+--------------------------------------------------------------+
```

Viewer states govern tab visibility (Contract-5 §3 B): self = full view incl. Journal; other member / anonymous = Overview only.

## Components required

- Nav tabs → apps/forum/src/components/ui/tabs.tsx
- §11.6 Avatar (2xl/3xl per self/other) → apps/forum/src/components/ui/avatar.tsx (+ user-avatar.tsx / avatar-with-name.tsx if pairing needed)
- §11.5 Pill/Tag (completion badges — per-field, not a progress bar per CAP-150) → apps/forum/src/components/ui/badge.tsx
- §11.3 card family (identity card; Journal Summary milestones) → apps/forum/src/components/ui/card.tsx
- Stats Card (§11.3 — Metrics W7 placeholder; Reach·Signals·Awards triad) → apps/forum/src/components/ui/card.tsx (no dedicated stats-card file; card family per contract wording)
- §11.9 Skeleton → apps/forum/src/components/ui/skeleton.tsx
- Paginated list for Ledger — A1 data table → apps/forum/src/components/ui/data-table/index.tsx
- tiered ladder (A8) — Wave-5 contract defers it to W7 ("not a this-wave gap"); Wave-7C contract flags it "ARCHETYPE GAP"; the library provides → apps/forum/src/components/ui/tiered-ladder.tsx (v1 composed from Progress Fill + pills + silhouette slots per P7E-09 — "not invented as a new design-system token")
- §11.7 Modal (Create-Distribution, Wave-7C defensive path) → apps/forum/src/components/ui/dialog.tsx
- §11.1 Button (join/leave, Wave-7C) → apps/forum/src/components/ui/button.tsx
- MISSING: merged Profile+Distribution shell, Journal Summary, raw Ledger (beyond the data-table primitive), privacy-filtered-metadata-row component — Contract-5 §6 states none exist in §11

## States required

### From CONTRACT-5-u-handle-FINAL §3 (Wave-5B base)

*(Copied VERBATIM.)*

*(Tab + viewer + Journal-entry set below. GPT's ~70 sub-states — each field public/private, each ledger event-type as a state — folded to the tab/viewer/entry model.)*

**A. Tab states:** **Overview** (identity, per-field completion badges [CAP-150]; **Awards shelf [CAP-297] + M12 triad Reach·Signals·Awards + ladder [CAP-313] RESERVED for the W7 Metrics enrichment — render empty/placeholder until W7**) · **Journal — Summary** (human-friendly rolled-up aggregates + milestones) · **Journal — Ledger** (raw append-only entries, paginated) · **Metrics** (reserved, W7).
**B. Viewer states:** self (member) — full view incl. Journal tabs · other member — Overview (Journal hidden; ledger private-by-default) · anonymous — Overview, anonymous-safe branch · **handle not-found** (CAP-550 uniqueness/reserve failed to map).
**C. Journal entry states:** per `activityLedger` — eventType set above; visibility private (public-Journey toggle is a **reserved future feature, not built** — the field exists but no CAP governs a public flip → Open Question).
**D. Completion-badge states:** per-field finalized badges render; prefer-not-to-say fields show equally-credited completion (Recognition-firewalled — display only, never Signal/rank/reach).
**E. Profile-visibility states:** public (default ON) vs private — behavior for non-self viewers unspecified (Open Question).

### From CONTRACT-7-profile-economy-FINAL §3 (Wave-7C Metrics-tab addendum)

*(Copied VERBATIM — governs the Metrics tab only; the Wave-5B base above is not redrafted.)*

*(Enum-backed set. GPT's ~120 transient states — each level as a state, each ledger entry-type, each Reach include/exclude — folded, since the `signal.level` enum (10), `distributionLevelAssignments.status` (4), `signalSummary` triad, and badge states are the authoritative sets. Resolved on register evidence, not vote — see RECONCILIATION-7C §1.)*

**A. No Distribution yet** → ~~Create-Distribution modal CTA (CAP-299; one per member, ownershipMode=single V1). ⚠️ auto-create-at-signup vs create-on-action is unspecified for the merged page (E-econ-6)~~ **E-econ-6 CLOSED 2026-08-26 (founder decision): CAP-565 (System) auto-creates the Distribution immediately after successful bootstrap completion** — a fresh profile's Metrics tab always has a real (if empty/zero-state) Distribution to display, **never a null/missing-entity state**. CAP-299's Create-Distribution modal CTA becomes the defensive/idempotent path (fires only in the edge case where CAP-565 didn't create one — retry logic, migration, etc.); at normal signup it is not needed and does not render.
**B. Join (CAP-300):** deliberate action only — **never auto-joined**; legitimacy snapshot captured; eligibilityStatus evaluated.
**C. Leave (CAP-301):** sets leftAt; **log-scaled negligible reach effect (anti-suppression, R-REACH)**.
**D. Reach display (CAP-302):** public Reach = **COUNT of verified/active/integrity-qualified members** — clean integer; **raw all-time count is admin-only**.
**E. Signals display (CAP-281):** three views — **Total** (lifetime → permanent record + trust capacity) · **Active** (90d weighted-decay → feeds Might) · **Pending**; display rule: **displayed = max(Σ finalized, 0), smoothed**. **E-econ-2 CLOSED 2026-08-26 (founder decision): the public "Signals" number in the Reach·Signals·Awards triad = `activeSignals`** — the live/current measure. Total is the permanent historical record (not shown publicly as "Signals"); Pending is transitional and not shown publicly. A specified value, not an open question.
**F. Awards shelf (CAP-297, gated CAP-295 badge.mint):** **finalized badges + count**; third public metric (Reach·Signals·Awards); **not grindable**; a **revoked** badge leaves the public shelf/count but stays in audit; **inactivity/level-drop NEVER revokes** (only confirmed fraud/impersonation/material-calc-error).
**G. Ladder view (CAP-313, gated CAP-305):** **current level + below + next milestone + silhouette above**; revealState visible/next/silhouette; **three-component progress (Reach% · Signal% · sustained-days)** — "two-component" was a miscount, corrected 2026-08-26 (Wave 7C); **Might continuous (CAP-304), Level committed monthly (CAP-305)** — two-speed display. **E-econ-1 CLOSED 2026-08-26:** identical render for anonymous and member (Actor: anonymous, member); silhouette-above-current-level is the gamification boundary, not a privacy boundary; CAP-312 opt-out is the sole visibility governor.
**H. Assignment status:** active · holdover (~10%, 30d) · demoted (annual boundary only, max 1 level) · dormant (CAP-316: Might=0 for 180d → excluded from pool).
**I. Opt-out hidden (CAP-312/552):** **Level/progress/badges AND Reach/Signals — the full public economy-metrics surface hidden** (triad + ladder + badges), math unchanged (E-econ-3 CLOSED 2026-08-26).
**J. Founding Season cold-start (CAP-315):** fixed Might thresholds below ~1000 eligible channels; Supernova+ remain silhouettes until pool grows.

## Component library maturity note

- ⚠️ tabs has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ badge has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ skeleton has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ data-table has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ dialog has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ tiered-ladder has zero production usage — expect possible integration friction, report don't silently patch.
- card, avatar, button, toast are production-proven (no warning).
- user-avatar.tsx and avatar-with-name.tsx are on neither the provided zero-production nor production-proven list — maturity unknown, not invented here.
