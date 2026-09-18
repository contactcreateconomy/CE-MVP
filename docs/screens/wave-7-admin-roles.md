---
# RBAC & Ops Assignments

**Status (2026-09-18 screen audit correction):** LIVE (read-only RBAC matrix + ops-coverage list; CAP-413 Founder-only assign and CAP-564 administrator-gated revoke are correctly enforced on the backend). **Fixed (this pass):** `listAssignments`, `listOpsAssignments`, `opsUpsert`, and `opsAck` previously accepted any staff role — narrowed to `administrator`; the widget-catalog entry was narrowed from `[administrator, editor]` to `[administrator]` (editor had no business on this route per contract). **Open, not fixed this pass:** the assign/revoke/ops-upsert/ack UI forms are not wired (the mutations exist and are now correctly gated, but nothing in the UI calls them yet) — flagged in CHANGELOG.


**Route:** `/admin/roles`
**Status:** NOT STARTED (no `app/admin/` tree exists)
**Contract:** PRD/02-contracts/wave-7/CONTRACT-7-admin-roles-FINAL.md
**Slice(s):** P3-09 (RBAC assignment + UI revoke + Second-Founder gate — Phase 3) · P3-10 (ops-coverage slots, single-person ack, escalation — Phase 3)

## Layout

STYLE-KIT §12.4 admin layout via shell: 48px header, 220px sidebar, dense content area.

```
┌─ 48px §12.4 header (shell chrome) ────────────────────────────┐
├─ 220px sidebar ─┬─ dense content area ────────────────────────┤
│ admin nav       │ ┌─ RBAC assignments (A1 data table) ───────┐ │
│                 │ │ roleAssignments: userId · role · scope · │ │
│                 │ │ status · grantedAt / revokedAt           │ │
│                 │ │ [pills: slot states green/vacant]        │ │
│                 │ │ user lookup → assign (Founder-only) /    │ │
│                 │ │ revoke (admin/Founder) → confirm Modal   │ │
│                 │ │ (Tier-3-class flip for Second Founder)   │ │
│                 │ └──────────────────────────────────────────┘ │
│                 │ ┌─ ops-coverage matrix (A1) ───────────────┐  │
│                 │ │ 11 slots: editor_primary/backup ·        │  │
│                 │ │ publisher_primary/backup ·               │  │
│                 │ │ persona_publisher · moderator_primary/   │  │
│                 │ │ backup · after_hours_escalation ·        │  │
│                 │ │ store_operator_primary · support_owner · │  │
│                 │ │ support_channel                          │  │
│                 │ │ states {filled · single_person_acknow-   │  │
│                 │ │ ledged · vacant · inactive_assignee}     │  │
│                 │ │ [single-person ack control]              │  │
│                 │ └──────────────────────────────────────────┘  │
└─────────────────┴───────────────────────────────────────────────┘
```

## Components required

- §11.2 forms → apps/forum/src/components/ui/input.tsx
- A1 data table (assignments; ops-coverage matrix) → apps/forum/src/components/ui/data-table/index.tsx
- §11.5 pills (slot states green/vacant) → apps/forum/src/components/ui/badge.tsx
- §11.7 confirm (Tier-3-class flip) → apps/forum/src/components/ui/dialog.tsx
- user lookup → apps/forum/src/components/ui/combobox.tsx (nearest searchable-select primitive; no dedicated user-lookup component — flag)

Contract archetype gaps: no RBAC assignment matrix, ops-coverage matrix, or second-Founder Tier-3 component in §11 — MISSING beyond generic primitives.

## States required

*(Enum-backed set. GPT's ~50 transient states — each role assign, each slot combination — folded, since the role enum (6) + 11-slot enum + 4 slot-states + the Second-Founder gate are authoritative.)*

**A. Second Founder gate (CAP-008):** blocked → TESTED-admin-verified + Tier-3 typed flip → granted; env-scoped persistence (preview ≠ production).
**B. Role assign (CAP-413 `roles.assign`):** Founder-only; roles per enum. Adjacent (no UI): CAP-007 `grantFounder` / CAP-009 `revokeRole` CLI.
**C. Slot vacant (CAP-414):** → intervention + **launch readiness blocked** unless green OR single-person ack.
**D. Single-person ack (CAP-415 `opsCoverage.ack`):** required before beta when one human per critical slot.
**E. Ops upsert (CAP-416 `opsAssignments.upsert`, gated CAP-413):** per-slot assignment; four slot states.
**F. After-hours escalation (CAP-417):** → operationalIncidents + auditLog via after_hours_escalation slot.
**G. Revoke (CAP-564, E3 CLOSED 2026-08-26):** UI revoke via `roles.revoke` (administrator/Founder) — writes `roleAssignments (status=revoked, revokedAt)` + auditLog; enforcement on next request (CAP-430); CAP-009 CLI remains the emergency path.

## Component library maturity note

⚠️ input.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ data-table/index.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ badge.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ dialog.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ combobox.tsx has zero production usage — expect possible integration friction, report don't silently patch.

No production-proven library components cited (button not named by the contract's Components Used; actions compose from the above).
