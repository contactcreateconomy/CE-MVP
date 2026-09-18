---
# Store Application

**Status (2026-09-18 screen audit correction):** LIVE. **Fixed (this pass):** re-application after a `rejected` status was blocked entirely (the form never rendered again); now shows a rejection notice and allows re-applying. `categories` and `expectedProductCount` were always sent as `[]` / `1` regardless of user input — wired to real form fields. Added the missing link to `/how-we-use-your-store-data`.


**Route:** `/sell/apply`
**Status:** NOT STARTED
**Route drift:** none
**Contract:** PRD/02-contracts/wave-6/CONTRACT-6-sell-apply-FINAL.md
**Slice(s):** P6-13

## Layout
Derived from contract §6 (Components Used) + inventory Template archetype "Multi-step form + data-honesty page":

```
┌────────────────────────────────────────────────────────────────────────┐
│ STEP 0 — ELIGIBILITY (CAP-230, evaluated on open)                       │
│  profile complete · ≥1 social handle · eligible trust tier · no         │
│  integrity/moderation hold · NOT staff · NOT persona (E6)               │
│  any fail → §11.8 Error with reason (incl. staff/persona ineligibility) │
├────────────────────────────────────────────────────────────────────────┤
│ STEP 1 — APPLICATION FORM (CAP-231, tap-first; §11.2 Inputs, stepped)   │
│  intended categories (Select) · networks (Select:                       │
│  impact·shareasale·awin·cj·amazon·direct·other) ·                      │
│  expectedProductCount (number input) · experienceNote (Textarea) ·      │
│  FOUR required attestations (checkboxes): owns · programPermits ·       │
│  regionEligible · willDisclose                                          │
├────────────────────────────────────────────────────────────────────────┤
│ STEP 2 — DATA HONESTY (CAP-262, before approval)                        │
│  data-honesty content block (Reading column §4.3): aggregate-only      │
│  (Traffic/Intent/Confirmed explained; no buyer identity, no exact      │
│  times, no arbitrary multi-dim filtering)                               │
│  terms + data-use acceptance (§11.7 Modal — versions recorded)          │
├────────────────────────────────────────────────────────────────────────┤
│ OUTCOME — status Pill: submitted → under_review → info_requested /      │
│  approved (→ storefront.status=setup; Rocketeer badge provisional) /    │
│  rejected (reasonCode)                                                  │
└────────────────────────────────────────────────────────────────────────┘
```

## Components required
- Multi-step form (§11.2 Inputs, stepped) → apps/forum/src/components/ui/input.tsx — MISSING: no stepper/multi-step form component exists in the library (contract §6 archetype gap; navigation-progress-bar.tsx exists but is unnamed by the contract — report fit, don't assume)
- Attestation checkboxes → apps/forum/src/components/ui/checkbox.tsx
- Select (categories, networks) → apps/forum/src/components/ui/select.tsx
- Number input (expectedProductCount) → apps/forum/src/components/ui/input.tsx
- Textarea (experienceNote) — MISSING: no dedicated textarea component exists in the library; input.tsx is the nearest §11.2 mapping — report, don't silently patch
- §11.1 Button → apps/forum/src/components/ui/button.tsx
- §11.5 Pill (status) → apps/forum/src/components/ui/badge.tsx
- Data-honesty content block (Reading column §4.3) — no dedicated library component; reading-affordances.tsx exists as a candidate (contract does not name it — verify fit, report)
- §11.7 Modal (terms/data-use acceptance) → apps/forum/src/components/ui/dialog.tsx
- §11.9 Skeleton → apps/forum/src/components/ui/skeleton.tsx
- §11.8 Error (ineligible reasons incl. staff/persona ineligibility — E6) → apps/forum/src/components/ui/banner.tsx (nearest library pattern — no dedicated error component; report fit)
- MISSING (contract §6 archetype gaps, none exist in the library): eligibility checklist · versioned commercial-attestation component · aggregate-data-honesty component

## States required
*(Enum-backed set. GPT's ~55 transient states — each attestation checked/unchecked, each eligibility sub-gate — folded, since `storeRequests.status` (5) + the four required attestations + the eligibility formula are authoritative.)*

**A. Eligibility (CAP-230 — each failed gate):** profile incomplete · no social handle · trust tier ineligible · integrity/moderation hold · **staff/persona exclusion (E6 — ineligible; server-side reject, R-STAFF class)** · **eligible**.
**B. Application form (CAP-231, tap-first):** intended categories · networks (`affiliate.network` enum: impact·shareasale·awin·cj·amazon·direct·other) · expectedProductCount · experienceNote · **attestations required (all four: owns, programPermits, regionEligible, willDisclose)** · terms + data-use acceptance (versions recorded).
**C. Data-honesty acceptance (CAP-262):** before approval; **aggregate-only disclosed** (Traffic/Intent/Confirmed explained; no buyer identity, no exact times, no arbitrary multi-dim filtering).
**D. Outcomes (`storeRequests.status`):** submitted → under_review → **info_requested** / **approved** (→ `storefront.status=setup`; **Rocketeer badge provisional** per CAP-232, on `/admin/store`) / **rejected** (reasonCode).

## Component library maturity note
- ⚠️ input has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ checkbox has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ select has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ badge has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ dialog has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ skeleton has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ banner has zero production usage — expect possible integration friction, report don't silently patch.
- Production-proven, no warning needed: button.
---
