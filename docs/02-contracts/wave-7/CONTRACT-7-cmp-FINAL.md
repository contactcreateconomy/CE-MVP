# CONTRACT-7-cmp-FINAL

**Screen:** Consent Management (CMP) — global overlay (no route)
**Wave:** 7A (M18 Reliability & Platform Ops — the App-Shell CMP slot)
**Template archetype:** Global consent overlay (App-Shell reserved slot)
**Primary CAP-IDs:** CAP-504, CAP-505, CAP-506
**Actors:** member, anonymous
**Reconciliation:** All-agree on the slot build + CAP-025/026/028 order/degrade. ~~One escalation (consentRecords vs userConsentRecords + shared mutation names).~~ **E2 CLOSED 2026-08-25 — M7's mutations renamed `profile.consentRecord`/`profile.consentWithdraw`; M18's `consent.record`/`consent.withdraw` (this contract's CAP-505/506) are the canonical platform-wide CMP names, unchanged.** See RECONCILIATION-7A §7.

---

## 1. Route & Access
- **Not a route** — mounts in the App Shell's reserved slot. **CAP-025 provider order (verified from original Notes):** ConvexAuthNextjsServerProvider → ConvexAuthNextjsProvider → **ErrorBoundary → CMP slot (M18) → BetaBanner → children**; **CAP-026** places ErrorBoundary **ABOVE** the CMP slot (FATAL-M1C-03); **CAP-028** defines the crash-degrade contract. This build resolves Wave-1 OPEN-DECISIONS E2 ("CMP slot interim behavior undefined"). Actors: member, anonymous.
- Legal pages remain accessible without CMP success.

## 2. Entities

| Entity | Direction | Detail |
|---|---|---|
| `consentRecords` | read + write | M18 table — data-model shape is literally "…" (thin placeholder, line 305): **PostHog gated; rawEvents never consent-gated**. Purposes: **strictly_necessary · functional · analytics · marketing** |
| `systemConfig` | read (CAP-504) | gate config |
| `analyticsDeletionRequests` | — (off-screen) | CAP-453/454 vendor-delete machinery — relationship to CAP-506's "vendor delete path" **unspecified** (Open Question) |

- **E2 CLOSED 2026-08-25:** M18 `consentRecords` (4 vendor/analytics purposes, CAP-504/505/506 — THIS contract's table) and M7 `userConsentRecords` (per-field profile/personalization, CAP-148/149/151/157) are distinct tables with **now-distinct mutation names**: M7's were renamed **`profile.consentRecord` / `profile.consentWithdraw`**; M18's **`consent.record` / `consent.withdraw` (CAP-505/506) are canonical platform-wide CMP names — unchanged. CAP-157's `consent.reaccept` is an M7 mutation (profile re-acceptance), no longer name-matched to M18. The CMP overlay surfaces M18 purposes only; M7 profile-consent lives in `/settings/profile`.

## 3. States
*(Enum-backed set. GPT's ~60 transient states — each purpose granted/withdrawn, each vendor-delete sub-step — folded, since the 4 consent purposes + grant/withdraw + crash-degrade are authoritative.)*

**A. Banner (pre-choice):** initial; strictly_necessary always on and **non-negotiable** (FATAL-M18-02 — includes server rawEvents).
**B. Preferences (granular):** four-purpose toggle set (strictly_necessary · functional · analytics · marketing).
**C. Granted (per purpose):** analytics grant is the **PostHog injection precondition** — not injected until grant.
**D. Withdrawn (CAP-506):** **stops future capture**; rawEvents NOT consent-gated (continue); **vendor delete path** initiated.
**E. Crash-degrade (CAP-028 — designed degrade, not bug):** CMP crashes → **app stays up; analytics denied; legal still up**. Client-visible status + recovery/retry mechanism **undefined** (Wave-1 open question, still open).
**F. Consentless analytics state:** strictly-necessary-only operation (PostHog absent; rawEvents server capture unaffected).
**G. Anonymous→member reconciliation:** anonymous consent persistence key + stitch to `users` at signup (CAP-387 anonymousSessionId join) — uncovered (Open Question).

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| (System) Analytics-request gate | System | CAP-504 (R-CONSENT; gate only) | none | strictly_necessary always; grant precondition for PostHog |
| Grant consent (purposes) | member (anonymous branch — Open Question) | CAP-505 `consent.record` | consentRecords | none |
| Withdraw consent | member | CAP-506 `consent.withdraw` | consentRecords | prior grant |

- **Open preferences** — overlay-local, no separate capability name. **Retry after CMP crash** — no API/capability defined. **Delete authoritative rawEvents** — not performed by CAP-506 (rawEvents are strictly-necessary, not consent-gated).

## 5. Analytics Events
**None named** — the consent surface itself writes no rawEvents (consentGate exists as an `eventCatalog` field, not an event). CMP **governs** analytics rather than emitting it: CAP-504 blocks PostHog injection pre-grant; CAP-441/505 interplay controls identify. Whether a consent-change observational event exists is unspecified (Open Question).

## 6. Components Used
- **Banner primitive — ARCHETYPE GAP: §11 has no persistent banner component** (modals/sheets/toast ≠ banner; same gap class as the ungoverned BetaBanner stacked directly above this slot) · §11.7 Modal/Sheet (preferences) · §11.2 Inputs (purpose toggles; required-purpose disabled control for strictly_necessary) · §11.1 Button (save/withdraw) · §11.8 Error (degrade state) · focus-management/keyboard-trap for the preferences dialog.

## 7. Open Questions
1. ~~**`consentRecords` (M18) vs `userConsentRecords` (M7) — two consent tables + shared mutation names.**~~ **→ NAME COLLISION CLOSED (E2, 2026-08-25): M7 renamed `profile.consentRecord`/`profile.consentWithdraw`; M18 names canonical for CMP. Residual sub-questions (functional, not naming): whether analytics-consent withdrawal (CAP-506) interacts with M7 behavioral-consent withdrawal (CAP-149), and whether the CMP surfaces both tables — the CMP surfaces M18 purposes only per the Entities note; the CAP-506↔CAP-149 withdrawal interaction remains genuinely open.**
2. **Anonymous consent persistence key** (anonymousSessionId? device?) + anonymous→member carryover (CAP-387) — uncovered. (GLM + Opus.)
3. **CAP-506 "vendor delete path" vs CAP-453/454 `analyticsDeletionRequests`** — wired or parallel? Unspecified. (GLM.)
4. **CAP-028 crash client-visible status + recovery/retry** — still undefined (Wave-1 carryover). (GLM + GPT.)
5. **Consent-change analytics event** — unspecified. (GLM.)
6. **Functional/marketing vendor bindings** — not enumerated. (GPT.)
7. **Cross-device precedence** for conflicting consent records — unspecified. (GPT.)

---

## ADDENDUM 2026-09-04 — DECISIONS-LOCKED #7 (OQ#3 resolved)

Withdrawal (CAP-506) now WIRES to vendor deletion (CAP-453/454) via the approved
**outbox pattern**: withdrawal writes a durable "deletion requested" record →
background job calls the PostHog deletion API with retry-on-failure → status
(pending/confirmed) visible to admin. The prior "do not call 453/454" fence in
P7T-13/P7O-08 is removed. Privacy Policy copy (versioned-content table) describes
exactly this mechanism.
