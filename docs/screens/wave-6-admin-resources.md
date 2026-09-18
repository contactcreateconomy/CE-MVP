# Resource Ops Console

**Status (2026-09-18 screen audit correction):** LIVE. **Fixed (this pass):** `rightsReview`'s accept path skipped the `content_review` lane entirely (went straight to `accepted_for_forge`), making the `content_review` status and its `contentReview` mutation unreachable — corrected. Split the single `RightsActions` component (which rendered on both lanes but was only valid for one) into `RightsActions` / `ContentActions`. Added `canPublish` (Publisher/store_operator/Administrator) and `canLegalHold` (Moderator-only) RBAC flags and gated the corresponding `LifecyclePanel` controls, which previously had no role gating at all.

**Route:** /admin/resources
**Status:** NOT STARTED
**Contract:** PRD/02-contracts/wave-6/CONTRACT-6-admin-resources-FINAL.md
**Slice(s):** SLICE-P6-10 (/admin/resources review pipeline + forge), SLICE-P6-11 (publish, lifecycle, takedown, kill-gate)

## Layout

Derived from the contract's Template archetype ("Review queues + forge + kill-gate") + Components Used (admin-console archetype, §12.4):

```
┌──────────────────────────────────────────────────────────────┐
│ §12.4 ADMIN HEADER (48px, compact)                            │
├──────────┬───────────────────────────────────────────────────┤
│ ADMIN    │ REVIEW QUEUES (A12 queue/case board)               │
│ SIDEBAR  │  rights_review · content_review · forge · DMCA ·   │
│ 220px    │  cascade queues — claim affordances undefined      │
│ fixed    ├───────────────────────────────────────────────────┤
│          │ RESOURCE PIPELINE (A1 data table)                  │
│          │  draft → review → scheduled → published · paused · │
│          │  under_legal_review · archived · removed            │
│          │  status chips (§11.5) across the 10-state pipeline │
│          ├───────────────────────────────────────────────────┤
│          │ KILL-GATE DASHBOARD (A2 charts + widget/stats      │
│          │  cards; CAP-220 metrics render)                    │
│          │  + Administrator-only UGC kill-switch control       │
│          │    (CAP-221 — visually/RBAC-distinct)              │
└──────────┴───────────────────────────────────────────────────┘
Batch-scheduling + reject-reason inputs inline on rows/dialogs.
```

## Components required

- A1 data table → `apps/forum/src/components/ui/data-table/index.tsx`
- A12 queue/case board (rights_review / content_review / forge / DMCA / cascade queues) → `apps/forum/src/components/ui/queue-board/index.tsx`
- **MISSING: Charts (A2) does not exist — see PRD/04-design-system/DESIGN-SYSTEM-OPEN-ITEMS.md** (kill-gate dashboard)
- Widget/Stats cards (§11.3 card family, kill-gate metrics) → `apps/forum/src/components/ui/card.tsx`
- §11.2 inputs (reject-reason enums, batch scheduling) → `apps/forum/src/components/ui/input.tsx`
- Datetime control (batch scheduling — contract flags "no §11 picker, gap"; library now provides one) → `apps/forum/src/components/ui/datetime-picker/index.tsx`
- §11.5 Pill/Tag status chips → `apps/forum/src/components/ui/badge.tsx`
- §11.1 Button (+ Destructive for takedown/strike; Administrator-only CAP-221 control visually/RBAC-distinct) → `apps/forum/src/components/ui/button.tsx`
- §11.7 Modal (confirm-gated disables) → `apps/forum/src/components/ui/dialog.tsx`
- Toast → `apps/forum/src/components/ui/toast.tsx`
- §11.9 Skeleton → `apps/forum/src/components/ui/skeleton.tsx`
- **MISSING: Evidence/diff review panel (A10) does not exist in the library** (contract notes "A10 evidence-panel adjacency for forge review — M2 artifacts in queue")

## States required

