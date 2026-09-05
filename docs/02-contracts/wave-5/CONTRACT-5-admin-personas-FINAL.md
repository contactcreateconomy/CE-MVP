# CONTRACT-5-admin-personas-FINAL

**Screen:** Persona Population Console — `/admin/personas`
**Wave:** 5 (M8 Persona — admin lifecycle queue)
**Template archetype:** Admin lifecycle queue
**Primary CAP-IDs:** CAP-159, CAP-160, CAP-161, CAP-162, CAP-163, CAP-164, CAP-165, CAP-166, CAP-167
**Actors:** Editor, Publisher, Administrator (+ Moderator on CAP-161, + System on CAP-163/166/167 — E-E closed: inventory Actor(s) = broadest screen access)
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. States: GPT's ~90 sub-states folded to the compact lifecycle-enum + trigger-branch set (GLM+Opus majority). **E-D and E-E CLOSED 2026-08-24.** See RECONCILIATION-5A §3.

---

## 1. Route & Access
- **Path:** `/admin/personas`. **Dynamic params:** none. No anonymous/member access.
- **Auth sequencing:** minimal basic role-check gate at Wave 5; full M15 `/admin` shell (CAP-390 + CAP-392) wraps at Wave 7 — known Wave-3 E5 pattern. CAP-019 (`admin.write` 60/1m per operator; staff NOT rate-exempt) applies.
- **Role scope (register Actor columns, verbatim):** CAP-159/160/162/164/165 = Editor, Publisher, Administrator. **CAP-161 additionally permits Moderator.** **CAP-163 = System, Editor, Publisher (no Administrator).** CAP-166/167 are cron-driven (recommendation/flag outputs observed in the console). **E-E CLOSED:** Actor(s)='Editor, Publisher, Administrator' in the screen inventory represents broadest access to this screen, not uniform per-action authority — individual actions gate per their own CAP-ID (e.g. Pause admits Moderator; Wane excludes Administrator, System-triggered). See per-action Actor column above for exact gating.
- **System-vs-operator:** CAP-166 recommends births/retirements (operator executes); CAP-167 flags drift (no automatic lifecycle change).
- **Standing-rule (create/teardown):** create = CAP-159 birth; teardown = CAP-161 pause / CAP-163 wane / CAP-164 retire; revival = CAP-165. Profile + history survive retirement and revival — persona creation is **not** left without a lifecycle teardown. **No hard-delete exists** (by design, coherent) — but see E-F on the missing pre-activation discard.

## 2. Entities

| Entity | Direction | Grounding |
|---|---|---|
| `personas` | read + write (`lifecycleStatus`, `paused`, `pauseReason`) | CAP-159–165, 167 |
| `personaGenomes` | read (birth QA, drift compare) + write (birth) | CAP-159, 166, 167 |
| `personaLifecycleEvents` | write (`birth/activation/waning/retirement/pause/resume/revival`) | CAP-159–165 |
| `personaRevivalVotes` | read (revival tally + threshold snapshot) | CAP-165 |
| `personaPositions`, `personaMemoryEmbeddings` | read (revival restore) | CAP-165 |
| `personaCommentEvaluations` | read (activation trial evidence; waning rejection-rate trigger) | CAP-160, 163 |
| `personaStyleBaseline` | read (waning + drift trigger) | CAP-163, 167 |
| `personaCadenceState` | read (retirement triggers) | CAP-164 |
| `mediaAssets`, `categories`, `systemConfig` | read | CAP-159, 166, 167 |
| `auditLog` | write (every operator mutation) | CAP-159–165 |

- CAP-166/167 crons write **no `auditLog`** (queue/flag outputs only) — consistent with their no-direct-write design.

## 3. States
*(Lifecycle-enum spine + trigger branches below. GPT enumerated each QA sub-step, each trigger, and each success/fail as standalone states (~90); folded on register evidence — the authoritative state set is the `lifecycleStatus` enum + `paused` boolean.)*

