---
# Admin Home

**Route:** `/admin/home`
**Status:** NOT STARTED (no `app/admin/` tree exists)
**Contract:** PRD/02-contracts/wave-7/CONTRACT-7-admin-home-FINAL.md
**Slice(s):** P7A-01 (widget-catalog row) · P7A-02 (compose + bounded read + routeKey gate) · P7A-03 (intervention lifecycle) · P7A-04 (counters cron + stale ≠ 0) · P7A-05 (S0 cover → ingest.throttle) · P7A-06 (remote Home alert writers)

## Layout

STYLE-KIT §12.4 admin layout via shell: 48px header, 220px sidebar, dense content area.

```
┌─ 48px §12.4 header (shell chrome) ────────────────────────────┐
├─ 220px sidebar ─┬─ dense content area ────────────────────────┤
│ admin nav       │ ┌─ critical strip (R-HOME order) ─────────┐ │
│                 │ │ S0 · legal overdue · unsafe destinations│ │
│                 │ │ · classifier/outage · active STOP ·     │ │
│                 │ │ M18 critical · open interventions       │ │
│                 │ └─────────────────────────────────────────┘ │
│                 │ ┌─ intervention banners (severity pills) ─┐ │
│                 │ │ severity: critical|high|medium          │ │
│                 │ │ copy: whatHappening + whatToDo +        │ │
│                 │ │   deep link (source-controlled routeKey)│ │
│                 │ │ [ack] [resolve] [snooze ≤24h]           │ │
│                 │ └─────────────────────────────────────────┘ │
│                 │ ┌─ ≤8 next-action cards ─────────────────┐  │
│                 │ ┌─ stats/widget cards (adminCounters) ───┐  │
│                 │ │ health {healthy|stale|failed};         │  │
│                 │ │ stale → "—" not 0; heartbeat >15m → "—"│  │
│                 │ └────────────────────────────────────────┘  │
│                 │ load state: skeletons + stale-state ("—")  │ │
└─────────────────┴──────────────────────────────────────────────┘
```

## Components required

- §11.3 stats/widget cards → apps/forum/src/components/ui/card.tsx
- §11.5 severity/health pills → apps/forum/src/components/ui/badge.tsx
- §11.9 skeletons + stale-state ("—") rendering → apps/forum/src/components/ui/skeleton.tsx
- Intervention banner → apps/forum/src/components/ui/banner.tsx (contract flags BANNER ARCHETYPE GAP — §11 defines none; M15 module sheet names "intervention banner"; same class as the 7A CMP banner flag)
- next-action cards → apps/forum/src/components/ui/card.tsx
- ack/resolve/snooze controls → apps/forum/src/components/ui/button.tsx (no dedicated intervention-control component — compose)

## States required

*(Enum-backed set. GPT's ~40 transient states — each severity, each counter sub-state — folded, since the severity enum + intervention lifecycle + counter-health enum are authoritative.)*

**A. Composition (CAP-391):** **≤8 next actions + critical strip + interventions**; "deterministic priority tuple" — tuple definition unowned (Open Question).
**B. Bounded read (CAP-428 / INV-M15-7):** s0/legal/STOP/unsafe destinations live; **else adminCounters; no unbounded Home reads.**
**C. Counter render (CAP-411 `adminCounters.refresh`, ~60s cron, M18-owned/M15-consumed):** health {healthy|stale|failed}; **stale → "—" not 0**; heartbeat >15m → "—".
**D. Counter cron failure (CAP-412):** → intervention; **unavailable ≠ zero**.
**E. S0 coverage escalation (CAP-399):** unclaimed >4h → +15m backup, +15m Founder; **>4h → `ingest.throttle` + intervention "INGEST THROTTLED — S0 BACKLOG"**.
**F. Intervention lifecycle (CAP-407→410):** open → **acknowledged** (408, Admin-scoped; **Support sees only support-scoped alerts** — surface for those unowned, Open Question) → **resolved** (409) | **snoozed** (410, ≤24h, **critical forbidden**).
**G. Severity:** critical · high · medium; copy MUST include whatHappening + whatToDo + deep link (**CAP-427: source-controlled routeKey only; arbitrary URLs rejected**).
**H. Remote banner writers rendered here:** CAP-332 (250/400 open-case), CAP-381 (drip supply <14d), CAP-432 (quotaGrants >3/90d), CAP-484 (seoHealth stale), CAP-318 (cause-less rank-drop), CAP-414 (vacant ops slot).

## Component library maturity note

⚠️ badge.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ skeleton.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ banner.tsx has zero production usage — expect possible integration friction, report don't silently patch.

Production-proven (no warning): card.tsx, button.tsx.
