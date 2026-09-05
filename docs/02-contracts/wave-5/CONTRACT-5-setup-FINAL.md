# CONTRACT-5-setup-FINAL

**Screen:** Profile Setup / Basic Profile (posting gate) — `/setup`
**Wave:** 5B (M7 Posting Eligibility & Profile)
**Template archetype:** Onboarding form
**Primary CAP-IDs:** CAP-142, CAP-144, CAP-148 (gates the CAP-140 post path); CAP-551 (mobile OTP verify — data-model half; OTP provider OPEN)
**Actor:** member (verified)
**Reconciliation:** Gate logic locked (all three independently confirmed /setup gates posting only). States: GPT's ~50 sub-states folded. **E-setup-2 CLOSED 2026-08-25.** E-mobile data-model half closed (CAP-551); OTP provider remains **FOUNDER-DECISION-M7-01**. See RECONCILIATION-5B §2.

---

## 1. Route & Access
- **Path:** `/setup`. **Dynamic params:** none. **Actor:** member (verified). No anonymous access.
- **Gate logic — confirmed from the rows, not assumed (all three agree, verified):** **CAP-140 (post path)** requires "M1 verified+active; not-restricted" **and** a completed basic profile — on incomplete, it preserves the draft and returns the missing basic decisions (`postingEligibilityState=basic_incomplete`). **CAP-141 (comment path)** requires only "M1 email+mobile verified + active + not-restricted" and states verbatim **"no profile gate."** Therefore **`/setup` gates the post path (CAP-140) only; commenting is unlocked by M1 verification, not by `/setup`.** Consistent with M7's model: browse anonymous / comment=verified / post=verified+basic-profile; **NO points-gate.**
- **E-mobile CLOSED (data-model half):** CAP-551 (`mobile.verify`) writes `users.mobileVerified=true` (public flag the comment gate reads) and `privateUserData.mobileNumber` (number never on the public/root profile; CAP-002 split). OTP delivery (SMS provider) is **not** specified — **FOUNDER-DECISION-M7-01** must lock before CAP-551 is buildable.
- CAP-142 is itself **Gated by CAP-140** (verified member) **+ CAP-148** (consent recorded) — consent capture is inside the flow. Completion is fast by design (~<10s, CAP-142 note).
- **Already-complete member** redirect/landing behavior — not specified (Open Question). *Note (2026-08-26): the Platform-Wide Routing Convention (CONTRACT-1-app-shell §1) covers only auth/bootstrap state — rule 1 sends unauthenticated visitors to `/signin`; the M7 basic-profile-complete question here is explicitly outside its scope and stays open.*

## 2. Entities

| Entity | Direction | Detail |
|---|---|---|
| `users` | read + write | CAP-142 writes `rulesAcceptedVersion`, `legalAgeAssertedVersion` (E-setup-2 closed). CAP-551 writes `mobileVerified=true` on `users`. Also read: `basicProfileComplete, postingEligibilityState, rulesAcceptedAt, legalAgeAssertedAt, profileVersion, completionBadges[]`. |
| `privateUserData` | write (CAP-551) | verified `mobileNumber` — never on the public/root profile (CAP-002 public/private split). |
| `profiles` | write | consentFlags, completionVersion, firstTapOrder (tap salience, cannot be backfilled), profileVersion |
| `interestTaxonomy` | read | versioned tiles (tagId, label, iconAssetId?, category, taxonomyVersion, isActive); derived from post-type/M5 registry |
| `userInterests` | write | tagId, `source {direct|inferred|both}` — direct stored separately from inferred; affinityScore, status |
| `userConsentRecords` | write (append-only) | purpose, policyVersion, status, collectionSurface, occurredAt, withdrawnAt? |
| `profileCompletionEvents` | write (append-only) | userId, completionVersion, badgeField, awarded, occurredAt |
| `postingEligibilityEvents` | write (append-only) | previousState, nextState, reasonCode, triggerType, actorUserId?, occurredAt — state machine (CAP-140) |
| `systemConfig` | read | per CAP-142/144/148 read sets |

- **CAP-142 Writes:** `profiles, userInterests, userConsentRecords, profileCompletionEvents, postingEligibilityEvents, users (rulesAcceptedVersion, legalAgeAssertedVersion)`. **CAP-144 Writes:** `userInterests, profileCompletionEvents`. **CAP-148 Writes:** `userConsentRecords (append-only)`. **CAP-551 Writes:** `users (mobileVerified=true), privateUserData (mobileNumber)`.

## 3. States
*(Enum + required-set below. GPT's ~50 sub-states — each field present/absent, each verification failure — folded, since `postingEligibilityState` enum + CAP-142's six-item required set are authoritative.)*

