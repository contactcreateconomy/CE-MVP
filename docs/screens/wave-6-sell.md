---
# Rocketeer Dashboard (manage · analytics · evidence)

**Status (2026-09-18 screen audit correction):** LIVE. Audited alongside wave-6-sell-apply.md — no separate deviations found on the dashboard itself.


**Route:** `/sell`
**Status:** NOT STARTED
**Route drift:** none
**Contract:** PRD/02-contracts/wave-6/CONTRACT-6-sell-FINAL.md
**Slice(s):** P6-16

## Layout
Derived from contract §6 (Components Used) + inventory Template archetype "Seller dashboard":

```
┌────────────────────────────────────────────────────────────────────────┐
│ ROCKETEER DASHBOARD (member; activated seller)                          │
│ Store lifecycle: setup (0 products — badge provisional) → active        │
│ (≥1 approved product — badge active + store public) → paused (self,     │
│ immediate) → suspended (operator) → closed/revoked                      │
│ [ configure storefront ] [ pause store/product/tag (immediate) ]        │
├───────────────────────────────┬────────────────────────────────────────┤
│ ANALYTICS (CAP-257)           │ PRODUCTS — A1 data table                │
│ Stats Cards (§11.3):          │  pipeline: draft → auto_screened →      │
│  Traffic · Intent · Confirmed │  under_review → approved (package       │
│  (aggregate-only, k≥5/cell,   │  LOCKED) / rejected (reason enum) /     │
│  ≥1d buckets, ≥24h delay)     │  withdrawn / expired /                  │
│                               │  destination_unavailable / paused       │
│                               │  [ submit product (multi-part form +    │
│                               │    locked-package summary) ]            │
│                               │  [ edit request (new version; current   │
│                               │    stays live) ]                        │
├───────────────────────────────┴────────────────────────────────────────┤
│ EVIDENCE — four tiers, NEVER conflated (§11.5 Pill labels):            │
│  ① SubID passthrough (CAP-258) ② unique coupon (CAP-259)               │
│  ③ self-report (CAP-260, flagged unverified)                           │
│  ④ Amazon self-report = CAP-525 interim tier — weight strictly between  │
│     click-only (10) and network-verified (25); visibly distinct         │
│     everywhere surfaced (A13 token does not exist — fenced)             │
└────────────────────────────────────────────────────────────────────────┘
```

## Components required
- Dashboard cards + §11.3 Stats Card (Traffic/Intent/Confirmed) → apps/forum/src/components/ui/card.tsx
- A1 data table (product list/statuses) → apps/forum/src/components/ui/data-table/index.tsx (contract §6 calls A1 an archetype gap — the library does provide data-table/index.tsx; verify density/needs fit)
- Multi-part form (product submit; locked-package summary) (§11.2) → apps/forum/src/components/ui/input.tsx
- §11.7 Modal (edit request, pause confirm) → apps/forum/src/components/ui/dialog.tsx
- §11.5 Pill — evidence-tier labels (visibly distinct: interim/unverified vs network-verified; must never be visually conflatable) → apps/forum/src/components/ui/badge.tsx — MISSING: Verified/unverified conversion badge (A13) does not exist in the library (contract §6 + inventory §3: "no distinct verified-vs-unverified badge token exists in §11 → flagged, not designed"; per P6-16/extra-scrutiny #5, use distinct copy keys on a §11.5 Pill placeholder — do not design A13)
- §11.9 Skeleton → apps/forum/src/components/ui/skeleton.tsx
- §11.8 Error → apps/forum/src/components/ui/banner.tsx (nearest library pattern — no dedicated error component; report fit)

## States required
*(Enum-backed set. GPT's ~120 transient states — each config field, each evidence sub-step, each Amazon interim micro-state — folded, since the `storefrontProducts.status`, `storefrontLinks.validationState`, and `salesEvidence.{type,status}` enums are authoritative.)*

**A. Store lifecycle:** setup (approved, 0 products — badge provisional) → **active (≥1 approved product: badge active+public; store public)** → paused (self, CAP-270 — immediate, no review) → suspended (operator/circuit-breaker) → closed/revoked.
**B. Product pipeline (seller view):** draft → **auto_screened** (CAP-236 disposition) → under_review → **approved (package LOCKED — immutable at persistence; write-to-locked THROWS)** / **rejected (reason enum)** / withdrawn / expired / destination_unavailable; paused.
**C. Edit requests (CAP-239):** **material change → new under_review version; current stays live**; collection assignment = **non-substantive** (no re-review).
**D. Analytics view (CAP-257):** three honest buckets **Traffic / Intent / Confirmed**; k≥5/cell, ≥1d buckets, ≥24h delay, parent/child suppression, rate-limited overlapping queries; wishlist stronger-suppressed. Export action unnamed (Open Question).
**E. Evidence — four tiers, NEVER conflated:**
1. **SubID passthrough** (CAP-258 — Actor **member** per E7; opaque clickId, never buyer PII; confirmed on network report via CAP-261).
2. **Unique coupon** (CAP-259 — Actor **member** per E7; **confirmed only after merchant report**).
3. **Self-report** (CAP-260 — member; **flagged unverified; never full Signal; anomaly-checked**).
4. **Amazon self-report = CAP-525 interim tier** — weight **strictly between click-only (10) and network-verified (25), never equal either**; **must be visibly distinct everywhere surfaced (seller dashboard, admin, M12 ladder detail)**. Amazon conversion never reaches Confirmed (CAP-261 structurally excludes).
**F. CAP-525 persistence (E2 CLOSED 2026-08-25):** the interim tier persists **`type=self_report` + `status=unverified`** (two fields) — **NOT** a `self-reported-unverified` status literal, which does not exist in `salesEvidence.status {unverified·network_verified·refunded}`. The tier's distinctness is carried by `type` + Amazon source context (destination + no reconciliation path), surfaced distinctly per E. Register corrected 2026-08-25.
**G. Actor assignment (E7 CLOSED 2026-08-25):** CAP-258/259 corrected **System → member** in the register — trigger, actor, and writes are all member-side (seller-submitted evidence, no System derivation); sibling-consistent with CAP-260. Contrast CAP-207-style rows where System genuinely computes.

## Component library maturity note
- ⚠️ data-table has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ input has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ dialog has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ badge has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ skeleton has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ banner has zero production usage — expect possible integration friction, report don't silently patch.
- Production-proven, no warning needed: button, card.
---
