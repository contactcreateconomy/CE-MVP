---
# Storefront (public)

**Status (2026-09-18 screen audit correction):** LIVE. **Fixed (this pass):** see wave-6-product-detail.md.


**Route:** `/s/[handle]`
**Status:** NOT STARTED
**Route drift:** none (note: the wave-6 live-status map parenthesized this screen as `/store/[handle]`; the inventory row and the contract both specify `/s/[handle]`, which is used here — no code exists yet, so no drift exists)
**Contract:** PRD/02-contracts/wave-6/CONTRACT-6-storefront-FINAL.md
**Slice(s):** P6-18

## Layout
Derived from contract §6 (Components Used) + inventory Template archetype "Store page + product cards":

```
┌────────────────────────────────────────────────────────────────────────┐
│ STORE HEADER — store identity · seed-store label (§11.5 Pill,          │
│  isPlatformCurated: "clearly labeled, not user-owned") · Rocketeer      │
│  badge · disclosure banner                                              │
├────────────────────────────────────────────────────────────────────────┤
│ PRODUCT CARDS grid (§11.3 card family — no dedicated storefront card)   │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐                              │
│  │ image ·   │ │           │ │           │  hover/tap → CARD PREVIEW    │
│  │ name ·    │ │           │ │           │  (CAP-246): desktop hover /  │
│  │ category ·│ │           │ │           │  mobile bottom-sheet (§11.7, │
│  │ useCase   │ │           │ │           │  deliberate second tap) →    │
│  │ [ BUY →   │ │           │ │           │  merchant · sold-by ·        │
│  │  /go/{id} ]│ │          │ │           │  disclosure · score ·        │
│  └───────────┘ └───────────┘ └───────────┘  wishlist ♥ (member)         │
├────────────────────────────────────────────────────────────────────────┤
│ NON-ACTIVE RENDERS (States B — same route, no cards/BUY):              │
│  paused → "temporarily unavailable — store owner has paused this       │
│   store" notice (identity intact)                                      │
│  suspended / closed → "This store is no longer available" notice       │
│  pre-activation → not public; anonymous hit → no-store/not-found       │
└────────────────────────────────────────────────────────────────────────┘
```

## Components required
- Product cards (§11.3 card family) → apps/forum/src/components/ui/card.tsx (generic base) — MISSING: dedicated storefront/product card does not exist in the library (contract §6 archetype gap)
- §11.7 bottom-sheet (mobile preview) → apps/forum/src/components/ui/dialog.tsx (nearest library pattern — no dedicated bottom-sheet component exists in the library; report fit)
- Hover preview (desktop) — MISSING: no hover-preview component exists in the library (network-hover-card.tsx exists but is unnamed by the contract; do not assume fit — report)
- §11.1 Button (BUY/CTA) → apps/forum/src/components/ui/button.tsx
- §11.5 Pill/Tag (disclosure, seed-store label) → apps/forum/src/components/ui/badge.tsx
- Disclosure banner (composable — no §11 component) → apps/forum/src/components/ui/banner.tsx (nearest library pattern; contract itself calls it "composable — no §11 component")
- Rocketeer badge (§11.6) → apps/forum/src/components/ui/badge.tsx (no dedicated badge token; contract cites §11.6 for it — report fit)
- §11.9 Skeleton → apps/forum/src/components/ui/skeleton.tsx
- §11.8 Error → apps/forum/src/components/ui/banner.tsx (nearest library pattern; no dedicated error component)

## States required
*(Enum-backed set. GPT's ~55 transient states — each status value, each wishlist sub-step — folded, since `storefronts.status` (8) + `storefrontProducts.status` + `storefrontLinks.validationState` (4) are the authoritative sets.)*

**A. Store class:** user-owned active storefront · **seed/platform-curated (R-COLDSTART — labeled, not user-owned, 10–20 at launch, CAP-269)**.
**B. Store lifecycle (public-facing, `storefronts.status`; non-active renders DEFINED — Group B, 2026-08-25):**
- **active** → public, full render.
- **pre-activation (none/requested/under_review/setup)** → **not public**: route resolves owner-side only; anonymous public hit → no-store/not-found render (same family as dead-link §11.8).
- **paused (owner-initiated, CAP-270 — the E5-confirmed owner-hide path)** → **route stays resolvable; renders a "temporarily unavailable — store owner has paused this store" notice with the store name/identity intact; product cards and BUY links NOT rendered** (owner chose hide-not-delete; the store returns on resume). No affiliate navigation possible.
- **suspended (operator, CAP-264) / closed (operator/circuit-breaker, CAP-264/265)** → **route stays resolvable; renders "This store is no longer available" notice; NO product cards, NO BUY, NO affiliate navigation** — hard storefront removal from public commerce surface, but not a 404 (link decay on the open web is preserved as an explained state, not a mystery). Suspended may carry a reinstatement path (CAP-264 appeal family) — the public render is identical either way; reinstatement is owner-side.
- **Rationale:** an explicit terminal/held-state page beats both 404 (loses the explanatory context, breaks inbound links cryptically) and full-render (would expose commerce surface for a revoked store). Paused (owner intent, reversible) gets softer copy than suspended/closed (operator action, enforcement).
**C. Product card states:** available (BUY → `/go/{storefrontLinkId}`) · **BUY disabled when unavailable** (degrades; historical commercial context preserved — CAP-245 principle) · destination_unavailable.
**D. Card preview (CAP-246):** hover/tap → preview/bottom-sheet with **merchant + sold-by + disclosure + score + wishlist**; **deliberate second tap on mobile; disclosure survives collapse**.
**E. Wishlist (CAP-252):** not-wishlisted ↔ wishlisted (`wishlist.toggle`); **owner-visible = aggregate count only** (stronger-suppressed in analytics); ZERO Signal.
**F. Conflicted-review display (CAP-255 adjacency):** conflicted ratings remain **READABLE + LABELED — "Seller-affiliated — not in Community Score" (label not hideable)**.

## Component library maturity note
- ⚠️ dialog has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ badge has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ banner has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ skeleton has zero production usage — expect possible integration friction, report don't silently patch.
- Production-proven, no warning needed: button, card.
---