*(10-state reference pipeline + status enums below. GPT's ~120 transient states — each rights-basis value, each hop, each kill-gate condition pass/fail as its own state — folded, since `resourceReferences.status` (10) + `resources.status` (8) + `resourceVersions.status` (8) + the kill-gate's seven named conditions are the authoritative sets.)*

**A. Reference review pipeline (10-state enum; this screen owns 4 transitions):** quarantined → *(scanning — CAP-204, off-screen)* → **rights_review** (CAP-205: → accepted_for_forge | rejected) → **content_review** (CAP-206: → accepted_for_forge | **rejected w/ reason enum — off_topic ≠ unsafe, distinct reasons, INV-11**) → accepted_for_forge. Terminal/parallel: rejected · forge_consumed · legal_hold · deleted.
**B. Rights-verified promotion (CAP-226):** operator marks sourceClass=rights_verified → **unlocks one→many forge for that reference** (INV-4 stays enforced for user_ugc).
**C. Forge states (CAP-207):** accepted_for_forge → `forge.fromReferences` → resources (draft) + resourceVersions (generating) + M2-pipeline artifacts. **Many→one synthesis OK; one→many blocked for user_ugc.** Reuses M2 pipeline + similarity/quote/SSRF gates. Operator-triggered System action; **auditLog written (E4).**
**D. Artifact validation (CAP-208, off-screen gate):** generating → **validation_failed** | approved (System PDF checks).
**E. Human editorial version review (CAP-559, E7):** `resourceVersions.status` editorial_review → approved. Distinct from CAP-208. Does not set `isCurrent`.
**F. Resource lifecycle (CAP-209/210 + E7 CAP-555/556/557/558):** draft → **review** (CAP-558) → **scheduled** (releaseDate, releaseBatch — drip 5–10/week; 40–60 launch inventory, DEC-S16) → **published** (resourceVersions → current, isCurrent=true; **exactly one current per published resource**) · **paused** (CAP-555) · **under_legal_review** (CAP-557, Moderator) · **archived** (CAP-556). CAP-209 RESOLVED 2026-08-09: **no formal license required — in-house curated marketing material only (UGC off), unrestricted use; optional non-blocking caption; no consent-stamp modal.**
**G. Contribution weighting (CAP-222, at forge finalize):** role + weight; **Σ ≤ 1.0 server-enforced; duplicates = 0 weight; upload order never sole determinant** (INV-7).
**H. Takedown (CAP-218, on valid notice — CAP-217 intake off-screen/W7):** `legalIntake` → complied | rejected_invalid | counter_notice; resources → **removed**; resourceTakedownActions written. Takedown ≠ erasure — legal hold may retain under restricted access (INV-8). CAP-557 `under_legal_review` is a prior hold, not a substitute for CAP-218 `removed`.
**I. Cascade walk (CAP-219, System):** BFS over resourceReferences→resourceContributions→resources; **per-node resourceCascadeReviews; depth ≤5; deeper → overflow queue (still recorded); unpublish within 5 hops** (INV-9).
**J. Strike (CAP-225):** rights violation confirmed → strikes + capabilityRestrictions (upload cap reduction / suspend); **residual log even if self-attested false (B7)**; M13 RI policy downstream. Reads `legalIntake` (E1).
**K. Kill-gate (CAP-220 cron):** evaluates named dimensions (publishable rate, ops cost, dispute rate, UGC-vs-in-house quality, parser isolation, legal lag, forge automation). **Numeric thresholds are admin-configurable** — not hardcoded in this contract. Tick cadence (refs-count OR days) is likewise config, not a register literal. Writes **`pilotKillGateEvaluations`** (append-only; continue or ditch_recommend). **Does not itself disable UGC.** CAP-221 Administrator writes `constellation.ugc.enabled=false` (audited) — the dormancy switch for `/contribute`.

## Component library maturity note

⚠️ data-table has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ queue-board has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ input has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ datetime-picker has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ badge has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ dialog has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ skeleton has zero production usage — expect possible integration friction, report don't silently patch.
