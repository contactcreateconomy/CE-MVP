# CONTRACT-6-admin-store-FINAL

**Screen:** Store Validation Queue — `/admin/store`
**Wave:** 6C (M11 Affiliate Storefront)
**Template archetype:** Operator validation queue + enforcement
**Primary CAP-IDs:** CAP-232, CAP-237, CAP-238, CAP-263, CAP-264, CAP-265, CAP-266, CAP-267, CAP-268
**Actors:** store_operator (per-CAP: + System CAP-265, + merchant CAP-268)
**Register basis:** 559-row register; in-scope rows verified from source. **E3 CLOSED 2026-08-25 (FUTURE-M11-01); E1 propagation noted.**
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. States: enum-backed pipeline adopted (GLM+Opus; GPT's ~150 folded). See RECONCILIATION-6C §6.

---

## 1. Route & Access
- **Path:** `/admin/store`, no params. **Auth:** minimal basic role-check gate now; full M15 `/admin` shell (CAP-390/392) at Wave 7 (known Wave-3 E5 pattern). CAP-019 applies.
- **Per-row actors (verbatim, they differ — inventory row = broadest human access):** CAP-232/237/238/263/264/266/267 = store_operator · **CAP-265 = System** (circuit breaker) · **CAP-268 = merchant** (external intake). E-E-class footnote: column = broadest human screen access; per-action authority is register-backed per-CAP.
- **Distinct from `/admin/affiliate-inventory` (Wave 4B):** that console manages the **operator/editorial** affiliate system (`affiliateLinks`/`banners`/`postAffiliateLinks`); this queue governs the **seller-owned storefront** subsystem.

## 2. Entities

| Entity | Direction | Detail |
|---|---|---|
| `storeRequests` · `users` | read + write | request decisions (CAP-232) |
| `storefronts` | write | setup on approval; pause/suspend/close (CAP-264/265) |
| `storefrontProducts` | read + write | full status enum incl. rejection reasons |
| `storefrontProductVersions` | write (CAP-237) | **locks the immutable package** (write-to-locked THROWS) |
| `storefrontLinks` · `linkValidations` | read + write | validation evidence: fingerprint {finalHost, redirectHash, titleHash, contentHash, product, category, safety, scanRegion, deviceProfile, ts}; disposition {pass·needs_human·fail·drift_detected}; runType {initial·rescan}; **multi-region/device for high-risk**; validationState is the BUY gate (E1) |
| `storeStrikes` · `merchantComplaints` | read + write | strike ledger; complaint intake |
| `badges` | write (CAP-267) | rocketeer revocation |
| `moderationCases` | read (CAP-263) · write (CAP-268) | applicant panel; complaint routing |
| `auditLog` | write | every operator action |

## 3. States
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

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| View validation queue | store_operator | CAP-263 `operator.queue` (R-OPERATOR) | none | CAP-236 |
| Decide store request | store_operator | CAP-232 (none named) | storeRequests, storefronts, auditLog | CAP-231 |
| Approve product (lock package) | store_operator | CAP-237 `product.approve` (R-VALIDATE; INV-2) | storefrontProductVersions, storefrontLinks, storefrontProducts, auditLog | CAP-236 |
| Reject product | store_operator | CAP-238 `product.reject` | storefrontProducts, auditLog | CAP-236 |
| Operator action (block/pause/strike/escalate) | store_operator | CAP-264 (R-OPERATOR; none named) | storeStrikes, storefronts, auditLog | CAP-263 |
| Auto-suspend (circuit breaker) | System | CAP-265 (none named) | storefronts, auditLog | N complaints / M hours |
| Emergency product pull | store_operator | CAP-266 (none named) | storefrontProducts, auditLog | CAP-263; instant |
| Revoke Rocketeer badge | store_operator | CAP-267 (none named) | badges, storefronts, auditLog | CAP-265 |
| Merchant complaint intake | merchant | CAP-268 (none named) | merchantComplaints, moderationCases, auditLog | none |

## 5. Analytics Events
No rawEvents on any row; accountability = **`auditLog`** on 9 of 9 operator-facing mutations (CAP-265 System also auditLogs). Queue reads `linkValidations` evidence directly. Revoke notification (CAP-271) is a cron consequence, not an analytics event. Amazon self-report evidence must remain distinguished from network reports in admin projections.

## 6. Components Used
- **A1 data table — archetype gap (highest-priority)** · **A12 queue/case board — soft gap** · §11.3 card family (applicant panel, widget cards) · §11.2 Inputs (reason dropdowns incl. 8-value rejection enum) · §11.7 Modal + Toast (confirm-gated: revoke, pull, lock) · §11.5 Pill (dispositions, statuses, strike count) · §11.9 Skeleton · §11.8 Error · A10-adjacent fingerprint/evidence panel (linkValidations).

## 7. Open Questions
1. ~~CAP-267/271 "followers/watchers/safety-opt-ins" notification audience has no backing entity or creating CAP~~ **→ CLOSED (E3): follower/watcher fan-out deferred as FUTURE-M11-01; public notice + consented-buyer branches are MVP-1 behavior.**
2. **CAP-265 (System) / CAP-268 (merchant) outside inventory Actor column** — E-E footnote; per-action RBAC is register-backed. (GLM + Opus.)
3. **CAP-232/264/265/266/267/268 name no mutations** (237/238/263 do). (All three.)
4. **Circuit-breaker N/M values unspecified** — and no Admin-Config flag on CAP-265 (unlike CAP-524/525's toggles). (GLM + Opus.)
5. **Merchant portal surface** (Actor=merchant; intake route unowned) + relationship to M13 `legalIntake type=merchant_ip` — two complaint paths named. (GLM.)
6. **`withdrawn` product state** — who withdraws (seller? operator?) unowned; **`expired` re-validation trigger** unowned. (GLM.)
7. **Restore/reapprove after emergency pull** — no exact operation defined. (GPT.)
8. **Domain-block scope** — single link / merchant domain / network / all stores — unspecified. (GPT.)
9. ~~CAP-247's `status=active` drift propagates here~~ **→ CLOSED (E1): the lock this queue writes is `validationState=approved_locked`; register corrected.**
