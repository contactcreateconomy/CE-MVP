# Persona Population Console

**Route:** `/admin/personas`
**Status:** NOT STARTED
**Contract:** PRD/02-contracts/wave-5/CONTRACT-5-admin-personas-FINAL.md
**Slice(s):** P5-10

## Layout

From contract §6 Components Used: **§12.4 Admin Console Layout** (§7.4 motion: fade-in only, duration/fast); A1 Data table (persona roster by status); A12 queue / case board (recommendation + drift-flag queues; claim/lease/aging affordances undefined); §11.2 Text Input / Select (birth params, typed lifecycle inputs); Buttons (Primary/Secondary/Ghost + Destructive for retire); Modal (birth-QA confirm, retire confirm) + Toast; Pills (lifecycle status, drift flag); Skeleton. Inventory Template archetype: "Admin lifecycle queue".

```
+------------------+---------------------------------------------------+
| (admin sidebar,  |  DENSE CONTENT (§12.4)                            |
|  §12.4)          |                                                   |
|                  |  CONSOLE INPUT QUEUES (A12 boards)                |
|                  |   [ Recommendation queue — CAP-166 cron output;   |
|                  |     recommends births/retirements, no direct      |
|                  |     write; operator executes ]                    |
|                  |   [ Drift flags — CAP-167 cron output;            |
|                  |     re-ground or retire, no auto status change ]  |
|                  |                                                   |
|                  |  LIFECYCLE ROSTER (A1 data table, by status)      |
|                  |   lifecycleStatus pills: draft | nascent |        |
|                  |     active | waning | retired (+ paused boolean) |
|                  |                                                   |
|                  |  PER-ACTION CONTROLS                              |
|                  |   Birth (confirm recommended / hand-craft) —      |
|                  |     Modal: birth-QA confirm (genome-diversity     |
|                  |     embed + 5 test comments + name-collision +    |
|                  |     operator approval)                            |
|                  |   Activate · Pause/Resume · Wane · Revive confirm |
|                  |   Retire — Button (Destructive) + Modal confirm   |
|                  |   §11.2 Text Input / Select for birth params and  |
|                  |     typed lifecycle inputs                        |
+------------------+---------------------------------------------------+
```

## Components required

- A1 data table (persona roster by status) → apps/forum/src/components/ui/data-table/index.tsx
- A12 queue / case board (recommendation + drift-flag queues) → apps/forum/src/components/ui/queue-board/index.tsx (claim/lease/aging affordances undefined per contract)
- §11.2 Text Input / Select (birth params, typed lifecycle inputs) → apps/forum/src/components/ui/input.tsx + apps/forum/src/components/ui/select.tsx
- §11.1 Button Primary/Secondary/Ghost + Destructive (retire) → apps/forum/src/components/ui/button.tsx
- §11.7 Modal (birth-QA confirm, retire confirm) + Toast → apps/forum/src/components/ui/dialog.tsx + apps/forum/src/components/ui/toast.tsx
- §11.5 pills (lifecycle status, drift flag) → apps/forum/src/components/ui/badge.tsx
- §11.9 Skeleton → apps/forum/src/components/ui/skeleton.tsx
- MISSING: recommendation card, drift-review panel, trial-QA panel, lifecycle-history component — contract §6 states none exist in §11

## States required

*(Copied VERBATIM from CONTRACT-5-admin-personas-FINAL §3.)*

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

## Component library maturity note

- ⚠️ input has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ select has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ dialog has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ badge has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ skeleton has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ data-table has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ queue-board has zero production usage — expect possible integration friction, report don't silently patch.
- button, toast are production-proven (no warning).
