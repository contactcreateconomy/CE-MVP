# CONTRACT-6-storefront-FINAL

**Screen:** Storefront (public) — `/s/[handle]`
**Wave:** 6C (M11 Affiliate Storefront)
**Template archetype:** Store page + product cards
**Primary CAP-IDs:** CAP-269, CAP-246, CAP-252
**Actors:** anonymous, member
**Register basis:** 559-row register; M11 rows + data-model verified from source. **No 6C escalations open on this screen.**
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. States: enum-backed set adopted (GLM+Opus; GPT's ~55 transient states folded). See RECONCILIATION-6C §1.

---

## 1. Route & Access
- **Path:** `/s/[handle]`, dynamic `[handle]`. **Actors:** anonymous, member → **two explicit branches** (anonymous browse/preview; member adds wishlist). *Grouped actor drift resolved: CAP-246/252/269 carry Actor=member while triggers say "Visitor/visitor"; `storefrontClicks.actorUserId?` is nullable with `anonymousSessionId` — anonymous is designed-for; register actor column is shorthand (RECONCILIATION-6C §0).*
- **Store visibility precondition:** store goes public **only at ACTIVATION = ≥1 approved product** (data-model line 215; CAP-233, gated by CAP-237 per E4). Seed stores: `isPlatformCurated`, **clearly labeled, not user-owned; 10–20 at launch** (CAP-269, R-COLDSTART).
- **Owner-initiated hide (E5 finding, 2026-08-25):** owner pause is **already owned by CAP-270 `store.pause` → `storefronts.status=paused`** — an existing enum value with an existing member-actor capability. **No new enum value, no new CAP** was needed; the investigation confirmed `paused` covers owner-initiated hide-not-delete, distinct from operator `suspended`/`closed` (CAP-264/265). Public render for the non-active states remains an Open Question (#1).
- **SEO:** storefront **product cards default noindex unless substantive** (CAP-487, doorway prevention). Store-page indexability unspecified (Open Question).
- **No raw affiliate URL** exposed anywhere — external navigation only via `/go/[linkId]`.

## 2. Entities

| Entity | Direction | Detail |
|---|---|---|
| `storefronts` | read | ownerUserId (unique), distributionId, **status {none·requested·under_review·setup·active·paused·suspended·closed}**, isPlatformCurated, disclosureVersion, collections[], activatedAt — **`[handle]` = owner's CAP-550 member handle composed via unique ownerUserId (OQ#2 resolved); no handle field on storefronts**
| `storefrontProducts` | read | toolId? (canonical M5 link), name, category (Phase-1 allowlist), useCase, imageAssetId, description, claims, status, currentVersionId |
| `storefrontProductVersions` | read | locked package (link+name+merchant+domain+image+desc+claims+disclosure+CTA+regions+category) — immutable after approval |
| `storefrontLinks` | read | **validationState {pending·approved_locked·under_review·rejected}**; never exposes affiliate id (`affiliateAccountRefMasked`) |
| `tools` · `toolRatings` | read | card "score" (community aggregate; toolless products — Open Question) |
| `wishlists` | write (CAP-246/252) | userId, storefrontProductId — Unique (userId, product); **PRIVATE; owner sees aggregate count only; ZERO Signal; deletable** |
| `storefrontAnalytics` | write (CAP-269) | store-view increment (CAP-256 rollup is cron, off-screen) |

## 3. States
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

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| View seed store | anonymous, member | CAP-269 (R-COLDSTART; no mutation named) | storefrontAnalytics (view increment) | none |
| Open card preview | anonymous, member | CAP-246 (R-CARD; render + wishlist affordance) | wishlists | none |
| Toggle wishlist | member | CAP-252 `wishlist.toggle` (R-CARD) | wishlists | none |
| Pause own store (owner hide — off-screen from public view, lands on `/sell`) | member (owner) | CAP-270 `store.pause` (R-STOREFRONT) | storefronts, storefrontProducts, auditLog | CAP-233; immediate |

## 5. Analytics Events
CAP-269 writes `storefrontAnalytics` (seed-store view); CAP-246/252 name **no rawEvents** — wishlist toggle as an M16 observational client event is unspecified (Open Question). Analytics are **aggregate-only** under the fixed privacy-query contract (≥1d buckets, ≥24h delay, k≥5, parent/child suppression, rounded low counts, **wishlist stronger-suppressed**; three buckets Traffic/Intent/Confirmed). Wishlist is explicitly **ZERO Signal** (CAP-252).

## 6. Components Used
- Store page + product cards (§11.3 card family — **no dedicated storefront/product card** → archetype gap) · **§11.7 bottom-sheet** (mobile preview) · hover preview (desktop) · §11.1 Button (BUY/CTA) · **§11.5 Pill/Tag** (disclosure, seed-store label; Rocketeer badge §11.6) · disclosure banner (composable — no §11 component) · §11.9 Skeleton · §11.8 Error.

## 7. Open Questions
1. ~~**Public render for paused/suspended/closed storefronts**~~ **→ DEFINED (Group B, 2026-08-25): States B — paused = resolvable + "temporarily unavailable" notice, no cards/BUY; suspended/closed = resolvable + "no longer available" notice, no cards/BUY/no affiliate navigation; pre-activation = not public (not-found for anonymous). Exact copy = FE.**
2. ~~**`[handle]` resolution has no governing CAP**~~ **→ RESOLVED-BY-COMPOSITION (Group B, 2026-08-25): `storefronts` carries NO handle field — `/s/[handle]`'s `[handle]` is the OWNER's member handle (CAP-550 reserved/unique at profile creation, immutable at MVP-1 = FUTURE-M7-01) composed with `storefronts.ownerUserId` (unique — one store per member). Resolution = CAP-550's handle → user → their store; not-found/renamed behavior inherits CAP-550's semantics. Mechanism already exists — no new CAP needed. (Opus.)**
3. **Store-page indexability** — CAP-487 covers product cards only. (GLM.)
4. **No rawEvents on browse/wishlist** — M16 catalog ownership unstated. (GLM.)
5. **Preview "score" for products with no `toolId`** — omit vs placeholder unspecified. (GLM.)
6. **Seed-store ownership/handoff/retirement** process — undefined. (GPT.)
7. **Region-detection source + wishlist aggregate suppression threshold** — unspecified on this screen. (GPT.)