**A. `postingEligibilityState` machine (enum):** `not_verified` → `basic_incomplete` → `eligible`; plus `rate_limited` · `temporarily_restricted` · `suspended` · `deleted` (later states owned by CAP-140/152/154, surfaced here only as blocking).
**B. Basic-profile completion (CAP-142's required set, six):** verified member (precondition) · display name (**auto-filled**, editable) · avatar (**default** provided) · **≥1 interest tap** (minimum) · accept rules (rulesAcceptedVersion) · age/COPPA confirm (legalAgeAssertedVersion). All six → `basicProfileComplete`, posting unlocked.
**C. Interest tile states (CAP-144):** unselected → selected (direct source) → removed (re-selectable); tiles from `interestTaxonomy` (isActive only); tap order recorded (firstTapOrder).
**D. Consent flag defaults (CAP-148, per register note):** interestsPersonalization **ON** · demographicsPersonalization **OFF** · behavioralInference **ON** · publicProfileVisibility **ON** — each grant appends `userConsentRecords`.
**E. Skip/abandon:** partial completion persists; posting stays `basic_incomplete` (draft-preserve owned by CAP-140 at composer, not here).
**F. Comment path unaffected (CAP-141):** member can already comment with verification only; `/setup` not required for commenting. Mobile verification itself is CAP-551 (OTP provider OPEN).

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| Complete basic profile | member | CAP-142 `profile.upsertBasic` (R-BASIC) | profiles, userInterests, userConsentRecords, profileCompletionEvents, postingEligibilityEvents, users (rulesAcceptedVersion, legalAgeAssertedVersion) | CAP-140 (verified member); CAP-148 (consent recorded) |
| Select / remove interest tile | member | CAP-144 `interests.select` / `interests.remove` (R-PROFILE-ASK) | userInterests, profileCompletionEvents | CAP-142 |
| Grant consent (per-field) | member | CAP-148 `profile.consentRecord` (R-CONSENT; renamed Wave 7A E2 from `consent.record` — M7 profile consent, distinct from M18 CMP names) | userConsentRecords (append-only) | none |
| Verify mobile via OTP | member | CAP-551 `mobile.verify` | users (mobileVerified=true), privateUserData (mobileNumber) | none — OTP provider **FOUNDER-DECISION-M7-01** (not buildable until locked) |

- **Re-evaluate post submission** — CAP-140 gate behavior; no separate `/setup` API named.
- **Comment** — NOT owned by `/setup`; CAP-141 applies directly to comment creation.

## 5. Analytics Events
**None named.** CAP-142/144/148/551 list no `rawEvents` writes. `profileCompletionEvents` + `postingEligibilityEvents` + `userConsentRecords` are the append-only trails. The M14 handoff (CAP-362) *reads* this completion (`onboardingState=basic_profile_complete`) — a cross-wave read dependency, not an event, and not in this batch. Any future funnel event requires an `eventCatalog` entry first (CAP-437).

## 6. Components Used
- Onboarding-form archetype (§12) · **§11.2** Text Input (display name) · interest tile grid (composable from §11.5 pills; **no dedicated tile-picker component** — minor archetype gap) · **Checkbox/Toggle** (rules/age accept; consent flags) · **§11.1 Button** · **§11.6 Avatar** (default) · **§11.9 Skeleton** · Toast §11.7 / inline Error §11.8 (available-not-prescribed, Wave-1 precedent).
- **Archetype gaps:** no controlled-interest tile selector, versioned-rules acceptance component, posting-gate recovery form, or OTP-entry component in §11.

## 7. Open Questions
*(Escalated items in RECONCILIATION-5B. These are unspecified detail.)*
1. **Display-name auto-fill source** — "auto-filled" (CAP-142) from what (email local-part? token claim?) is unspecified. (GLM.)
2. **Initial `postingEligibilityState` writer** — who writes `not_verified`/`basic_incomplete` first (CAP-002 bootstrap vs first eligibility.check) is not pinned. (GLM.)
3. **Rules content surface** — `rulesAcceptedVersion` is accepted here; where the versioned rules copy lives is register-silent. (GLM + GPT.)
4. **`interestTaxonomy` seed dependency** — CAP-142/144 read it to render tiles, but **no CAP seeds it** (CAP-022 is categories/config only; CAP-534 exposes the *tag* taxonomy for post tags; CAP-389 lets admin *disable* tiles). The tile picker has no confirmed data source at first launch — analogous to the CAP-536 rulebook-seed pattern. (GLM + Opus.) → surfaced.
5. **Already-complete-member redirect** — unspecified. (GPT.)
6. **Max interest selection count + empty-taxonomy behavior** — unspecified. (GPT.)
7. **Whether removing the last direct interest re-locks posting** — recomputation behavior unstated. (GPT.)
8. **OTP delivery provider** — CAP-551 names no SMS vendor. **FOUNDER-DECISION-M7-01.** Do not invent.

---

## ADDENDUM 2026-09-04 — DECISIONS-LOCKED #1 (OTP resolved)

CAP-551 wires to **Twilio Verify** (send/verify/expiry/retry handled by Twilio's
API — no custom OTP logic; no provider abstraction to build). `mobileVerified` /
`mobileVerifiedAt` write on Twilio confirmation; CAP-141 comment eligibility is
fully unblocked. The `FOUNDER-DECISION-M7-01` ledger row is closed.
