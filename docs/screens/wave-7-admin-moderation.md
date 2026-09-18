---
# Moderation Console / Case Queue

**Route:** `/admin/moderation`
**Status:** NOT STARTED (no `app/admin/` tree exists)
**Contract:** PRD/02-contracts/wave-7/CONTRACT-7-admin-moderation-FINAL.md
**Slice(s):** P7E-14 (queue console: order, claim/lease, aging, auto-release, batch, s2/s3). Later ECON slices deliver additional actions on this console: P7E-15 (sanctions ladder + brigade restrict + terminate), P7E-16 (appeal resolve + SLA tick), P7E-17 (MAX refresh + context-signal review + plugin/MAX operator actions).

## Layout

STYLE-KIT §12.4 admin layout via shell: 48px header, 220px sidebar, dense content area.

```
┌─ 48px §12.4 header (shell chrome) ────────────────────────────┐
├─ 220px sidebar ─┬─ dense content area ────────────────────────┤
│ admin nav       │ ┌─ A12 queue/case board (case-ordered) ────┐ │
│                 │ │ CAP-330 order (verbatim):                │ │
│                 │ │ s0 → legal → s1 → appeals near bound →   │ │
│                 │ │ s2 → s3   (report count NOT a sort key)  │ │
│                 │ │ severity pills: s0_critical · s1_high ·  │ │
│                 │ │ s2_medium · s3_low + legal               │ │
│                 │ │ claim/lease affordances (20m/5m/60m) ·   │ │
│                 │ │ aging level · strike class · lease state │ │
│                 │ │ one board, many targetTypes (101/103/114/│ │
│                 │ │ 127/135/154/268/324/533/561 in same list)│ │
│                 │ └─────────────────────────────────────────┘ │
│                 │ ┌─ case detail ───────────────────────────┐  │
│                 │ │ A1 data table views · batch-25 select   │  │
│                 │ │ [confirm modals: termination typed-     │  │
│                 │ │  confirm · batch-25 · sanctions]        │  │
│                 │ │ inline errors (fail-closed rejections)  │  │
│                 │ └─────────────────────────────────────────┘  │
│                 │ load state: skeletons                        │
└─────────────────┴───────────────────────────────────────────────┘
```

## Components required

- A1 Data table (inventory §3 explicitly lists /admin/moderation — highest-priority gap) → apps/forum/src/components/ui/data-table/index.tsx
- A12 queue/case board (soft gap — claim/lease/aging affordances undefined) → apps/forum/src/components/ui/queue-board/index.tsx
- §11.5 severity pills (s0–s3, strike class, lease state) → apps/forum/src/components/ui/badge.tsx
- §11.7 confirm modals (termination typed-confirm, batch-25, sanctions) → apps/forum/src/components/ui/dialog.tsx
- §11.8 inline errors (fail-closed rejections) → MISSING: error component (§11.8) does not exist in the library (nearest stand-in: banner.tsx)
- §11.9 skeletons → apps/forum/src/components/ui/skeleton.tsx
- §12.4 admin layout via shell

## States required

*(Enum-backed set. GPT's ~200 transient states — each queue-order pair, each capability-key restriction, each sanction step as its own state — folded, since the `severity` (4), `moderationCases.status`, the 8 rejection/allowlist reason codes, and the sanction/capability-key enums are authoritative. Resolved on register evidence, not vote — see RECONCILIATION-7C §2.)*

**A. Queue ordering (CAP-330, verbatim):** **s0 → legal → s1 → appeals near bound → s2 → s3**; **report count not a sort key**.
**B. Claim/lease (328/329 + CAP-400 shared-lease):** unclaimed → **claimed (lease 20m · renew 5m · max 60m; atomic)** → renewed → **expired → triaged** (cron `lease.expire`, takeover audited); **one lease cross-widget** (Home's CAP-400 shares it).
**C. Severity:** s0_critical · s1_high · s2_medium · s3_low + legal (from legalIntake).
**D. Batch mode (335):** **max 25**; **only** approve_and_publish · reject_off_topic · reject_duplicate · clear_profanity_hold · suppress_duplicates; **never batch ban/DMCA/RI/clawback/critical**.
**E. Sanction ladder (336):** warn → strike → restrict → suspend; escalate by strike class; capability keys: **create_post · create_comment · react · report · manage_store · tag_product · revival_vote**; writes trustHistory.
**F. Termination (337):** TERMINATED — **Admin/Founder only; Mods may not**; gated CAP-336; enforcement next request (CAP-430 class).
**G. Appeals (340→341/342):** submitted (off-screen) → **resolved within 7 business days** · **overdue → Admin escalation — NOT auto-deny/restore** · **safety holds not auto-restored** (342 cron → adminInterventionAlerts).
**H. Aging/auto-release (331→333):** thresholds verbatim "s0 unclaimed 1h page Admin; **s1 8oh** [likely 8h — typo flagged]; s2 3d; s3 7d"; **S3 auto-release @96h** requires **autoReleaseEligible=true + completed gate + allowlist reason codes only** (profanity_soft · off_topic_uncertain · low_substance · wrong_post_type_uncertain) + **same revision + not a strike**. Classifier-unavailable holds are **never** autoReleaseEligible (CAP-323, C1).
**I. Queue-load (332/334, rendered via Home):** soft alerts at open-case **250/400**; **>500 → ingest.throttle** with carve-outs — **must not stop appeals/legal/erasure/safety/existing-case/Admin**.
**J. Context-signal review (127→137):** hidden until threshold; **never lowers Best (INV-3)**; resolution states.
**K. Showcase URL review (101):** pending → approved/rejected; **only approved renders the outbound button**.
**L. URL-obfuscation holds (102):** repeated attempts → `moderationStatus=held`.
**M. Comment moderation (135):** tombstone · hold · reject — **held/rejected fail-closed**.
**N. Rating moderation (114):** hold · remove · restore; **reversal applies the corresponding R-AGG delta**; **held/removed/withdrawn excluded from aggregate regardless of score**.
**O. Brigade (326→327):** correlated dismissed reports → new case → confirmed → **restrict_capability(report)**.
**P. Plugin registry (136) / Q. MAX refresh (138):** governance config (scope-placement Open Question).
**R. s2/s3 resolution (359):** Moderator clears holds; posts/comments state restored same-action.
**S. Intake dedupe (324):** many reports → **one open case per target+policyFamily+window**.
- **E-mod-2 CLOSED 2026-08-26 (founder decision):** CAP-101/103/114 **now write `moderationCases`** (polymorphic target: `postShowcases` row / the relevant mechanic-table row / `toolRatings` row) — same polymorphic case model as CAP-127/135/154/268/324; target typing matches CAP-533. These three action types appear in the **normal case-ordered queue (CAP-330) like everything else — no special UI, no sub-tabs, no separate panels needed.** Domain tables remain the detail record; `moderationCases` is the queue-visibility layer.

## Component library maturity note

⚠️ data-table/index.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ queue-board/index.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ badge.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ dialog.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ skeleton.tsx has zero production usage — expect possible integration friction, report don't silently patch.

No production-proven components cited by the contract's Components Used beyond the shell (button.tsx is production-proven when used for actions).
