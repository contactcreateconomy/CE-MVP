# Profile Setup / Basic Profile (posting gate)

**Route:** `/setup`
**Status:** NOT STARTED
**Contract:** PRD/02-contracts/wave-5/CONTRACT-5-setup-FINAL.md
**Slice(s):** P5-05

## Layout

Contract §6 Components Used names only the **"Onboarding-form archetype (§12)"** — a generic §12 citation with no §12.x subsection pinned (STYLE-KIT §12.1–§12.4 are Desktop App / Mobile App / Landing / Admin Console; none is an onboarding form). Inventory Template archetype: "Onboarding form". The form's six required items below come from contract §3 States B. Thin-layout note: beyond "onboarding form", the contract prescribes no single-column/multi-step arrangement — do not invent steps or ordering beyond the six-item set.

```
+----------------------------------------------+
| ONBOARDING FORM (§12, subsection unpinned)   |
|                                              |
| Six-item required set (contract States B):   |
|  1. verified member (precondition, not an    |
|     input)                                   |
|  2. display name — Text Input (AUTO-FILLED,  |
|     editable; source unspecified — OQ1)      |
|  3. avatar — default provided (Avatar)       |
|  4. ≥1 interest tap — tile grid composed     |
|     from pills (interestTaxonomy, isActive   |
|     tiles; unselected → selected → removed,  |
|     re-selectable; firstTapOrder recorded)   |
|  5. accept rules — Checkbox/Toggle           |
|     (rulesAcceptedVersion)                   |
|  6. age/COPPA confirm — Checkbox/Toggle      |
|     (legalAgeAssertedVersion)                |
|                                              |
| Consent flag defaults (CAP-148):             |
|  interestsPersonalization ON ·               |
|  demographicsPersonalization OFF ·           |
|  behavioralInference ON ·                    |
|  publicProfileVisibility ON                  |
|                                              |
| [ Complete basic profile (Button) ]          |
| Mobile OTP verify (CAP-551) — FENCED:        |
|  FOUNDER-DECISION-M7-01 (SMS provider) OPEN; |
|  UI fenced, mutation not buildable until     |
|  locked                                     |
+----------------------------------------------+
```

## Components required

- §11.2 Text Input (display name) → apps/forum/src/components/ui/input.tsx
- Interest tile grid — composable from §11.5 pills → apps/forum/src/components/ui/badge.tsx; MISSING: dedicated tile-picker component (minor archetype gap per contract §6)
- Checkbox/Toggle (rules/age accept; consent flags) → apps/forum/src/components/ui/checkbox.tsx + apps/forum/src/components/ui/toggle-switch.tsx
- §11.1 Button → apps/forum/src/components/ui/button.tsx
- §11.6 Avatar (default) → apps/forum/src/components/ui/avatar.tsx (+ user-avatar.tsx if needed)
- §11.9 Skeleton → apps/forum/src/components/ui/skeleton.tsx
- Toast §11.7 / inline Error §11.8 (available-not-prescribed, Wave-1 precedent) → apps/forum/src/components/ui/toast.tsx (inline Error: input.tsx's error state is the defined surface; no standalone inline-error component exists)
- MISSING: OTP-entry component — contract §6 flags none exists in §11 (and CAP-551 is fenced on FOUNDER-DECISION-M7-01 regardless)
- MISSING: versioned-rules acceptance component, posting-gate recovery form — contract §6 flags none exist in §11

## States required

*(Copied VERBATIM from CONTRACT-5-setup-FINAL §3.)*

*(Enum + required-set below. GPT's ~50 sub-states — each field present/absent, each verification failure — folded, since `postingEligibilityState` enum + CAP-142's six-item required set are authoritative.)*

**A. `postingEligibilityState` machine (enum):** `not_verified` → `basic_incomplete` → `eligible`; plus `rate_limited` · `temporarily_restricted` · `suspended` · `deleted` (later states owned by CAP-140/152/154, surfaced here only as blocking).
**B. Basic-profile completion (CAP-142's required set, six):** verified member (precondition) · display name (**auto-filled**, editable) · avatar (**default** provided) · **≥1 interest tap** (minimum) · accept rules (rulesAcceptedVersion) · age/COPPA confirm (legalAgeAssertedVersion). All six → `basicProfileComplete`, posting unlocked.
**C. Interest tile states (CAP-144):** unselected → selected (direct source) → removed (re-selectable); tiles from `interestTaxonomy` (isActive only); tap order recorded (firstTapOrder).
**D. Consent flag defaults (CAP-148, per register note):** interestsPersonalization **ON** · demographicsPersonalization **OFF** · behavioralInference **ON** · publicProfileVisibility **ON** — each grant appends `userConsentRecords`.
**E. Skip/abandon:** partial completion persists; posting stays `basic_incomplete` (draft-preserve owned by CAP-140 at composer, not here).
**F. Comment path unaffected (CAP-141):** member can already comment with verification only; `/setup` not required for commenting. Mobile verification itself is CAP-551 (OTP provider OPEN).

## Component library maturity note

- ⚠️ input has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ badge has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ checkbox has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ skeleton has zero production usage — expect possible integration friction, report don't silently patch.
- button, avatar, toast are production-proven (no warning).
- toggle-switch.tsx and user-avatar.tsx are on neither the provided zero-production nor production-proven list — maturity unknown, not invented here.
