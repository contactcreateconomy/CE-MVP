---
# Legal & Rights Intake (DMCA · counter · grievance · erasure)

**Route:** `/legal/intake`
**Status:** NOT STARTED (no `app/legal/` directory exists in the app tree)
**Contract:** PRD/02-contracts/wave-7/CONTRACT-7-legal-intake-FINAL.md
**Slice(s):** P7T-05 (shell + DMCA intake, anonymous CAP-217 + authenticated CAP-343) · P7T-06 (counter-notice / grievance India / erasure submit, CAP-344/348/350) · P7T-07 (operator source-takedown branch, CAP-058/059/060 — operator branch lives on this route per contract §4)

## Layout

```
┌─ legal-layout family (720px reading column, CAP-027 pattern) ┐
│ (no ConsentProvider — same carve-out as Wave-1 legal pages)   │
│ ┌─ 720px column ────────────────────────────────────────────┐ │
│ │ intake-type branch (form set per legalIntake.type):       │ │
│ │   dmca_notice (anonymous/webhook + authenticated)         │ │
│ │   dmca_counter_notice · grievance_india · right_of_erasure│ │
│ │   source_takedown (Moderator branch)                      │ │
│ │ ┌─ Form ───────────────────────────────────────────────┐  │ │
│ │ │  §11.2 Inputs: complainantContact, target, …         │  │ │
│ │ │  subjectClass selector (ugc|operator_published|      │  │ │
│ │ │    store_listing)                                    │  │ │
│ │ │  statutory-clock disclosure copy (D: clocks PUBLISHED│  │ │
│ │ │    on-page — ack/action due instants)                │  │ │
│ │ │  [Pill: type] [Pill: status] [Pill: clock state]     │  │ │
│ │ │  [Button: submit] → Modal confirm                    │  │ │
│ │ │  Error (deficient-counter state, §11.8)              │  │ │
│ │ └──────────────────────────────────────────────────────┘  │ │
│ │  load state: Skeleton                                      │ │
│ └────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

## Components required

- §11.2 Inputs (form set per type; complainantContact; subjectClass selector) → apps/forum/src/components/ui/input.tsx; subjectClass selector → apps/forum/src/components/ui/select.tsx (nearest select primitive; no dedicated subject-class component)
- §11.5 Pill (type/status/clock states) → apps/forum/src/components/ui/badge.tsx
- §11.1 Button → apps/forum/src/components/ui/button.tsx
- §11.7 Modal (confirm) → apps/forum/src/components/ui/dialog.tsx
- §11.8 Error (deficient-counter state) → MISSING: error component (§11.8) does not exist in the library (nearest stand-in: banner.tsx)
- §11.9 Skeleton → apps/forum/src/components/ui/skeleton.tsx
- 720px reading column — legal-layout family (CAP-027 pattern) — layout, not a component

Contract archetype gaps: no legal-intake form family, facial-completeness checklist, statutory-clock component, legal-hold state, or erasure-retention-explanation component in §11 — all flagged MISSING beyond the generic primitives above.

## States required

*(Enum-backed set by intake type. GPT's ~90 transient states — each subject-class × target × completeness combination — folded, since the `legalIntake.type` (6) + `subjectClass` (3) + status enums are authoritative.)*

**A. DMCA notice (CAP-217 public form/webhook + CAP-343 authenticated + CAP-058 operator-filed):** subjectClass ugc | operator_published | store_listing; internal clocks **ack 3 business days / action 10 business days**. CAP-217 writes `legalIntake (type=dmca_notice, status=received)` (Wave-6B retarget from thin `dmcaNotices`).
**B. Counter-notice (CAP-344):** facially-complete → **always intake-eligible**; deficient-reject; **abuse-chill: 2 rejected-deficient / 90d → expedited path removed 180d** (INV-15/AC-12). Restore eligibility computed off-screen (CAP-346 — no republish over independent non-copyright hold).
**C. Source takedown (CAP-058→059→060):** filed → actioned (`sources.trustLevel=block` + re-evaluation: **keep post if ≥2 other independent sources remain, else archive + operator review**) → resolved. **operator_published variant pages Founder/Admin within 2 business days** (CAP-347, off-screen).
**D. Grievance India (CAP-348):** **statutory clocks PUBLISHED on-page (INV-12a): ackDueAt=+24h, actionDueAt=+15d**; expedited branch off-screen (CAP-349: intimate-imagery/impersonation/nudity → severity ≥s1 + actionDueAt=+24h).
**E. Right of erasure (CAP-350):** submitted → off-screen outcome **ERASE_PARTIAL | REFUSED_LEGAL_HOLD** (CAP-351). Invariant: **never delete strikes / auditLog / legalIntake / moderationActions**.
**F. `merchant_ip`:** enum literal exists **with no /legal/intake CAP** — M11's path writes `merchantComplaints` (CAP-268, /admin/store). Two complaint paths named (Open Question).
**G. Valid-notice consequence (off-screen):** CAP-345 writes the **provisional** copyright strike ("not a final infringement finding").

## Component library maturity note

⚠️ input.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ select.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ badge.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ dialog.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ skeleton.tsx has zero production usage — expect possible integration friction, report don't silently patch.

Production-proven (no warning): button.tsx.
