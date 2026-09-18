---
# Store Validation Queue

**Route:** `/admin/store`
**Status:** NOT STARTED
**Route drift:** none
**Contract:** PRD/02-contracts/wave-6/CONTRACT-6-admin-store-FINAL.md
**Slice(s):** P6-14 (validation pipeline: request → inspect → lock), P6-15 (enforcement: pause/strike/breaker/pull/revoke/complaint)

## Layout
Derived from contract §6 (Components Used) + inventory Template archetype "Operator queue":

```
┌────────────────────────────────────────────────────────────────────────┐
│ ADMIN (minimal basic role-check gate now; full M15 /admin shell         │
│  CAP-390/392 wraps at Wave 7 — known Wave-3 E5 pattern; §12.4)          │
├────────────────────────────────────────────────────────────────────────┤
│ STORE REQUEST QUEUE (CAP-232; throughput CAP-263: per-Rocketeer caps,   │
│  batch ≤10) — statuses: submitted → under_review → info_requested /     │
│  approved (→ setup + badge provisional) / rejected (reasonCode)         │
│  + applicant panel (§11.3 card; moderationCases read)                   │
├────────────────────────────────────────────────────────────────────────┤
│ PRODUCT VALIDATION QUEUE — A1 data table / A12 queue board:             │
│  draft → auto_screened (disposition pass·needs_human·fail) →            │
│  under_review → [ APPROVE — lock package, validationState→              │
│  approved_locked, write-to-locked THROWS ] / [ REJECT — 8-value reason  │
│  dropdown ]                                                             │
│  linkValidations fingerprint/evidence panel (A10-adjacent): finalHost · │
│  redirectHash · titleHash · contentHash · scanRegion · deviceProfile    │
├────────────────────────────────────────────────────────────────────────┤
│ ENFORCEMENT (confirm-gated §11.7 Modal + Toast): block-domain · pause   │
│  store · strike · escalate (reason code + auditLog) · emergency pull    │
│  (instant) · badge revoke (public notice) · strike ledger · merchant    │
│  complaint intake (CAP-268, merchant actor)                             │
└────────────────────────────────────────────────────────────────────────┘
```

## Components required
- A1 data table (contract §6: "highest-priority" archetype gap) → apps/forum/src/components/ui/data-table/index.tsx
- A12 queue/case board (soft gap) → apps/forum/src/components/ui/queue-board/index.tsx
- §11.3 card family (applicant panel, widget cards) → apps/forum/src/components/ui/card.tsx
- §11.2 Inputs (reason dropdowns incl. 8-value rejection enum: unsafe · off_topic · masked_link · ownership_unverified · prohibited_category · metadata_violation · duplicate · price_unverifiable · other) → apps/forum/src/components/ui/input.tsx + apps/forum/src/components/ui/dropdown-menu.tsx (and/or apps/forum/src/components/ui/select.tsx)
- §11.7 Modal (confirm-gated: revoke, pull, lock) → apps/forum/src/components/ui/dialog.tsx
- Toast → apps/forum/src/components/ui/toast.tsx
- §11.5 Pill (dispositions, statuses, strike count) → apps/forum/src/components/ui/badge.tsx
- §11.9 Skeleton → apps/forum/src/components/ui/skeleton.tsx
- §11.8 Error → apps/forum/src/components/ui/banner.tsx (nearest library pattern — no dedicated error component; report fit)
- MISSING: Evidence/diff panel (A10) does not exist in the library — contract §6 cites an "A10-adjacent fingerprint/evidence panel (linkValidations)"; inventory §3 lists A10 as an undefined archetype (see PRD/04-design-system/DESIGN-SYSTEM-OPEN-ITEMS.md)

## States required
*(Enum-backed pipeline. GPT's ~150 transient states — each rejection reason, each strike count, each intervention sub-step — folded, since `storeRequests.status` (5), `storefronts.status` (8), the product-status enum, `linkValidations.disposition` (4), and the 8-value rejection enum are authoritative.)*

**A. Store-request queue (CAP-232, `storeRequests.status`):** submitted → under_review → **info_requested (reason codes)** / **approved (→ storefront.status=setup; Rocketeer badge provisional)** / **rejected (reasonCode)**.
**B. Product validation pipeline:** draft → (CAP-235 isolated SSRF-safe **headless** inspection — executes JS, catches cloaking; off-screen) → **auto_screened** (CAP-236 disposition pass/needs_human/fail + Phase-1 category allowlist + metadata screen; **off_topic ≠ unsafe — distinct reasons, INV-11**) → **under_review** → human: **approved — LOCK THE PACKAGE (immutable at persistence; validationState→approved_locked)** (CAP-237) / **rejected — enumerated reason: unsafe · off_topic · masked_link · ownership_unverified · prohibited_category · metadata_violation · duplicate · price_unverifiable · other** (CAP-238).
**C. Drift handling (System, off-screen triggers):** buyer report → **immediate out-of-cycle re-scan** (CAP-241; credible complaint may pause before investigation) · redirect-chain change → under_review (CAP-242) · rescan cadence **24h high-risk / 7d normal, partly randomized** (CAP-240 cron). Drift → **BUY disabled, storefront visible** (a drifted link fails the `approved_locked` gate — E1 makes this exact).
**D. Operator actions (CAP-264):** **block-domain / pause store / strike / escalate** — each with reason code + auditLog.
**E. Circuit breaker (CAP-265, System):** **auto-suspend on N complaints / M hours — N/M unspecified** (Open Question); **3-strike → revoke + close**.
**F. Emergency pull (CAP-266):** single-product, **instant**.
**G. Badge revocation (CAP-267) — E3 CLOSED 2026-08-25:** 3-strike or confirmed violation → revoke; **public storefront notice; NEVER infers buyers**. The prior "notifies followers/watchers/safety-opt-ins" audience **has no backing entity and no creating CAP** — follower/watcher notification is **FUTURE-M11-01** (explicitly deferred, tracked in OPEN-DECISIONS; revocation itself + auditLog unaffected). Confirmed-buyer notification remains conditional on merchant/network-returned authorized consented user-linked transaction (CAP-271, whose follower branch is likewise FUTURE-scoped).
**H. Merchant complaint intake (CAP-268):** merchant files via portal → merchantComplaints + moderationCases → routes to takedown flow. **Portal surface unspecified — Actor=merchant on an operator-screen row** (Open Question); relationship to M13 `legalIntake type=merchant_ip` (W7 /legal/intake) unstated — two complaint paths named (Open Question).
**I. Throughput controls (CAP-263):** **per-Rocketeer caps, batch ≤10**.

## Component library maturity note
- ⚠️ data-table has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ queue-board has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ input has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ dropdown-menu has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ select has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ dialog has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ badge has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ skeleton has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ banner has zero production usage — expect possible integration friction, report don't silently patch.
- Production-proven, no warning needed: button, card, toast.
---