**A. Console input states:** **Recommendation queue** (CAP-166 cron output — recommends births/retirements, no direct write) · **Drift flags** (CAP-167 cron output — flag for operator: re-ground or retire, no auto status change).
**B. Lifecycle states operated (full enum):** `draft` · `nascent` · `active` · `waning` · `retired` + **`paused`** (boolean, resumable).
**C. Per-action branches:**
- **Birth (CAP-159), two modes:** confirm recommended (gated CAP-166) / admin hand-crafts. QA gate both ways: genome-diversity embed + 5 test comments + name-collision + operator approval. **INV-7: max 1 birth/day.** "Never born because others retired."
- **Activate (CAP-160):** trial = ≤3 comments + **≥N days (N unspecified — Open Question)**.
- **Pause / Resume (CAP-161/162):** resumable safety/quality hold; `pauseReason?` recorded.
- **Wane (CAP-163), four trigger branches:** rejection rate / saturation / drift / no-selection-N-days; actor includes **System** (auto-fire) alongside Editor/Publisher. Soft lifespan 3–6mo, operator-extendable.
- **Retire (CAP-164):** triggers fire OR operator-initiated; graceful; profile + history preserved; optional final comment via **CAP-173** (`personaComment.approve/publish` — not M7 safety-moderation); **INV-7: max 1 retirement/day**.
- **Revive confirm (CAP-165):** gated by CAP-177 threshold + CAP-159 re-activation QA; snapshots tally + threshold; restores same persona, full memory + lifecycle history; **never auto**.
**D. Daily-cap state:** max 1 birth + 1 retirement/day (INV-7 + CAP-166).

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| Population recommendation tick | cron | CAP-166 `population.recommend` (R-POP) | none (queue output) | — |
| Drift check tick | cron | CAP-167 `drift.check` (R-DRIFT) | personas (operator flag only) | — |
| Birth (confirm / hand-craft) | Editor, Publisher, Administrator | CAP-159 `persona.birth` (R-BIRTH, R-GENOME) | personas (draft/nascent), personaGenomes, personaLifecycleEvents, auditLog | CAP-166; R-BIRTH QA; INV-7 |
| Activate | Editor, Publisher, Administrator | CAP-160 `persona.activate` | personas (active), lifecycleEvents, auditLog | CAP-159; trial met |
| Pause | Editor, Publisher, **Moderator**, Administrator | CAP-161 `persona.pause` | personas (paused), lifecycleEvents, auditLog | none |
| Resume | Editor, Publisher, Administrator | CAP-162 `persona.resume` | personas (active), lifecycleEvents, auditLog | CAP-161 |
| Wane | **System**, Editor, Publisher | CAP-163 `persona.wane` (R-RETIRE) | personas (waning), lifecycleEvents, auditLog | CAP-171 signal; CAP-167 drift |
| Retire | Editor, Publisher, Administrator | CAP-164 `persona.retire` (R-RETIRE) | personas (retired), lifecycleEvents, auditLog; optional final comment via CAP-173 | CAP-163; INV-7 |
| Revive confirm | Editor, Publisher, Administrator | CAP-165 `persona.revive` (R-REVIVE, INV-8) | personas (active, "revived by community"), lifecycleEvents, auditLog | CAP-177; CAP-159 QA; snapshot |

## 5. Analytics Events
**None identified.** No M8 row writes `rawEvents`. Accountability = **`auditLog`** on every operator mutation (CAP-159–165) + **`personaLifecycleEvents`** (append-only population audit). CAP-166/167 crons write no auditLog (queue/flag outputs). These operational records must not be replaced by observational client analytics.

## 6. Components Used
- **§12.4 Admin Console Layout** (§7.4 motion: fade-in only, duration/fast).
- **A1 Data table** (persona roster by status) + **A12 queue / case board** (recommendation + drift-flag queues; claim/lease/aging affordances undefined) — inventory §3 archetype gaps.
- **§11.2** Text Input / Select (birth params, typed lifecycle inputs) · **§11.1** Button Primary/Secondary/Ghost + Destructive (retire) · **§11.7** Modal (birth-QA confirm, retire confirm) + Toast · **§11.5** Pill (lifecycle status, drift flag) · **§11.9** Skeleton.
- **Archetype gaps (also flagged):** no recommendation card, drift-review panel, trial-QA panel, or lifecycle-history component in §11.

## 7. Open Questions
*(Escalated items in RECONCILIATION-5A. These are unspecified detail.)*
1. **CAP-160 trial "≥N days"** — N unspecified. (All three.)
2. **Waning trigger thresholds** (rejection-rate %, saturation, no-selection N) — read from `systemConfig` but no keys named anywhere. (All three.)
3. **Genome hand-craft seam** — CAP-159's hand-craft branch and CAP-178's "hand-crafts persona" mode overlap; which screen owns hand-craft-at-birth (this console writes `personas` + `personaGenomes`; the genome screen writes genomes only)? (GLM.)
4. **No pre-activation "discard draft persona" path** — a persona created in error (bad genome / QA-slipped name collision) has no teardown but pause/retire, both of which preserve it publicly on `/personas`. Standing-rule gap → surfaced (Opus). Escalation-adjacent; see RECONCILIATION-5A.
5. **Paused display** in console vs public roster — internal state clear; public rendering unspecified (roster OQ). (GLM + GPT.)
6. **Operator-extension API** for the 3–6-month soft lifespan is unnamed. (GPT.)
7. **CAP-167 "re-ground"** — names "re-ground or retire" but no re-ground mutation is defined. (GPT.)
8. **Queue list query / sorting / filtering / pagination / recommendation freshness** — no list query capability is identified for loading the lifecycle queue. (All three.)
