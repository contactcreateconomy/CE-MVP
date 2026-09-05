# CONTRACT-6-sell-FINAL

**Screen:** Rocketeer Dashboard — `/sell`
**Wave:** 6C (M11 Affiliate Storefront) — **money path**
**Template archetype:** Seller dashboard (manage + analytics + evidence)
**Primary CAP-IDs:** CAP-233, CAP-234, CAP-239, CAP-243, CAP-270, CAP-257, CAP-258, CAP-259, CAP-260, CAP-525
**Actor:** member (activated Rocketeer)
**Register basis:** 559-row register; in-scope rows verified from source. **E2, E4, E7 CLOSED 2026-08-25.**
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. States: enum-backed set adopted (GLM+Opus; GPT's ~120 folded). See RECONCILIATION-6C §4.

---

## 1. Route & Access
- **Path:** `/sell`, no params. **Actor:** member (seller = Rocketeer; owns the store/request/product records). Preconditions: approved store (setup) → **activation at ≥1 approved product** (CAP-233, gated by **CAP-237** product approval — E4 CLOSED 2026-08-25: stale CAP-248 cross-ref corrected in register).
- **Money-path invariant:** platform never processes merchant→seller commission; **conversion notifications only, no payments; 100% to creator, 0% platform.**

## 2. Entities

| Entity | Direction | Detail |
|---|---|---|
| `storefronts` | read + write | configure (CAP-243), pause (CAP-270), activation (CAP-233) |
| `storefrontProducts` | read + write | submit (CAP-234), edit-request (CAP-239), pause (CAP-270); status enum draft→auto_screened→under_review→approved / rejected / paused / withdrawn / expired / destination_unavailable |
| `storefrontProductVersions` | write | immutable reviewed packages; edit = new version → re-validate; **current stays live** |
| `storefrontLinks` | write (CAP-234) | submitted with product; **validationState** pending → approved_locked |
| `badges` | write (CAP-233) | type `rocketeer`; provisional → active at activation → revocable (CAP-267) |
| `storefrontAnalytics` | read (CAP-257) | **aggregate-only; privacy-query contract on read path; no named individuals** |
| `subIdRegistry` | read (CAP-258) | per-network SubID rules — **never append unknown params** |
| `salesEvidence` | read + write | **type {subid·coupon·self_report·postback}; status {unverified·network_verified·refunded}** (data-model line 225/427) |
| `signalLedger` | write (CAP-525 only) | interim self-report tier |
| `storefrontClicks` | read (CAP-258/525) | clickId linkage |
| `tools` · `toolRatings` | read (CAP-243) | card score |
| `auditLog` | write | on 234/258/259/260/270 |

## 3. States
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

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| Activate storefront (≥1 approved product) | member | CAP-233 (no mutation named) | storefronts, badges | **CAP-237** (E4 CLOSED — product approval produces the ≥1-approved precondition; CAP-248 was a stale cross-ref) |
| Submit product | member | CAP-234 `product.submit` (R-VALIDATE) | storefrontProducts, storefrontProductVersions, storefrontLinks, auditLog | CAP-233 |
| Request product edit | member | CAP-239 `product.editRequest` (R-PACKAGE) | storefrontProductVersions, storefrontProducts | CAP-233 |
| Configure storefront | member | CAP-243 (R-STOREFRONT; none named) | storefronts | CAP-233 |
| Pause store/product/tag | member | CAP-270 `store.pause` (R-STOREFRONT) | storefronts, storefrontProducts, auditLog | CAP-233; immediate |
| Query analytics | member | CAP-257 `store.analytics` (R-ANALYTICS) | storefrontAnalytics (read-path contract) | CAP-256 (rollup ran) |
| Submit SubID evidence | member | CAP-258 `sales.submitEvidence` (R-SALES) | salesEvidence, auditLog | CAP-247 |
| Submit coupon evidence | member | CAP-259 (R-SALES; none named) | salesEvidence, auditLog | none |
| Self-report sale | member | CAP-260 (R-SALES; none named) | salesEvidence, auditLog | none |
| Self-report Amazon sale (interim Signal) | member (seller) | CAP-525 (no mutation named) | signalLedger (interim weight, flagged unverified), salesEvidence (**`type=self_report` + `status=unverified` — E2 CLOSED**) | CAP-524, CAP-258 |

## 5. Analytics Events
`auditLog` on evidence/product writes; analytics reads are the k≥5 projection (CAP-450). No rawEvents literals named. **Admin-config note (settled architecture):** interim weight default range 12–18 (founder sets exact) + toggle to disable self-report entirely on abuse — lives on `/admin/config` → Store panel, **not this screen**. Network-verified conversions and Amazon interim self-reports must use distinct evidence types + eligibility; refunds/reversals preserve linkage.

## 6. Components Used
- Dashboard cards + **§11.3 Stats Card** (Traffic/Intent/Confirmed) · **A1 data table — archetype gap** (product list/statuses) · multi-part form (product submit; locked-package summary) · §11.7 Modal (edit request, pause confirm) · **§11.5 Pill — visibly-distinct evidence-tier labels** (interim/unverified vs network-verified — must never be visually conflatable; **no distinct verified-vs-unverified badge token exists in §11 → flagged in inventory §3, not designed here**) · §11.9 Skeleton · §11.8 Error.

## 7. Open Questions
1. ~~CAP-233 gated-by CAP-248~~ **→ CLOSED (E4): CAP-237, register corrected.**
2. ~~CAP-525 `status=self-reported-unverified` vs bible enum~~ **→ CLOSED (E2): persist `type=self_report` + `status=unverified`.**
3. ~~CAP-258/259 Actor=System sans intentional-split annotation~~ **→ CLOSED (E7): actors corrected to member.**
4. **Verified-vs-unverified badge gap** — flagged in inventory §3 (see Components); component not designed this wave.
5. **Product image upload path (`imageAssetId`)** — CAP-012 reuse for sellers unstated. (GLM.)
6. **Owner-facing resume after CAP-270 pause** — no explicit resume capability. (GPT.)
7. **Analytics export action unnamed** despite bible "exports obey the same." (GLM.)
8. **`expectedProductCount`** advisory vs validated — unspecified. (GLM.)
9. **No member-side withdraw/delete of a pending product** before operator action (create-without-member-teardown, money path). (Opus.)
10. **M12 ladder-detail surfacing of interim tier** = W7 dependency (noted, not blocked). (GLM.)
