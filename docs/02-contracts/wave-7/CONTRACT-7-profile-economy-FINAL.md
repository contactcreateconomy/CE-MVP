# CONTRACT-7-profile-economy-FINAL

**Screen:** Profile — M12 economy layer (ENRICHMENT ADDENDUM to Wave 5B `/u/[handle]`)
**Wave:** 7C (M12 Signals/Recognition/Might/Ladder — the metrics enrichment deferred from Waves 5–6)
**Template archetype:** Tabbed profile — Metrics tab + Create-Distribution overlay (on the Wave-5B base)
**Primary CAP-IDs:** CAP-281, CAP-297, CAP-299, CAP-300, CAP-301, CAP-302, CAP-304, CAP-305, CAP-313, **CAP-565**
**Actors:** anonymous, member
**Register basis:** 565-row register at Wave 7C close; register is now **567** after Wave 7D's CAP-566/567 — no Wave 7C rows affected by those additions. + data-model verified from source.
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. States: enum-backed set adopted (resolved on register evidence — GPT's per-enum-value enumeration folded). Podium↔Ladder confirmed a firewall, not a connection. See RECONCILIATION-7C §1.

---

## 1. Route & Access
- **Base:** Wave-5B `/u/[handle]` (Overview + Journal tabs, CAP-526/527/528) — **not redrafted**. This addendum owns the **Metrics tab** (inventory: "tabbed Overview / Journal / Metrics · +M12 CAP-281,297,299–305,313 enrichment W7") + the Create-Distribution modal overlay. CAP-526's Notes already anticipated it ("Awards shelf CAP-297, Reach/Signals metrics, ladder CAP-313").
- **Path:** `/u/[handle]`, dynamic `[handle]` (resolved via CAP-550). **Actors:** anonymous, member → **two explicit branches** (anonymous-safe vs full member). Distribution create/join/leave are member-gated. Profile URLs noindex (CAP-486).
- **CAP-303 is correctly absent** from the batch: `reachFactor` is internal (Has-UI=NO, "never shown publicly") — **must not render anywhere**. `legitimacyScores` read internally by CAP-300 (snapshot) is **hidden [0,1], NEVER surfaced** — must not render.
- ⚠️ ~~**Anonymous ladder visibility:** CAP-313's Actor is `member` while the Metrics tab is anonymous-readable — whether anonymous sees the ladder (vs triad-only) is unowned → **ESCALATION E-econ-1**~~ **E-econ-1 CLOSED 2026-08-26 (founder decision):** CAP-313 Actor broadened to **anonymous, member — same ladder render for both.** The silhouette-above-current-level mechanic is the gamification boundary, not a privacy boundary. No separate anonymous-restricted render — CAP-312's opt-out is the sole visibility governor (hides the full economy surface including the ladder); if not opted out, anonymous and member see identical ladder content.
- **Opt-out gate (CAP-312 effect / CAP-552 toggle `users.leaderboardOptOut`):** "opt-out hides Level/progress/badges **without changing math**." **E-econ-3 CLOSED 2026-08-26 (founder decision):** opt-out hides **Level/progress/badges AND Reach/Signals — the full public economy-metrics surface** (triad + ladder + badges all hidden), not a partial hide. Math unchanged.
- **Podium↔Ladder = firewall, not connection (verified):** CAP-313's Level data (`distributionLevelAssignments`) is **NOT** read by CAP-194 Podium (which reads `leaderboardProjections`, Recognition-driven). CAP-298 mandates this separation. Nothing to reconcile; a reconciler finding Podium reading Level data would be a CAP-298 violation.

## 2. Entities

| Entity | Direction | Detail (CAP) |
|---|---|---|
| `distributions` | read (313) + write (299 create; 297 awardsCount; 302 memberCount; 304 might; 305 currentLevel; **565 auto-create initial**) | ownerUserId · ownershipMode {single\|collaborative} · **memberCount** (= public Reach, clean integer) · reachFactor (**internal, never shown**) · might · mightPercentile · currentLevel · highestLevelAchieved · awardsCount · dormant |
| `signalSummary` | read (render; maintained by CAP-281 cron) | subjectType {user\|distribution} · **totalSignals** (permanent record + trust capacity) · **activeSignals** (90d decay → feeds Might) · **pendingSignals** · windowVersion · computedAt — **public "Signals" = `activeSignals`** (bound 2026-08-26, E-econ-2) |
| `badges` | read (297 shelf) | type {level_milestone·recognition_role·profile_completion·discoverer·rocketeer} · state {provisional·finalized·revoked} · awardedAt · isFirstToAchieve |
| `signalLevelDefinitions` | read (313) | level (orbit→multiverse) · percentileBand · fixedMightThreshold? · sustainDays · revealState {visible·next·silhouette} |
| `distributionLevelAssignments` | read (313) | level · **status {active·holdover·demoted·dormant}** · mightAtCommit · committedAt · holdoverUntil? |
| `distributionMemberships` | read + write (300/301) | memberLegitimacySnapshot (internal) · eligibilityStatus · joinedAt · leftAt? · Unique (distributionId, memberUserId) |
| `signalLedger` | read (281) | append-only Signal truth (provisional/finalized/reversed/clawed-back) |
| `legitimacyScores` | read (300, internal only — never renders) | snapshot at join |
| `users` | read (299–301) | owner identity/handle |

## 3. States
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

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| Create Distribution | member | CAP-299 (R-DIST; **unnamed**) | distributions | one per member; **defensive/idempotent path post-CAP-565 — only fires if the auto-create didn't** |
| (System) Auto-create Distribution | System | **CAP-565 (NEW — E-econ-6)** | distributions (ownershipMode=single, initial state) | CAP-003; fires immediately after bootstrap completion, same session, NOT the same atomic transaction |
| Join Distribution | member | CAP-300 `distribution.join` | distributionMemberships (+legitimacy snapshot) | deliberate; never auto |
| Leave Distribution | member | CAP-301 `distribution.leave` | distributionMemberships (leftAt) | CAP-300 |
| View ladder | anonymous, member (**E-econ-1 CLOSED**) | CAP-313 `ladder.view` | none (read) | **CAP-305** |
| (cron) Signals summary | cron | CAP-281 (R-VIEWS) | signalSummary | CAP-273 |
| (System) Awards shelf | System | CAP-297 (R-AWARDS) | distributions (awardsCount) | CAP-295 |
| (System) Reach compute | System | CAP-302 (R-REACH) | distributions (memberCount) | CAP-300 |
| (cron) Might recompute | cron | CAP-304 `might.recompute` | distributions (might) | CAP-303 |
| (cron) Level commit | cron | CAP-305 `level.commitMonthly` | distributionLevelAssignments, distributions | CAP-304 |

## 5. Analytics Events
**None named on any primary row.** CAP-299/300/301 write no rawEvents per their Writes columns; the M12 economy is **ledger-settled (CAP-272–281), not event-stream-captured** on this screen; Recognition/economy events are NOT stored in rawEvents (M12). ⚠️ distribution join/leave are member mutations with no eventCatalog capture named — deliberate or M16 catalog gap, not for this contract to invent.

## 6. Components Used
- §11.3 stats cards (public triad **Reach · Signals · Awards**) · §11.5 pills/badges (level bands, badge states) · Progress Fill (ladder progress) · §11.7 modal (Create-Distribution) · §11.1 Button (join/leave) · §11.9 skeletons · **A8 Tiered ladder / Level visualization — ARCHETYPE GAP** (inventory §3: "multi-tier cosmic ladder with locked/silhouette states" — a generic Progress Fill does not cover multi-level reveal, holdover, season state, or three-component (Reach%/Signal%/sustained-days) progress).

## 7. Open Questions
*(Escalated items in RECONCILIATION-7C. These are unspecified detail.)*
1. ~~**Anonymous ladder visibility** — CAP-313 Actor=member vs anonymous-readable tab.~~ **→ CLOSED (E-econ-1, 2026-08-26): same render for anonymous and member; silhouette is the gamification boundary, not a privacy one; CAP-312 opt-out is the sole visibility governor. See §1.**
2. ~~**Public "Signals" metric field unbound**~~ **→ CLOSED (E-econ-2, 2026-08-26): bound to `activeSignals` — see States E and Entities `signalSummary`.**
3. ~~**leaderboardOptOut scope**~~ **→ CLOSED (E-econ-3, 2026-08-26): full hide — Level/progress/badges AND Reach/Signals; math unchanged. See States I.**
4. ~~**Distribution auto-create vs CAP-299 action**~~ **→ CLOSED (E-econ-6, 2026-08-26): CAP-565 (System) adjacent post-bootstrap auto-create; CAP-299 stays as defensive/idempotent path. Metrics tab never renders a null/missing-entity state. See States A.**
5. **CAP-299 mutation name** unspecified. (GLM + GPT.)
6. ~~**"Two-component" vs three listed progress terms**~~ **→ RESOLVED 2026-08-26: three-component (Reach% · Signal% · sustained-days); CAP-313 Notes corrected. See States G.**
7. **Reach public-integer vs internal legitimacy-weighted** relationship — one canonical formula needed. (GPT.)
8. **Owner's own ladder view vs third-party view** — same render? (GLM + GPT.)
9. **A8 archetype undefined** (carry-over). (All three.)
