# CONTRACT-6-contribute-FINAL

**Screen:** Contribute / Reference Upload — `/contribute`
**Wave:** 6B (M10 Constellation / Free Resource Store)
**Template archetype:** Upload dropzone — reachable **disabled-render** when `ugc.enabled=false` (Wave 6B E3)
**Primary CAP-IDs:** CAP-202, CAP-203, CAP-227, CAP-228
**Actor:** member
**Register basis:** 559-row register (Wave 6B closeout, through CAP-559). **E1–E8 CLOSED 2026-08-25.** CAP-202⇄203 circular gating remains an Open Question.
**Reconciliation:** Dormancy-is-intentional locked (all three). States: sourceClass/status-enum set adopted (GLM+Opus; GPT's ~70 transient states folded). E3 closed: reachable disabled-render, not 404. See RECONCILIATION-6B §3.

---

## 1. Route & Access
- **Path:** `/contribute`, no params. **Actor:** member only. No anonymous access.
- **DORMANT by design, reachable:** **`constellation.ugc.enabled=false`** (DEC-M10-UGC-PILOT, soft-beta default per CAP-221) — "no user reference intake." Built fully specified, gated off; a capability set behind an operational gate, **not a stub**.
- **Wave 6B E3 — disabled-render (LOCKED):** when `constellation.ugc.enabled=false`, `/contribute` **mounts** (not 404, not unreachable, not a silent redirect-away). The member sees a **disabled contribute surface**: a banner stating UGC intake is off, plus a **disabled dropzone and disabled submit** (controls present, not actionable). This matches Wave 1 legal pages' `unavailable_pending_legal` pattern — the route exists and renders a defined unavailable/disabled state rather than disappearing. HTTP status for the disabled page is unspecified (same residual as Wave 1 legal pages).
- **Submit gate:** CAP-202 Gated-by includes **`constellation.ugc.enabled=true`**. While the flag is false, `reference.submit` **server-rejects**; the route still mounts. CAP-203 `reference.ackContract` is **not offered** in the disabled UI and **server-rejects** if invoked.
- **CAP-202 also requires:** verified member + Constellation terms accepted + rights basis (via CAP-203) when the flag is true.
- Original user-uploaded bytes are quarantined/private, **never served as the downloadable consumer resource**.
- Upload-cap progression is based on clean accepted-reference history, **not Signal**.
- **Backend dependency:** CAP-204 `intake.scan` (System, NO UI) — quarantined → scanning → rejected/accepted_for_forge; renders here only as upload-status feedback (when UGC is on).

## 2. Entities

| Entity | Direction | Detail |
|---|---|---|
| `resourceReferences` | write (CAP-202) + read (CAP-228) | uploaderUserId?, **sourceClass {user_ugc·in_house·operator·rights_verified}**, originalFileHash, storageKeyQuarantine, mimeClaimed, magicBytesOk, sizeBytes, **rightsBasis? {own·authorized·compatible_licence·public_domain}**, **status {uploading·quarantined·scanning·rights_review·content_review·accepted_for_forge·rejected·forge_consumed·legal_hold·deleted}**, rejectionReason?, parseJobId? — **private intake, never public CDN** |
| `resourceReferenceGrants` | write (CAP-202/203) | grantVersion, termsHash, rightsBasis, licenceTextVersion, contributorUserId, attestedAt, ipHash?, userAgentHash? — **append-only licence evidence** |
| `resourceContributions` | write (CAP-227) | contributorUserId → null (erasure detach); weight retained |
| `users` · `systemConfig` · `auditLog` | read/write per rows | cap tier (CAP-228), non-value-bearing erasure records (CAP-227); `constellation.ugc.enabled` read for render + submit gate |
| `rawEvents` | write (CAP-202 only) | submit event (does not fire while submit is rejected) |

## 3. States
*(sourceClass + status-enum set below. GPT's ~70 transient states — each dormancy sub-branch, each rights-basis value, each cap-milestone step — folded, since `resourceReferences.status` (10) + `sourceClass` (4) + `rightsBasis` (4) are the authoritative sets.)*

**A. Disabled-render (current, E3):** UGC off — route reachable; banner + disabled dropzone/submit; mutations 202/203 server-reject. UGC states below are forward-compatible until reactivation.
**B. Contract-acceptance branches (CAP-203, "state-aware copy," verbatim — only when UGC on):** (1) **UGC = 0/1 or combined**; (2) **operator/in-house/rights_verified = 0/1/many** — licence-grant semantics differ by sourceClass; the contract copy reflects which.
**C. Upload-submission states (CAP-202, UGC on):** submitting (uploading) → **quarantined if rights OK** · **rejected if no rightsBasis** (required before forge; none → reject). Then System-side: scanning (CAP-204) — this screen shows status feedback.
**D. Rights-basis selection:** `rightsBasis ∈ {own · authorized · compatible_licence · public_domain}` (+ compatibleLicenceKind? when licence-based).
**E. Erasure state (CAP-227):** attribution erasure → `resourceContributions.contributorUserId` nulled + **non-value-bearing auditLog record**; public handle detached; **weight retained for historical settlement**; future Signal respects erasure basis (M7 erasure principle — never retain erased values in `auditLog.prev`).
**F. Upload-cap tiers (CAP-228, System):** **2/5 (day/week) → 5/15 after 5 accepted refs + zero rights/safety violations**; never Signal-scaled; temporary ops throttle via systemConfig.
**G. One→many forge invariant (INV-4):** user_ugc references are one→many **blocked** (intake-context; the unlock — CAP-226 rights_verified — is an `/admin/resources` action).

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| Accept state-aware contract + checkbox | member | CAP-203 `reference.ackContract` (R-CONTRACT B1) | resourceReferenceGrants (attestedAt, ipHash, userAgentHash) | CAP-202; constellation.ugc.enabled=true; ⚠️ circular with 202's own gate → Open Question E-contribute-2 |
| Submit reference file | member | CAP-202 `reference.submit` (R-RIGHTS; R-CONTRACT B1) | resourceReferences (uploading→quarantined if rights OK), resourceReferenceGrants, rawEvents | M7 verified + Constellation terms accepted; CAP-203 (rights basis); **constellation.ugc.enabled=true** (server-reject if false) |
| Request attribution erasure | member | CAP-227 (R-WEIGHT erasure; INV-8; no mutation name) | resourceContributions (contributorUserId null), auditLog (non-value-bearing) | M7 erasure flow (CAP-151 pattern) |
| Upload-cap recompute | System | CAP-228 (R-CAPS upload; INV-10; no mutation name) | systemConfig (per-user cap tier) | 5 accepted refs + zero violations |

- **Withdraw an unprocessed reference before forge** — **no member-owned API defined** (create/teardown asymmetry — Open Question).

## 5. Analytics Events
CAP-202 writes rawEvents (submit), same-mutation capture (CAP-436). CAP-203/227/228 write grants/contributions/config + audit, not rawEvents. Contract acceptance is an authoritative legal record in `resourceReferenceGrants`, not merely analytics. Erasure path must never leak erased values into `auditLog.prev`. No eventType literals named — catalog-owned. Disabled-render views do not invent a catalog event.

## 6. Components Used
- **A4 file upload/dropzone — archetype gap** (inventory §3: no upload/drop pattern; scanning/quarantine/reject states undefined in §11 — do not invent) · **§11.7 Modal** (state-aware contract + checkbox; deliberate confirm — only when UGC on) · **§11.2 Inputs** (Checkbox/Radio attestations; Select for compatible_licence kind) · **§11.1 Button** (+ **Disabled-state banner** for `ugc.enabled=false`, matching Wave 1 `unavailable_pending_legal` placeholder discipline) · **§11.5 Pill/Tag** (status chips: quarantined/scanning/…) · **§11.9 Skeleton** · Toast §11.7 (available-not-prescribed) · §11.8 Error (rights-reason rejects; submit rejected while dormant) · Destructive control (attribution erasure).

## 7. Open Questions
*(Escalated items E1–E8 closed in RECONCILIATION-6B. These remain unspecified detail.)*
1. **CAP-228 per-user cap tier stored in `systemConfig`** — a global KV table holding per-user state; register shorthand vs real design (a per-user column/table is the normal home). Precision flag. (GLM.)
2. **CAP-227 and CAP-228 name no mutations.** (All three.)
3. **CAP-227 host surface** — Notes say "profile / contribution UI"; whether erasure lives here (dormant) vs `/u/[handle]`/settings is unclear, especially while `/contribute` upload is off. (GLM + Opus.)
4. **Erasure availability while dormant** — no user_ugc contributions exist, so the path is vacuously dormant; confirm no in_house attribution-erasure case is intended. (GLM.)
5. **Accepted file types / max size / client validations / duplicate-file handling** — unspecified in these capabilities. (GPT.)
6. **Partial-upload cleanup + abandoned-quarantine retention** — unspecified. (GPT.)
7. **Contract version retrieval + reacceptance behavior** — unspecified. (GPT.)
8. **Gate-changes-mid-upload** — behavior if `ugc.enabled` flips during an active upload. (GPT.)
9. **CAP-202⇄203 circular gating (E-contribute-2)** — CAP-202 gated by CAP-203 (rights basis) while CAP-203 gated by CAP-202 (submit). Sequence needs a ruling. Not closed this round.
