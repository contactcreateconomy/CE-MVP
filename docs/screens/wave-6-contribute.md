---
# Contribute / Reference Upload

**Route:** `/contribute`
**Status:** NOT STARTED
**Route drift:** none
**Contract:** PRD/02-contracts/wave-6/CONTRACT-6-contribute-FINAL.md
**Slice(s):** P6-09

## Layout
Derived from contract §6 (Components Used) + inventory Template archetype "Upload dropzone — reachable disabled-render when ugc.enabled=false (Wave 6B E3; not 404)". Two renders on one route:

```
DISABLED RENDER (current default — constellation.ugc.enabled=false, E3):
┌────────────────────────────────────────────────────────────────────────┐
│ BANNER: UGC intake is off (disabled-state banner)                      │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │  DROPZONE (A4) — DISABLED (controls present, not actionable)       │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ [ SUBMIT — disabled ]  (route mounts; mutations 202/203 server-reject) │
└────────────────────────────────────────────────────────────────────────┘

ENABLED RENDER (flag=true — forward-compatible, same route):
┌────────────────────────────────────────────────────────────────────────┐
│ ① state-aware contract (§11.7 Modal + checkbox) — copy varies by       │
│    sourceClass licence-grant semantics                                 │
│    rightsBasis selection: own · authorized · compatible_licence ·      │
│    public_domain (+ compatibleLicenceKind? via Select)                 │
│ ② DROPZONE (A4) → submit → upload-status feedback (CAP-204 System      │
│    scan renders here only as status):                                  │
│    status chips (§11.5): quarantined · scanning · rights_review ·      │
│    content_review · accepted_for_forge · rejected · …                  │
│ ③ attribution erasure — destructive control (CAP-227, host surface     │
│    itself an Open Question, OQ3)                                       │
└────────────────────────────────────────────────────────────────────────┘
```

## Components required
- A4 file upload/dropzone → apps/forum/src/components/ui/dropzone.tsx (library component exists; contract flags the §11 archetype as a gap — scanning/quarantine/reject states undefined in §11. P6-09 v1 = disabled-capable file input, not a designed uploader kit)
- §11.7 Modal (state-aware contract + checkbox; deliberate confirm — only when UGC on) → apps/forum/src/components/ui/dialog.tsx
- Checkbox attestations → apps/forum/src/components/ui/checkbox.tsx; Radio attestations — MISSING: no radio component exists in the library (checkbox.tsx is the only relevant control; report, don't silently patch)
- Select (compatible_licence kind) → apps/forum/src/components/ui/select.tsx
- §11.1 Button (+ disabled states) → apps/forum/src/components/ui/button.tsx
- Disabled-state banner (`ugc.enabled=false`) → apps/forum/src/components/ui/banner.tsx (matches Wave 1 `unavailable_pending_legal` placeholder discipline)
- Status chips (§11.5 Pill/Tag: quarantined/scanning/…) → apps/forum/src/components/ui/badge.tsx
- §11.9 Skeleton → apps/forum/src/components/ui/skeleton.tsx
- Toast §11.7 (available-not-prescribed) → apps/forum/src/components/ui/toast.tsx
- §11.8 Error (rights-reason rejects; submit rejected while dormant) → apps/forum/src/components/ui/banner.tsx (nearest library pattern — no dedicated error component; report fit)
- Destructive control (attribution erasure) → apps/forum/src/components/ui/button.tsx (destructive variant; no dedicated destructive-control component in the library)

## States required
*(sourceClass + status-enum set below. GPT's ~70 transient states — each dormancy sub-branch, each rights-basis value, each cap-milestone step — folded, since `resourceReferences.status` (10) + `sourceClass` (4) + `rightsBasis` (4) are the authoritative sets.)*

**A. Disabled-render (current, E3):** UGC off — route reachable; banner + disabled dropzone/submit; mutations 202/203 server-reject. UGC states below are forward-compatible until reactivation.
**B. Contract-acceptance branches (CAP-203, "state-aware copy," verbatim — only when UGC on):** (1) **UGC = 0/1 or combined**; (2) **operator/in-house/rights_verified = 0/1/many** — licence-grant semantics differ by sourceClass; the contract copy reflects which.
**C. Upload-submission states (CAP-202, UGC on):** submitting (uploading) → **quarantined if rights OK** · **rejected if no rightsBasis** (required before forge; none → reject). Then System-side: scanning (CAP-204) — this screen shows status feedback.
**D. Rights-basis selection:** `rightsBasis ∈ {own · authorized · compatible_licence · public_domain}` (+ compatibleLicenceKind? when licence-based).
**E. Erasure state (CAP-227):** attribution erasure → `resourceContributions.contributorUserId` nulled + **non-value-bearing auditLog record**; public handle detached; **weight retained for historical settlement**; future Signal respects erasure basis (M7 erasure principle — never retain erased values in `auditLog.prev`).
**F. Upload-cap tiers (CAP-228, System):** **2/5 (day/week) → 5/15 after 5 accepted refs + zero rights/safety violations**; never Signal-scaled; temporary ops throttle via systemConfig.
**G. One→many forge invariant (INV-4):** user_ugc references are one→many **blocked** (intake-context; the unlock — CAP-226 rights_verified — is an `/admin/resources` action).

## Component library maturity note
- ⚠️ dropzone has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ dialog has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ checkbox has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ select has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ banner has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ badge has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ skeleton has zero production usage — expect possible integration friction, report don't silently patch.
- Production-proven, no warning needed: button, toast.
---
