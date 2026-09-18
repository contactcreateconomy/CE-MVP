---
# Appeal Submission

**Status (2026-09-18 screen audit correction):** LIVE. **Fixed (this pass):** the route had no authentication gate at all (contract requires member-only, no anonymous access) — added, with a sign-in prompt for anonymous visitors. Wired to `appeal.myActions` to show the case's deadline/status and gate the submit button on `windowOpen`/`caseStatus` (previously a fully-anonymous, fully-open form that only failed after submission attempts).


**Route:** `/appeal/[actionId]` (dynamic `[actionId]` — a `moderationActions` id carrying `appealDeadlineAt`)
**Status:** NOT STARTED (no `app/appeal/` directory exists in the app tree)
**Contract:** PRD/02-contracts/wave-7/CONTRACT-7-appeal-FINAL.md
**Slice(s):** P7T-04 (CAP-340 submit only — this route submits the appeal, it does not decide it; resolve/SLA are P7E-16 on `/admin/moderation`)

## Layout

```
┌─ member surface (protected route) ───────────────────────────┐
│ ┌─ moderation-action summary card (§11.3) ─────────────────┐ │
│ │  action type / target / actor / status                   │ │
│ │  [Pill: deadline 14d|30d]  [Pill: status]                │ │
│ └──────────────────────────────────────────────────────────┘ │
│ ┌─ §12 Form ───────────────────────────────────────────────┐ │
│ │  appeal text — Textarea (2,000-char cap + counter)       │ │
│ │  evidence-ref fields (≤ 3)                               │ │
│ │  inline Error per failed eligibility gate (§11.8)        │ │
│ │  [Button: submit] → Modal confirm (§11.7)                │ │
│ └──────────────────────────────────────────────────────────┘ │
│   load state: Skeleton (§11.9)                                │
└───────────────────────────────────────────────────────────────┘
```

## Components required

- §12 Form (form layout — no dedicated form component in the library; compose from primitives)
- §11.2 Textarea (2k cap + counter) and evidence-ref fields (≤3) → apps/forum/src/components/ui/input.tsx (no dedicated textarea component exists in the library — input.tsx is the §11.2 base)
- moderation-action summary card (§11.3) → apps/forum/src/components/ui/card.tsx
- §11.5 Pill (deadline/status) → apps/forum/src/components/ui/badge.tsx
- §11.1 Button → apps/forum/src/components/ui/button.tsx
- §11.8 inline Error (each gate) → MISSING: error component (§11.8) does not exist in the library (nearest stand-in: banner.tsx)
- §11.7 Modal (confirm) → apps/forum/src/components/ui/dialog.tsx
- §11.9 Skeleton → apps/forum/src/components/ui/skeleton.tsx

Contract archetype gap: no appeal-specific evidence selector, deadline-expiry form, or reviewer-independence state in §11.

## States required

*(Enum-backed set. GPT's ~40 transient states — each validation sub-step, each reviewer-availability branch — folded, since the eligibility gates + submit outcome are authoritative.)*

**A. Eligibility gates (each a distinct reject state, CAP-340):** one-appeal-per-action (already appealed) · deadline expired — **14d content / 30d terminate (two windows by sanction type)** · length > 2,000 chars · > 3 evidence refs · **URLs in submission (hard-reject — echoes the no-user-URL principle)** · action-not-appealable · action-not-owned.
**B. Submitted:** moderationCases updated; queue places appeals near bound (CAP-330 ordering: s0 → legal → s1 → **appeals near bound** → s2 → s3).
**C. Review (off-screen, CAP-341):** pending human re-review — **one human re-review (second human or Admin if solo)**; resolved ≤ 7 business days.
**D. Overdue (off-screen, CAP-342 cron):** `appeal.slaTick` → **Admin escalation — not auto-deny/restore; safety holds not auto-restored**.
**E. Deadline-passed pre-submission:** server behavior (reject vs form-disabled) unspecified (Open Question).

## Component library maturity note

⚠️ input.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ badge.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ dialog.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ skeleton.tsx has zero production usage — expect possible integration friction, report don't silently patch.

Production-proven (no warning): button.tsx, card.tsx.
