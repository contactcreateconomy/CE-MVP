---
# Reliability / Jobs & Dead-letter

**Route:** `/admin/reliability`
**Status:** NOT STARTED (no `app/admin/` tree exists)
**Contract:** PRD/02-contracts/wave-7/CONTRACT-7-admin-reliability-FINAL.md
**Slice(s):** P7O-04 (job + dead-letter list + liveness) · P7O-05 (dead-letter redrive — confirm modal on the P7O-04 table, F-22 fence on RC-4 / manual_review)

## Layout

STYLE-KIT §12.4 admin layout via shell: 48px header, 220px sidebar, dense content area.

```
┌─ 48px §12.4 header (shell chrome) ────────────────────────────┐
├─ 220px sidebar ─┬─ dense content area ────────────────────────┤
│ admin nav       │ ┌─ health row ────────────────────────────┐  │
│                 │ │ [health dot per probe: healthy · stale ·│  │
│                 │ │ dead · never_ran] [Tooltip: 15-min TTL] │  │
│                 │ │ heartbeat >15m → "—" (unavailable ≠ 0)  │  │
│                 │ └─────────────────────────────────────────┘  │
│                 │ ┌─ A1 data table — dead-letter list ───────┐ │
│                 │ │ jobDeadLetters: jobRunId · jobKey ·      │ │
│                 │ │ reason · createdAt · redrivenAt? ·       │ │
│                 │ │ redrivenByUserId?                        │ │
│                 │ │ jobRuns status (incl. manual_review —   │ │
│                 │ │ display only, no action)                 │ │
│                 │ │ [Button: redrive] → confirm Modal        │ │
│                 │ └─────────────────────────────────────────┘ │
│                 │ load state: skeletons                        │
└─────────────────┴───────────────────────────────────────────────┘
```

## Components required

- A1 Data table (dead-letter list — inventory §3's highest-priority gap) → apps/forum/src/components/ui/data-table/index.tsx
- health dot (composable §11.5 pill/badge; no explicit status-dot token — soft flag) → apps/forum/src/components/ui/badge.tsx
- §11 tooltip (CAP-503 names it — onboarding tooltip documents the 15-min TTL) → apps/forum/src/components/ui/tooltip.tsx
- §11.1 Button (redrive) → apps/forum/src/components/ui/button.tsx
- confirm Modal → apps/forum/src/components/ui/dialog.tsx
- §11.9 skeletons → apps/forum/src/components/ui/skeleton.tsx
- §12.4 layout

Archetype gaps (contract): Data Table + job-run timeline + liveness indicator + authorized-redrive pattern — beyond the primitives above, MISSING: job-run timeline component does not exist in the library.

## States required

*(Enum-backed set. GPT's ~90 transient states — each retry sub-step, each STOP/authz combination — folded, since the health enum (healthy/stale/dead/never_ran) + dead-letter/redrive lifecycle are authoritative.)*

**A. Dead-letter (CAP-499, INV-M18-5):** exhausted retries → `jobDeadLetters` row — **never silent drop**.
**B. Redriven (CAP-500):** `redrivenAt` + `redrivenByUserId` stamped; jobRuns re-queued. **"Redrive runbook required before open beta."** Blocked if: actor-authz changed · STOP active · target ineligible · runbook requirement unmet; authorized-command consumed once (reuse rejected).
**C. Liveness (CAP-501, R-LIVENESS / FATAL-M18-03, cron 5m):** healthy · **stale** (`now > lastSuccessAt + interval×1.5` = 7.5m) · **dead** (×3 = 15m → + alert) · **never_ran**. **Liveness = lastSuccessAt, NOT lastStatus.**
**D. Heartbeat stale >15m (CAP-503):** M15 shows **"—"** — unavailable ≠ zero (INV-M15-13); onboarding tooltip documents the 15-min TTL.
**E. Two distinct thresholds (all three confirm — do NOT collapse):** CAP-501's **7.5-min** system-health stale threshold (5-min interval × 1.5) vs CAP-503's **15-min** UI-heartbeat display TTL are separate concerns.
**F. (adjacent, flagged)** `jobRuns` **manual_review** states (CAP-495 authz-fail, CAP-515 RC-4 manual_only) — Has-UI=YES M18 rows with **no inventory placement** (Open Question — where does a human action them?).

## Component library maturity note

⚠️ data-table/index.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ badge.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ tooltip.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ dialog.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ skeleton.tsx has zero production usage — expect possible integration friction, report don't silently patch.

Production-proven (no warning): button.tsx.
