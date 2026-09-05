# CONTRACT-5-personas-queue-FINAL

**Screen:** Persona Comment Review Queue — `/admin/personas/queue`
**Wave:** 5 (M8 Persona — operator queue)
**Template archetype:** Operator queue
**Primary CAP-IDs:** CAP-172, CAP-173, CAP-174, CAP-175
**Actors:** Editor, Publisher, Administrator (CAP-172 Actor=System — admin initiates, system executes; CAP-085 precedent)
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. States: GPT's ~60 sub-states folded to the compact set. **E-B and E-C CLOSED 2026-08-24.** Manual-edit gap remains an Open Question (not escalated). See RECONCILIATION-5A §4.

---

## 1. Route & Access
- **Path:** `/admin/personas/queue`. **Dynamic params:** none. No anonymous/member access.
- **Actors:** Editor, Publisher, Administrator (CAP-173/174/175). **CAP-172 Actor=System** — admin initiates regen, system executes and writes (the CAP-085 precedent); UI is the operator queue.
- **Auth sequencing:** minimal role gate at Wave 5; M15 shell at Wave 7 (known pattern). CAP-019 applies.
- **Inputs arrive from no-UI capabilities:** CAP-170 `persona.generateComment` (drafts) and CAP-171 `persona.evaluate` (hard-kill + soft 0–5). This queue is their operator surface. **Hard auto-kill (INV-5) happens BEFORE operator review** (upstream, CAP-171) — auto-killed drafts never reach approval.
- **Publication safety:** the generative model has no direct mutation/publish authority; operator approval (CAP-173) or an authorized scheduled-publish path produces the public comment.
- **Teardown boundary:** CAP-174 rejects an unpublished draft. For an **already-published** persona comment, these four capabilities define **no** remove/unpublish action → teardown exists only via generic M6 moderation (CAP-122), not a persona-specific retract (Open Question).
- **Distinct from CAP-048:** this queue's regen (CAP-172, ambient M8 comments) is **not** CAP-048 `persona.regenComment` (M2 candidate-stage comments, `/admin/editorial`, Wave 4). Do not conflate.

## 2. Entities

| Entity | Direction | Grounding |
|---|---|---|
| `personaCommentDrafts` | read + write (status transitions, `supersededByDraftId`) | CAP-172–175 |
| `personaCommentEvaluations` | read (immutable: `hardRuleResults[]`, `autoKilled`, `killReason?`, `softScores {substance, specificity, advancesThread, voiceConsistency, naturalness}`) | CAP-173, 174 |
| `generationRuns` | read + write (each regen attempt preserved) | CAP-172 |
| `personas`, `personaPositions`, `personaMemoryEmbeddings`, `personaEngagements`, `posts`, `comments`, `systemConfig` | read | CAP-173 |
| `comments` | **write** (authorType=persona via M6) | CAP-173 |
| `personaEngagements`, `personaPositions` (stance evolution), `personaMemoryEmbeddings` | **write** | CAP-173 |
| `auditLog` | write | CAP-173, 174 |

## 3. States
*(Draft-status enum + evaluation/regen/publish branches below. GPT enumerated each regen attempt and each scheduled-execution edge as standalone states (~60); folded on register evidence.)*

