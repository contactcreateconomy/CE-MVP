---
# Product Detail + Discussion

**Route:** `/s/[handle]/[product]`
**Status:** NOT STARTED
**Route drift:** none
**Contract:** PRD/02-contracts/wave-6/CONTRACT-6-product-detail-FINAL.md
**Slice(s):** P6-18

## Layout
Derived from contract §6 (Components Used: product page layout · M6 discussion) + inventory Template archetype "Product page (reuses M6 thread)":

```
┌────────────────────────────────────────────────────────────────────────┐
│ PRODUCT PAGE                                                            │
│  image · name · category · claims · description                         │
│  disclosure Pill (§11.5) · conflicted-review label: "Seller-affiliated  │
│  — not in Community Score" (readable, labeled, not hideable)            │
│  card preview + wishlist affordance (§11.3 card + §11.7 bottom-sheet;   │
│  second tap on mobile; disclosure survives collapse)                    │
│  [ BUY → /go/{linkId} ]  (only when validationState=approved_locked;    │
│   disabled on drift/unavailable — historical context preserved)         │
├────────────────────────────────────────────────────────────────────────┤
│ PRODUCT DISCUSSION (CAP-253 — M6 thread via product `threadContext`,    │
│  hosted on the CAP-560 shadow post, hidden from feed/discovery)         │
│  comment list (M6 thread components) · default legitimacy-weighted      │
│  sort (anti-brigading) · owner: hide-for-moderator-review (CAP-561,     │
│  NEVER delete) → M13 queue                                              │
└────────────────────────────────────────────────────────────────────────┘
```

## Components required
- Product page card / preview (§11.3) → apps/forum/src/components/ui/card.tsx (generic base) — MISSING: dedicated storefront/product card does not exist in the library (contract §6 archetype gap)
- Bottom-sheet preview (§11.7) → apps/forum/src/components/ui/dialog.tsx (nearest library pattern — no dedicated bottom-sheet component exists; report fit)
- M6 thread components (comment list per M6 contract, legitimacy-weighted sort) — not in the ui/ library; owned by the Wave-5 M6 discussion build (consume, do not re-implement)
- Disclosure Pill (§11.5) → apps/forum/src/components/ui/badge.tsx
- Conflicted-review label — MISSING: no dedicated conflicted-review label component exists (contract §6: "no dedicated component, archetype gap"); nearest library pattern badge.tsx with fixed, non-hideable copy — report fit
- BUY Button (§11.1, routes to /go) → apps/forum/src/components/ui/button.tsx
- §11.9 Skeleton → apps/forum/src/components/ui/skeleton.tsx
- §11.8 Error → apps/forum/src/components/ui/banner.tsx (nearest library pattern — no dedicated error component; report fit)

## States required
*(Enum-backed set. GPT's ~70 transient states — each BUY-disabled reason, each conflict state, each Amazon sub-state — folded, since `storefrontProducts.status` + `storefrontLinks.validationState` (4) + `reviewConflicts.state` (4) are the authoritative sets.)*

**A. Product availability (CAP-245):** live reference renders · **degrades if product unavailable — BUY disabled** · **historical commercial context preserved** (R-BLOCK).
**B. Destination validity (data-model; E1-consistent):** link **`approved_locked`** (BUY routes) · **drift → `under_review` — BUY disabled, storefront visible**.
**C. Amazon-destination (CAP-524, settled):** renders and routes via the **standard /go flow — same as all networks; clicks/traffic tracked via existing CAP-247–249/256 infra**; UI must communicate **why Amazon links stay in Traffic/interim-tier and never reach full Confirmed status** (network-verified conversion Signal structurally never awarded — CAP-261 excludes Amazon). The redirect layer must NOT treat Amazon clicks differently in UI or click-data.
**D. Card preview + wishlist (CAP-246):** merchant/sold-by/disclosure/score/wishlist; second tap on mobile; disclosure survives collapse.
**E. Conflicted review (CAP-255):** reviewer = seller/co-owner/operator/same-device etc. → **excluded from `tools` aggregate + labeled, readable not hidden; label not hideable; false claims still moderated** (INV-8); label copy: "Seller-affiliated — not in Community Score." (same-device alone ≠ confirmed.)
**F. Product Discussion (CAP-253):** M6 thread via product `threadContext` — hosted on the **CAP-560 shadow post** (Finding 2) · **default-sorted by M6 legitimacy-weighted ranking (anti-brigading)** · **owner can HIDE-for-moderator-review, NEVER delete — CAP-561 (Finding 1): comments.moderationStatus=held-for-review + moderationCases routed to M13 review queue; owner cannot delete; moderator disposition per M13.**

## Component library maturity note
- ⚠️ dialog has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ badge has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ skeleton has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ banner has zero production usage — expect possible integration friction, report don't silently patch.
- Production-proven, no warning needed: button, card.
---
