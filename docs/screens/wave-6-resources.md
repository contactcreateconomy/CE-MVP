---
# Resource Library

**Status (2026-09-18 screen audit correction):** LIVE. **Fixed (this pass):** see wave-6-resource-viewer.md — the member-view acquisition gate removed platform-wide.


**Route:** `/resources`
**Status:** NOT STARTED
**Route drift:** none
**Contract:** PRD/02-contracts/wave-6/CONTRACT-6-resources-FINAL.md
**Slice(s):** P6-07

## Layout
Derived from contract §6 (Components Used: grid archetype) + inventory Template archetype "Grid + acquire + quota counts":

```
┌────────────────────────────────────────────────────────────────────────┐
│ RESOURCE LIBRARY                                                        │
│  category/tag facets (§11.5 Pill/Tag)                                   │
│  quota counts — inline remaining, member-only (CAP-215)                 │
│  Stats Card (§11.3): 5/day · 20/week remaining                          │
├────────────────────────────────────────────────────────────────────────┤
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐               │
│  │ RESOURCE  │ │ RESOURCE  │ │ RESOURCE  │ │ RESOURCE  │   grid        │
│  │ card      │ │ card      │ │ card      │ │ card      │   (§11.3      │
│  │ (§11.3):  │ │           │ │           │ │           │    card       │
│  │ title ·   │ │           │ │           │ │           │    family)    │
│  │ category  │ │           │ │           │ │           │               │
│  │ · license │ │           │ │           │ │           │               │
│  │ [Get free │ │           │ │           │ │           │               │
│  │  download]│ │           │ │           │ │           │               │
│  │ (member;  │ │           │ │           │ │           │               │
│  │ re-download │           │ │           │ │           │               │
│  │ = Secondary│           │ │           │ │           │               │
│  │  Button)  │ │           │ │           │ │           │               │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘               │
│  attribution line (CAP-229): "Created by Createconomy · Built with     │
│  references contributed by [handle]"                                    │
│  PDF deep-links → /resources/[slug]/view                                │
└────────────────────────────────────────────────────────────────────────┘
```

## Components required
- Resource cards (§11.3 card family) → apps/forum/src/components/ui/card.tsx (generic base) — MISSING: dedicated Resource Card does not exist in the library (contract §6 archetype gap)
- Stats Card for quota counts (§11.3) → apps/forum/src/components/ui/card.tsx — MISSING: dedicated quota-counter component does not exist in the library (contract §6 archetype gap)
- Category/tag facets (§11.5 Pill/Tag) → apps/forum/src/components/ui/badge.tsx
- §11.1 Button ("Get free download"; Secondary for re-download) → apps/forum/src/components/ui/button.tsx
- §11.9 Skeleton → apps/forum/src/components/ui/skeleton.tsx
- Toast §11.7 (available-not-prescribed) → apps/forum/src/components/ui/toast.tsx
- §11.8 Error (exhausted/blocked inline) → apps/forum/src/components/ui/banner.tsx (nearest library pattern — no dedicated §11.8 error component exists in the library; report fit)
- MISSING: Acquisition-state control does not exist in the library (contract §6 archetype gap)
- MISSING: Attribution panel does not exist in the library (contract §6 archetype gap)
- MISSING: Version-aware download component does not exist in the library (contract §6 archetype gap)

## States required
*(Status-enum set below. GPT's ~60 transient micro-states — each quota-period-change, each concurrent-collapse, each signed-URL sub-step — folded, since `resources.status` (8) + acquire/download/quota lifecycle are the authoritative sets. Per RECONCILIATION-6B §1.)*

**A. Library listing/visibility (CAP-224):** register states indexability — "Indexable after publish; noindex removed/legal_hold/draft." Which of the 8 `resources.status` values are *browsable* (vs merely indexable) is not stated (Open Question). Version gating: published ∧ exactly one `isCurrent` version.
**B. Quota states (CAP-212 + CAP-215):** within-quota (inline remaining counts) → exhausted → **blocked, no write** (CAP-215 gate; server-side, never trust client). 5/day · 20/week; user-local calendar keys; lazy reset on acquire.
**C. Acquisition idempotency:** concurrent double-get → **one row** (unique key); re-acquire of an owned resource blocked by uniqueness, not quota.
**D. Download states (CAP-213):** acquired → signed URL **TTL=60s** → download recorded with integrityClass; **abort mid-download does NOT reverse quota**; re-download ≠ quota (free, unbounded); each download schedules `signal.settleDownload` (CAP-216 cron consumes).
**E. Attribution states (CAP-229):** attribution line present — verbatim: **"Created by Createconomy · Built with references contributed by [handle]"**; post-erasure: `resourceContributions.contributorUserId` nulled (CAP-227) → line degrades; weight retained.
**F. Invariants:** **View ≠ acquisition; views never burn quota** (DEC-S15 / INV-6); acquisitions (ownership) ≠ downloads (fetch); license = terms pointer (DEC-S20 OPEN).
**G. Actor branches:** anonymous = browse + rawEvents browse only; member = browse + acquire + download + quota counts + attribution.

## Component library maturity note
- ⚠️ badge has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ skeleton has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ banner has zero production usage — expect possible integration friction, report don't silently patch.
- Production-proven, no warning needed: button, card, toast.
---