**A. Draft states (data-model enum):** `generated` · `edited` (`editedBody?`) · `approved` · `rejected` · `published` · **scheduled** (`scheduledFor` required) · **superseded** (`supersededByDraftId` set — regen path). **E-B CLOSED:** `scheduled` added to the enum and `scheduledFor?` added to `_data-model.md`, matching CAP-175 Writes and the `contentCandidates.status=scheduled` pattern used by CAP-054. `earliestPublishAt?` remains as the min-delay constraint (distinct from operator-chosen `scheduledFor`).
**B. Evaluation gating (CAP-171, upstream):** hard auto-killed (`autoKilled`, `killReason` — INV-5, never reaches operator) · passed hard-kill, soft scores 0–5 advisory (never gates) · `claimsPersonalExperience` / `crossPersonaSimilarity?` / `voiceDistance?` surfaced as review context.
**C. Regen (CAP-172):** within cap (2–3 regens; prior draft retained, `supersededByDraftId` on old) · **chronic fail → escalates to CAP-163 waning** (cross-console handoff).
**D. Publish (CAP-173), two branches:** immediate approve/publish — staggered real timestamp (INV-9); persona comment appears with AI badge; excluded from M6 rank/counts (INV-6) · scheduled publish fires later (CAP-175 → scheduled branch). Follow-up window 7–14d (M8 confluence).
**E. Rejected (CAP-174):** terminal for the draft; kept separate from published `comments` by design.

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| Regen draft | System (operator-initiated) | CAP-172 `persona.regen` | personaCommentDrafts (new + supersede old), generationRuns | CAP-171; regen cap 2–3 |
| Approve / publish | Editor, Publisher, Administrator | CAP-173 `personaComment.approve/publish` (§9 Backend) | comments (authorType=persona via M6), personaEngagements, personaPositions, personaMemoryEmbeddings, drafts (published), auditLog | CAP-171 (passed hard-kill); **CAP-175** if scheduled; M6 comments.create rules |
| Reject | Editor, Publisher, Administrator | CAP-174 `personaComment.reject` | drafts (rejected), auditLog | CAP-171 |
| Schedule | Editor, Publisher, Administrator | CAP-175 `personaComment.schedule` | drafts (status=scheduled, scheduledFor) | CAP-171 |

- **E-C CLOSED:** CAP-173 Gated by is **CAP-175** for the scheduled branch (self-reference removed).
- **Load queue/detail** — no exact query defined. **Remove published persona comment** — no action defined by CAP-172–175 (Open Question).

## 5. Analytics Events
**None identified** for the operator actions (audit-logged, not `rawEvents`). **Downstream note:** CAP-173 publishes a comment via M6, whose creation (CAP-120 pattern) appends `rawEvents` with `isAiPersona` stamping (CAP-438) — but that belongs to the M6 comment write, not this queue screen. Whether it applies on this path is unpinned in the register (Open Question). `auditLog` covers all three operator actions.

## 6. Components Used
- **§12.4 Admin Console Layout** · **A12 queue / case board** + **A1 Data table** (inventory §3 archetype gaps).
- **§4.3 Reading column** (draft body review) · **§11.2 Textarea** (edited body — if permitted; no CAP in 172–175 owns manual editing, see E-D-adjacent) · **§11.1** Button Primary/Destructive (approve / reject) + **datetime control** for scheduling (no §11 picker — archetype gap) + Toast · **§11.5** Pill (draft status, AI label, soft-score) · **§11.9** Skeleton.
- Evidence-style panel for evaluations (softScores + hard results) — composable from cards, no defined pattern.

## 7. Open Questions
*(Escalated items in RECONCILIATION-5A. These are unspecified detail.)*
1. **No operator "edit draft body" capability** in this batch, yet the schema supports it — `personaCommentDrafts.editedBody?` and `status=edited` exist, and CAP-048 (M2) lets an Editor regen; but no CAP in 172–175 covers a manual text edit (the analog of CAP-543 for candidate drafts). Either `editedBody` is written by an uncovered action or persona drafts are regen-only. (GLM + GPT + Opus.) → surfaced; see RECONCILIATION-5A.
2. **Teardown of a published persona comment** — CAP-173 publishes to `comments`; retraction exists only via generic M6 CAP-122 soft-delete, not a persona-specific operator retract. Standing-rule flag. (Opus.)
3. **Scheduled-publish failure / ineligibility revalidation** — no CAP defines what happens if the persona is paused/retired (CAP-161/164) between scheduling and fire time, nor scheduled-publish retry/idempotency/recovery. (All three.)
4. **`rawEvents` seam on persona-comment publish** via the M6 path — applies or not, unpinned. (GLM + Opus.)
5. **Regen cap "2–3"** — exact per-environment value and whether the initial generation counts is unspecified. (GPT.)
6. **Queue list/detail query, ordering, filtering, pagination, assignment** — undefined. (All three.)
7. **Draft retention horizon** — rejected/superseded drafts retained by design ("kept separate"); horizon unspecified. (GLM.)
