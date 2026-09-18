---
# Support Console

**Status (2026-09-18 screen audit correction):** LIVE. **Fixed (this pass):** the quota Grant/Neutralize UI reused the same input for both an `operationalIncidents` id (CAP-402 Grant) and the returned `quotaGrants` id (CAP-403 Neutralize) — two distinct id-typed tables — so Neutralize always targeted the wrong row or threw. Split into separate tracked fields; Grant now surfaces the `grantId` it returns for use in Neutralize.


**Route:** `/admin/support`
**Status:** NOT STARTED (no `app/admin/` tree exists)
**Contract:** PRD/02-contracts/wave-7/CONTRACT-7-admin-support-FINAL.md
**Slice(s):** P7A-01 (widget-catalog row) · P7A-07 (quota grant / neutralize + rate gate + CAP-432 trigger) · P7A-08 (timezone.fix + note + masked summary)

## Layout

STYLE-KIT §12.4 admin layout via shell: 48px header, 220px sidebar, dense content area.

```
┌─ 48px §12.4 header (shell chrome, support-scoped) ────────────┐
├─ 220px sidebar ─┬─ dense content area ────────────────────────┤
│ support-        │ ┌─ masked user summary (read-only) ────────┐│
│ operator nav    │ │ §11.3 user card — masked PII             ││
│                 │ │ moderationCases/strikes/capabilityRestr. ││
│                 │ │ masked summary                           ││
│                 │ └──────────────────────────────────────────┘│
│                 │ ┌─ quota grant (A1-lite table) ────────────┐ │
│                 │ │ ≤5 extra acquires · ≤7d · max 1 active/  │ │
│                 │ │ user · unique incidentId                 │ │
│                 │ │ [Button: grant] → confirm Modal + Toast   │ │
│                 │ │ [Button: neutralize]                     │ │
│                 │ └──────────────────────────────────────────┘ │
│                 │ ┌─ timezone fix + user note (§11.2) ───────┐  │
│                 │ │ §11.2 inputs (masked fields; note)       │  │
│                 │ └──────────────────────────────────────────┘  │
└─────────────────┴───────────────────────────────────────────────┘
```

Rate limit: support.action 30/1h per operator (CAP-020; staff NOT rate-exempt).

## Components required

- §11.2 inputs (masked fields; note) → apps/forum/src/components/ui/input.tsx
- §11.3 user card → apps/forum/src/components/ui/card.tsx
- §11.7 confirm modal → apps/forum/src/components/ui/dialog.tsx
- Toast → apps/forum/src/components/ui/toast.tsx
- A1-lite table → apps/forum/src/components/ui/data-table/index.tsx

Contract archetype gaps: no masked-user-summary or bounded-quota-grant component in §11 — MISSING beyond generic primitives.

## States required

*(Enum-backed set. GPT's ~40 transient states — each grant-bound sub-step — folded, since the quota-grant bounds + neutralize + timezone-calendar branches are authoritative.)*

**A. Quota grant (CAP-402 `quota.grant`):** **≤5 extra acquires · ≤7d · max 1 active/user · unique incidentId**; rolling **>3/90d → Admin intervention** (CAP-432, rendered on Home).
**B. Neutralize (CAP-403 `quota.neutralize`):** sets `neutralizedAt`.
**C. Timezone fix (CAP-404 `support.timezone.fix` — canonical mutation, E4):** **grievance_india = Asia/Kolkata + India holidays; DMCA = US business days.** (CAP-024 = the M1 backend-contract row for the same correction — retained, cross-linked; not a duplicate.)
**D. User note (CAP-405 `support.note.create`):** writes auditLog only.
**E. Masked summary (CAP-406 `support.userSummary`):** masked PII; read-only. ⚠️ masked-projection field allowlist not enumerated (Open Question).

## Component library maturity note

⚠️ input.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ dialog.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ data-table/index.tsx has zero production usage — expect possible integration friction, report don't silently patch.

Production-proven (no warning): card.tsx, toast.tsx.
