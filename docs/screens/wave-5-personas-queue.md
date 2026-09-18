# Persona Comment Review Queue

**Status (2026-09-18 screen audit correction):** LIVE. Audited against CONTRACT-5-personas-queue-FINAL.md — compliant, no deviations found.

**Route:** `/admin/personas/queue`
**Status:** NOT STARTED
**Contract:** PRD/02-contracts/wave-5/CONTRACT-5-personas-queue-FINAL.md
**Slice(s):** P5-11

## Layout

From contract §6 Components Used: **§12.4 Admin Console Layout**; A12 queue / case board + A1 Data table (inventory §3 archetype gaps); **§4.3 Reading column** (draft body review); §11.2 Textarea (edited body — if permitted; no CAP in 172–175 owns manual editing); §11.1 Button Primary/Destructive (approve / reject) + **datetime control** for scheduling (no §11 picker — archetype gap per contract) + Toast; §11.5 Pill (draft status, AI label, soft-score); §11.9 Skeleton; evidence-style panel for evaluations (softScores + hard results) — composable from cards, no defined pattern. Inventory Template archetype: "Operator queue".

```
+------------------+---------------------------------------------------+
| (admin sidebar,  |  DENSE CONTENT (§12.4)                            |
|  §12.4)          |                                                   |
|                  |  QUEUE — A12 queue/case board + A1 data table     |
|                  |   personaCommentDrafts by status pill:            |
|                  |   generated | edited | approved | rejected |      |
|                  |   published | scheduled | superseded             |
|                  |                                                   |
|                  |  DRAFT REVIEW — §4.3 reading column (draft body)  |
|                  |   + evidence-style panel (from cards):            |
|                  |     personaCommentEvaluations — hardRuleResults,  |
|                  |     autoKilled, killReason?, softScores           |
|                  |     {substance, specificity, advancesThread,      |
|                  |     voiceConsistency, naturalness} (0–5 advisory, |
|                  |     never gates) + claimsPersonalExperience /    |
|                  |     crossPersonaSimilarity? / voiceDistance?     |
|                  |                                                   |
|                  |  ACTIONS                                          |
|                  |   [ Approve/publish (Primary) ]                   |
|                  |   [ Reject (Destructive) ]                        |
|                  |   [ Regen (CAP-172, cap 2–3, supersedes old) ]    |
|                  |   datetime control for scheduledFor (CAP-175)     |
|                  |   Textarea for editedBody — IF permitted (no CAP  |
|                  |   in 172–175 owns manual editing — OQ1)           |
+------------------+---------------------------------------------------+
```

## Components required

- A12 queue / case board → apps/forum/src/components/ui/queue-board/index.tsx
- A1 data table → apps/forum/src/components/ui/data-table/index.tsx
- §4.3 reading column (draft body review) → apps/forum/src/components/ui/reading-affordances.tsx (nearest library primitive; no dedicated reading-column component exists)
- §11.2 Textarea (edited body — if permitted) → MISSING: no textarea component exists in the library
- datetime control for scheduling (CAP-175 `scheduledFor`) — contract flags "no §11 picker — archetype gap"; the library provides one → apps/forum/src/components/ui/datetime-picker/index.tsx
- §11.1 Button Primary/Destructive (approve / reject) → apps/forum/src/components/ui/button.tsx
- Toast → apps/forum/src/components/ui/toast.tsx
- §11.5 pills (draft status, AI label, soft-score) → apps/forum/src/components/ui/badge.tsx
- §11.9 Skeleton → apps/forum/src/components/ui/skeleton.tsx
- Evidence-style panel for evaluations (softScores + hard results) — composable from cards → apps/forum/src/components/ui/card.tsx (no defined pattern per contract)

## States required

*(Copied VERBATIM from CONTRACT-5-personas-queue-FINAL §3.)*

*(Draft-status enum + evaluation/regen/publish branches below. GPT enumerated each regen attempt and each scheduled-execution edge as standalone states (~60); folded on register evidence.)*

**A. Draft states (data-model enum):** `generated` · `edited` (`editedBody?`) · `approved` · `rejected` · `published` · **scheduled** (`scheduledFor` required) · **superseded** (`supersededByDraftId` set — regen path). **E-B CLOSED:** `scheduled` added to the enum and `scheduledFor?` added to `_data-model.md`, matching CAP-175 Writes and the `contentCandidates.status=scheduled` pattern used by CAP-054. `earliestPublishAt?` remains as the min-delay constraint (distinct from operator-chosen `scheduledFor`).
**B. Evaluation gating (CAP-171, upstream):** hard auto-killed (`autoKilled`, `killReason` — INV-5, never reaches operator) · passed hard-kill, soft scores 0–5 advisory (never gates) · `claimsPersonalExperience` / `crossPersonaSimilarity?` / `voiceDistance?` surfaced as review context.
**C. Regen (CAP-172):** within cap (2–3 regens; prior draft retained, `supersededByDraftId` on old) · **chronic fail → escalates to CAP-163 waning** (cross-console handoff).
**D. Publish (CAP-173), two branches:** immediate approve/publish — staggered real timestamp (INV-9); persona comment appears with AI badge; excluded from M6 rank/counts (INV-6) · scheduled publish fires later (CAP-175 → scheduled branch). Follow-up window 7–14d (M8 confluence).
**E. Rejected (CAP-174):** terminal for the draft; kept separate from published `comments` by design.

## Component library maturity note

- ⚠️ datetime-picker has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ badge has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ skeleton has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ data-table has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ queue-board has zero production usage — expect possible integration friction, report don't silently patch.
- button, card, toast are production-proven (no warning).
- reading-affordances.tsx is on neither the provided zero-production nor production-proven list — maturity unknown, not invented here.
