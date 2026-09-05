# CONTRACT-6-product-detail-FINAL

**Screen:** Product Detail + Discussion — `/s/[handle]/[product]`
**Wave:** 6C (M11 Affiliate Storefront)
**Template archetype:** Product detail + M6 discussion
**Primary CAP-IDs:** CAP-245, CAP-246, CAP-253, CAP-255, CAP-524
**Actors:** member (anonymous view — see Open Questions)
**Register basis:** 559-row register → **561 rows** (Wave 6 cleanup Group A: CAP-560, CAP-561 added 2026-08-25). **E-prod-1 and E-prod-2 RESOLVED — Wave 6 cleanup Findings 1 & 2 (founder decisions 2026-08-25); no longer Open Questions on this screen.**
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. States: enum-backed set adopted (GLM+Opus; GPT's ~70 folded). See RECONCILIATION-6C §2.

---

## 1. Route & Access
- **Path:** `/s/[handle]/[product]`. **Actor:** member (inventory) — parent storefront is anonymous-accessible; whether anonymous can view product detail (vs only being blocked from discussion) is unstated (Open Question).
- **CAP-245 scope RESOLVED (Finding 2, 2026-08-25):** its `posts` write and CAP-244 gate apply to the **in-post composer-block case only**. The standalone `/s/[handle]/[product]` page's discussion thread host is **CAP-560's shadow post** — created at product approval, hidden from feed/discovery, existing solely as the `comments.postId` anchor. CAP-245 itself was not a bug.
- **No raw affiliate URL** — BUY routes only via `/go/[linkId]`.

## 2. Entities

| Entity | Direction | Detail |
|---|---|---|
| `storefrontProducts` · `storefrontProductVersions` · `storefrontLinks` | read (CAP-245) | live reference; version via currentVersionId; link via `validationState` |
| `posts` | write (CAP-560, System) | **shadow post** — system-generated at product approval (gated by CAP-237), hidden from feed/discovery, sole purpose = comment-thread host for this product. `comments.postId` anchors here. *(Finding 2 — CAP-245's posts write is in-post composer-block only.)* |
| `tools` · `toolRatings` · `reviewConflicts` | read (CAP-246/255) | score; conflicted-review labeling (state {declared·suspected·confirmed·cleared}) |
| `wishlists` | write (CAP-246) | via preview affordance |
| `comments` · `commentScores` | read + write (CAP-253) | M6 comments via product `threadContext` |
| `storefrontClicks` · `rawEvents` | write (BUY → /go, CAP-247) | off-screen on `/go` |

## 3. States
*(Enum-backed set. GPT's ~70 transient states — each BUY-disabled reason, each conflict state, each Amazon sub-state — folded, since `storefrontProducts.status` + `storefrontLinks.validationState` (4) + `reviewConflicts.state` (4) are the authoritative sets.)*

**A. Product availability (CAP-245):** live reference renders · **degrades if product unavailable — BUY disabled** · **historical commercial context preserved** (R-BLOCK).
**B. Destination validity (data-model; E1-consistent):** link **`approved_locked`** (BUY routes) · **drift → `under_review` — BUY disabled, storefront visible**.
**C. Amazon-destination (CAP-524, settled):** renders and routes via the **standard /go flow — same as all networks; clicks/traffic tracked via existing CAP-247–249/256 infra**; UI must communicate **why Amazon links stay in Traffic/interim-tier and never reach full Confirmed status** (network-verified conversion Signal structurally never awarded — CAP-261 excludes Amazon). The redirect layer must NOT treat Amazon clicks differently in UI or click-data.
**D. Card preview + wishlist (CAP-246):** merchant/sold-by/disclosure/score/wishlist; second tap on mobile; disclosure survives collapse.
**E. Conflicted review (CAP-255):** reviewer = seller/co-owner/operator/same-device etc. → **excluded from `tools` aggregate + labeled, readable not hidden; label not hideable; false claims still moderated** (INV-8); label copy: "Seller-affiliated — not in Community Score." (same-device alone ≠ confirmed.)
**F. Product Discussion (CAP-253):** M6 thread via product `threadContext` — hosted on the **CAP-560 shadow post** (Finding 2) · **default-sorted by M6 legitimacy-weighted ranking (anti-brigading)** · **owner can HIDE-for-moderator-review, NEVER delete — CAP-561 (Finding 1): comments.moderationStatus=held-for-review + moderationCases routed to M13 review queue; owner cannot delete; moderator disposition per M13.**

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| Render live product reference | System | CAP-245 (R-BLOCK; no mutation named) | — (render only on this route; posts write is in-post composer-block case, Finding 2) | CAP-244 (post-block-scoped gate) |
| Shadow post created (thread host) | System | **CAP-560 (Finding 2)** | posts (shadow, hidden), storefrontProducts (shadow-post link) | CAP-237 (fires immediately after product approval) |
| Open preview / wishlist | member | CAP-246 (R-CARD; none named) | wishlists | none |
| Participate in Product Discussion | member | CAP-253 (R-DISCUSSION; reuses M6 `comments.create` family) | comments, commentScores | M6/M7 comment eligibility |
| Tap BUY | member | CAP-247 `go.redirect` entry | (on /go) storefrontClicks, rawEvents, auditLog | link **`validationState=approved_locked`** (E1) |
| Owner hide comment (for review) | member (owner) | **CAP-561 (Finding 1) — comments.moderationStatus=held-for-review → M13 queue** | comments (moderationStatus), moderationCases | CAP-560 (thread host exists), CAP-237; ownership of the shadow post's product |
| Conflicted-review exclusion/label | System | CAP-255 (R-FIREWALL; no mutation named) | tools, toolRatings | CAP-254 (conflict detected) |

## 5. Analytics Events
BUY → storefrontClicks + rawEvents (CAP-247, off-screen on /go). Product Discussion reuses M6 capture (CAP-253's Writes name only comments/commentScores — inherits CAP-120's same-mutation rawEvents pattern; inheritance assumed, not restated). CAP-246/255 name no events. CAP-524 tracks storefrontClicks via existing infra. No eventType literals named — catalog-owned.

## 6. Components Used
- Product page layout · card + bottom-sheet preview (§11.3/§11.7) · **M6 thread components** (comment list per M6 contract, legitimacy-weighted sort) · disclosure Pill + **conflicted-review label** (§11.5 — no dedicated component, archetype gap) · BUY Button (§11.1, routes to /go) · §11.9 Skeleton · §11.8 Error.

## 7. Open Questions
1. **Anonymous view access** to product detail (parent store anonymous; inventory says member). (GPT + Opus.)
2. ~~**Owner hide-not-delete routing**~~ **→ RESOLVED (Finding 1, 2026-08-25): CAP-561 — comments.moderationStatus=held-for-review + moderationCases routed to M13 queue; gated by CAP-560 + ownership. See Actions.**
3. ~~**CAP-245 `posts` write target**~~ **→ RESOLVED (Finding 2, 2026-08-25): in-post composer-block case only; standalone page's thread host is CAP-560's shadow post. CAP-245 was not a bug.**
4. **Amazon communication copy** — required by CAP-524's note, no surface/wording owned (dashboard vs product page). (GLM.)
5. **Region eligibility detection + unknown-region behavior** — unspecified. (GPT.)
6. **Historical discussion when product withdrawn/emergency-pulled** — behavior unspecified. (GPT.)
