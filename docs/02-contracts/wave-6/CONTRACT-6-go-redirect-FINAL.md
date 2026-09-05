# CONTRACT-6-go-redirect-FINAL

**Screen:** BUY Interstitial / Redirect — `/go/[linkId]`
**Wave:** 6C (M11 Affiliate Storefront) — **money path**
**Template archetype:** Context-aware full-page interstitial / redirect (A6)
**Primary CAP-IDs:** CAP-247, CAP-248, CAP-249
**Actors:** member, anonymous
**Register basis:** 559-row register; in-scope rows verified from source. **E1 CLOSED 2026-08-25.**
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. States: enum-backed set adopted (GLM+Opus; GPT's ~90 folded). See RECONCILIATION-6C §5.

---

## 1. Route & Access
- **Path:** `/go/[linkId]`, dynamic `[linkId]` (internal id only — **never a raw affiliate URL**). **Actors:** member, anonymous (CAP-247 Actor=member; CAP-248/249 System — grouped actor drift; `storefrontClicks.actorUserId?` nullable + `anonymousSessionId` = anonymous designed-for).
- **Context-aware (M11-CONFIRMED F3):** **auto-redirect ONLY in-app [valid session/Referer]; off-platform → interstitial with NO auto-redirect** (anti trusted-link-shortener/phishing hijack).
- **BUY live-gate (E1 CLOSED 2026-08-25):** the entry check is **`storefrontLinks.validationState=approved_locked`** — the ONLY BUY-passing value. `storefrontLinks` has **no `status` field** (data-model line 219/422: `validationState {pending·approved_locked·under_review·rejected}`); the prior register Note's "`storefrontLinks.status=active`" referenced a nonexistent field and was corrected register-wide (verified: no other occurrence). `under_review`/`rejected`/`pending` all **fail** this gate. **Register↔data-model drift, money path — Standing Rule 2 (PANEL-PROTOCOL.md).**
- **Route-level gate invariant (Wave 6 cleanup Finding 5, 2026-08-25):** BOTH `/go` branches verify `validationState=approved_locked` **server-side at the route itself, independent of whether CAP-247 (BUY-tap entry-verify) fired first**. A directly-hit `/go/[linkId]` — bookmarked, pasted into email/SMS, the exact F3 abuse vector — never triggers CAP-247; the gate must therefore be a property of the route, not conditional on a prior BUY-tap event. CAP-248 (in-app) and CAP-249 (off-platform) each gate themselves. INV-4's "never refetch destination" is destination-fetch-scoped and unaffected: resolve from the locked stored record, re-reading only `validationState`.

## 2. Entities

| Entity | Direction | Detail |
|---|---|---|
| `storefrontLinks` | read | locked destination; finalRegistrableDomain; redirectChainHash; **affiliateAccountRefMasked — affiliate id NEVER exposed**; **validationState (the live-gate — E1)** |
| `subIdRegistry` | read (CAP-248) | paramName/valueFormat/maxLength/returnedInReport/permitted — **never append unknown params; SubID sanitized, never carries buyer PII** |
| `storefrontClicks` | write | storefrontLinkId, storefrontProductId, promoterUserId, sourcePostId?, **sourceSurface {post·storefront}**, clickId, actorUserId?, anonymousSessionId, **qualification {raw·qualified·excluded}**, integrityStatus, occurredAt — append-only BUY log → feeds M12 |
| `rawEvents` | write | all branches |
| `auditLog` | write (CAP-247) | BUY verification |

## 3. States
*(Enum-backed set. GPT's ~90 transient states — each integrity sub-check, each SubID sub-branch — folded, since `validationState` (4), `storefrontClicks.qualification {raw·qualified·excluded}`, and the in-app/off-platform branch split are authoritative.)*

**A. In-app hit (valid session/Referer) — CAP-248:** verify **`validationState=approved_locked`** → **interstitial → append SubID → 302** to locked destination. **Hot path never refetches destination; merchant domain from fingerprint** (INV-4).
**B. Off-platform hit (no internal Referer) — CAP-249:** verify **`validationState=approved_locked`** (route-level, Finding 5 — this branch never had a CAP-247 entry-verify) → **interstitial with NO auto-redirect** — anti trusted-link-shortener/domain-hijack (GLM fatal fix F3, settled). Gate-fail renders the dead-link/unavailable state — **never the locked destination**. **Interstitial content (Group B, 2026-08-25): FLAGGED as founder/legal-owned content — disclosure-copy, merchant-identification wording, and manual-continue affordance are legal-adjacent and NOT invented here (same pattern as Wave 1's legal-pages content flags). Structure is fixed (state B); copy is not.**
**C. Link-not-resolvable states (three DISTINCT cases — Wave 6 cleanup Group B, 2026-08-25):**
1. **Dead-link:** `[linkId]` resolves to **no `storefrontLinks` row at all** — unknown/typo'd/deleted id. Render: dead-link state (§11.8 Error class); no destination anywhere.
2. **Gate-fail:** row found, but **`validationState ≠ approved_locked`** (`pending` / `under_review` / `rejected`) — a real link, failed or lost approval. Render: unavailable notice ("Purchase link temporarily unavailable" copy family, M11 §15); BUY was disabled upstream (product/store render degrade) per AC-2; storefront stays visible.
3. **Redirect proceeds:** row found AND `approved_locked` → branch A or B by context. **These three are distinct states, not variants of one error** — dead-link vs gate-fail have different causes, different renders, and different data writes.
**D. Amazon-destination (CAP-524, settled):** **standard /go flow — identical to all networks; traffic tracked normally.** Divergence is downstream only: no network-verified conversion Signal (CAP-261 excludes); interim tier via CAP-525. **The redirect layer must NOT treat Amazon clicks differently in UI or the click data written** — same `storefrontClicks` row shape; tier separation happens at settlement, never at /go.
**E. Click qualification (written at click, settled by cron off-screen):** raw → qualified/excluded (CAP-250 `click.settle` applies the M12 qualified-CTA gate: eligible human, once/user/target/window, dwell, not self, not datacenter; CTA-to-engagement ceiling; **total credit ≤ the outcome's versioned value; wishlist = ZERO Signal; self/associated excluded**).

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| Tap BUY (entry) | member | CAP-247 `go.redirect` (entry verify; R-BUY) | storefrontClicks, rawEvents, auditLog | CAP-245; **`storefrontLinks.validationState=approved_locked`** (E1 CLOSED — core authorization check; no other value passes) |
| Resolve in-app redirect | System | CAP-248 `go.redirect` (INV-4) | storefrontClicks, rawEvents | CAP-247; valid session/Referer; **`validationState=approved_locked` verified at-route (Finding 5), independent of CAP-247** |
| Render off-platform interstitial | System | CAP-249 `go.redirect` (AC-10) | storefrontClicks, rawEvents | CAP-247; no internal Referer; **`validationState=approved_locked` verified at-route (Finding 5) — this branch never fires CAP-247; gate-fail renders unavailable, never the destination** |

## 5. Analytics Events
storefrontClicks + rawEvents on every branch; auditLog on entry-verify (same-mutation capture, CAP-436). The event must retain branch context (in-app redirect / off-platform interstitial / explicit continuation) + `qualification {raw·qualified·excluded}`. Downstream settlement (CAP-250 provisional weight 10 → CAP-251 conversion 25, network-verified only) is M11/M12 cron, not this screen. **A click must never be emitted as a verified conversion**; Amazon click events stay distinguishable from later CAP-525 self-reported evidence. Destination URLs/affiliate ids must not leak into payloads beyond approved host/fingerprint fields.

## 6. Components Used
- **A6 full-page interstitial — archetype gap** (inventory §3: the context-aware no-auto-redirect disclosure interstitial is a distinct pattern; modal ≠ this) · §11.1 Button (explicit-continue for off-platform) · merchant-domain display (from approved fingerprint) · disclosure block · §11.8 Error (dead link) · Spinner · minimal chrome; **no store chrome on this route.**

## 7. Open Questions
1. ~~CAP-247 `storefrontLinks.status=active` — field does not exist~~ **→ CLOSED (E1): the gate is `validationState=approved_locked`; register corrected + grep-verified 2026-08-25.**
2. **CAP-247 Actor=member vs designed-for anonymous clicks** (nullable actorUserId + anonymousSessionId). (GLM.)
3. **Interstitial copy + manual-continue presence** — **FLAGGED as founder/legal-owned (Group B, 2026-08-25):** disclosure-copy, merchant-identification wording, and continue-affordance are legal-adjacent content — NOT invented here (same pattern as Wave 1's legal-pages content flags; see States B note). Structure fixed; copy pending founder/legal. (All three.)
4. ~~Dead/nonexistent-link `/go` render — 404 vs interstitial-with-disabled-CTA~~ **→ DEFINED (Group B, 2026-08-25): three distinct states — dead-link (no row) / gate-fail (row, not `approved_locked`) / redirect-proceeds — see States C. Render specifics (exact copy/status code) remain FE; the state taxonomy is canonical.**
5. **CAP-242 (redirect-chain change → under_review) vs CAP-248 hot-path no-refetch + CAP-247 gate timing** — a link mid-`under_review` FAILS the `approved_locked` gate (E1 makes this explicit); the exact re-check timing between drift-write and gate-read is not. *(Partially narrowed by Finding 5: the gate now re-reads `validationState` server-side at every `/go` hit, so staleness is bounded by one request — the residual is the intra-request TOCTOU window only.)* (Opus.)
6. **In-app interstitial dwell requirements** (M12 CTA qualification needs dwell; timing unspecified). (GLM.)
7. **Logging-failure behavior before a 302** — unspecified. (GPT.)
8. **Redirect-loop protection + max continuation lifetime** — unspecified. (GPT.)
