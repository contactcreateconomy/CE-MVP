---
# Audit Log Viewer

**Route:** `/admin/audit`
**Status:** NOT STARTED (no `app/admin/` tree exists)
**Contract:** PRD/02-contracts/wave-7/CONTRACT-7-admin-audit-FINAL.md
**Slice(s):** P3-11 (query + export + Founder spot-check — Phase 3)

## Layout

STYLE-KIT §12.4 admin layout via shell: 48px header, 220px sidebar, dense content area.

```
┌─ 48px §12.4 header (shell chrome) ────────────────────────────┐
├─ 220px sidebar ─┬─ dense content area ────────────────────────┤
│ admin nav       │ ┌─ filters ───────────────────────────────┐  │
│                 │ │ actor · action · target · time · env ·  │  │
│                 │ │ correlation  [filter Select]            │  │
│                 │ └─────────────────────────────────────────┘  │
│                 │ ┌─ A1 data table (append-only audit) ──────┐ │
│                 │ │ actorId · role? · action · target ·      │ │
│                 │ │ prev/next (masked) · reasonCode? ·       │ │
│                 │ │ correlationId · reversible? · createdAt  │ │
│                 │ │ pagination · cold-archive state          │ │
│                 │ └─────────────────────────────────────────┘ │
│                 │ ┌─ audit-detail panel ────────────────────┐  │
│                 │ │ [Button: export] → confirm Modal (§11.7)│  │
│                 │ │ (export itself is audited)              │  │
│                 │ └─────────────────────────────────────────┘  │
│                 │ load state: Skeleton                          │
└─────────────────┴───────────────────────────────────────────────┘
```

## Components required

- A1 Data table (inventory §3 explicitly lists /admin/audit — archetype gap) → apps/forum/src/components/ui/data-table/index.tsx
- filter Select → apps/forum/src/components/ui/select.tsx
- audit-detail panel → nearest: apps/forum/src/components/ui/card.tsx (no dedicated audit-detail component — flag)
- masked-value rendering → MISSING: masked-value rendering component does not exist in the library
- §11.7 export confirm → apps/forum/src/components/ui/dialog.tsx
- §11.9 Skeleton → apps/forum/src/components/ui/skeleton.tsx
- cold-archive state → no library component (contract lists it as a state, not a kit primitive — compose; flag)

## States required

*(Enum-backed set. GPT's ~40 transient states — each filter dimension, each export sub-step — folded, since the query/export/spot-check + never-delete invariant are authoritative.)*

**A. Query (CAP-421 `audit.query`):** filtered read (actor/action/target/time/env/correlation); never-delete invariant; INV-M15-6 makes this table the fail-closed spine for all privileged writes.
**B. Export (CAP-422 `audit.export` — action):** **the export itself is audited** (Writes: "auditLog (read), auditLog"); **export must fail-closed if the export-audit write fails.**
**C. Founder spot-check (CAP-357 / R-INSIDER):** monthly; **"no dual-control theatre"**; ⚠️ register Writes column literally says **`auditLog`** for this read-oriented check — either the spot-check is itself logged (likely) or a column error (Open Question, verbatim).
**D. Erasure interplay:** erased values never retained in `auditLog.prev` — invariant, no display action.
**E. Cold-archive:** hot/current records vs cold-archived retrieval.

## Component library maturity note

⚠️ data-table/index.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ select.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ dialog.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ skeleton.tsx has zero production usage — expect possible integration friction, report don't silently patch.

Production-proven (no warning): card.tsx.
