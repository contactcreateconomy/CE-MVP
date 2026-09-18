---
# Analytics Dashboard (Founder)

**Route:** `/admin/analytics`
**Status:** NOT STARTED (no `app/admin/` tree exists)
**Contract:** PRD/02-contracts/wave-7/CONTRACT-7-admin-analytics-FINAL.md
**Slice(s):** P7O-02 (founder dashboard + fold-in render). P7O-03 (projection crons) feeds the cards off-screen.

## Layout

STYLE-KIT §12.4 admin layout via shell: 48px header, 220px sidebar, dense content area.

```
┌─ 48px §12.4 header (shell chrome) ────────────────────────────┐
├─ 220px sidebar ─┬─ dense content area ────────────────────────┤
│ admin nav       │ ┌─ stats cards (§11.3) — 7 cards ──────────┐ │
│                 │ │ 1 L08 funnel (core 7 stages; affiliate   │ │
│                 │ │   optional/branch)                       │ │
│                 │ │ 2 S18 (staff-excluded)                   │ │
│                 │ │ 3 Activation (+ catalog annotation)      │ │
│                 │ │ 4 Library · 5 Affiliate · 6 Store        │ │
│                 │ │   (three commerce funnels never merge)   │ │
│                 │ │ 7 Signal card (totals/trends/broad only) │ │
│                 │ │ each card: lastCalculatedAt +            │ │
│                 │ │ definitionVersion + freshness visible;   │ │
│                 │ │ freshness Badge {complete·partial·       │ │
│                 │ │ stale·recalculating}; rates `n% (x/y)`;  │ │
│                 │ │ denom < 25 → directional (trend arrows   │ │
│                 │ │ suppressed); L08 incomplete →            │ │
│                 │ │ "cohort incomplete"                      │ │
│                 │ └─────────────────────────────────────────┘ │
│                 │ ┌─ weekly decision (Founder only) ────────┐  │
│                 │ │ ≤3 highlighted actions; snapshots +     │  │
│                 │ │ versions persisted                      │  │
│                 │ └─────────────────────────────────────────┘  │
│                 │ load state: skeletons                        │
└─────────────────┴───────────────────────────────────────────────┘
```

Note: "7 cards" is contract OQ#2 arithmetic (L08 + S18 + Activation + 3 commerce + Signal = 7), flagged as inference.

## Components required

- Stats cards (§11.3) → apps/forum/src/components/ui/card.tsx
- A2 Charts/data-viz — ARCHETYPE GAP → MISSING: Charts (A2) does not exist — see PRD/04-design-system/DESIGN-SYSTEM-OPEN-ITEMS.md (inventory §3 names this screen's L08 funnel/S18/commerce as the data-viz gap; only Stats Card + Progress Fill exist; P7O-02 fences the build to cards + honest labels, not a chart library)
- §11.9 skeletons → apps/forum/src/components/ui/skeleton.tsx
- freshness + sampleStatus-directional display tokens → no §11 pattern (soft flag); rendered via §11.5 Badge → apps/forum/src/components/ui/badge.tsx
- §12.4 admin layout via shell

## States required

*(Enum-backed set. GPT's ~110 transient states — each L08 window complete/incomplete, each funnel available/unavailable, each denominator boundary — folded, since the `freshness` (4), `sampleStatus`, and card enums are authoritative. Resolved on register evidence, not vote — RECONCILIATION-7D §1.)*

**A. Card freshness (CAP-458, INV-M16-13):** complete · partial · stale · **recalculating** — "recalculating shown on Founder dash"; never a fake-stable render.
**B. L08 cohort incomplete (CAP-459, INV-M16-11):** labeled **"cohort incomplete"** — not zero-catastrophe / fake zero cliff.
**C. Sample confidence (CAP-449, R-CONFIDENCE):** rate **always `n% (x/y)`**; denom **< 25 → sampleStatus=directional**; **trend arrows + drop alerts suppressed**.
**D. L08 windows (CAP-445):** core 7 ordered stages; affiliate optional/branch; windows verbatim — impression→signup **7d** · signup→first_action **7d** · signup→acquire **14d** · acquire→day7 **30d**.
**E. S18 (CAP-446):** staff-excluded projection (`users.isStaff` / CAP-434).
**F. Activation (CAP-447 + fold-in CAP-461):** inlines published **catalog size, median age, adds-in-period, category coverage**; `catalogSizeAtTime` + `resourceAgeDays` stamped at write (CAP-462 — cannot backfill).
**G. Commerce (CAP-448):** Library / Affiliate / Store — **three funnels never merge**; every conversion labeled `conversionType`. Amazon click = Affiliate traffic; Amazon interim self-report stays unverified, never rendered as network-verified.
**H. Signal card (CAP-451):** totals/trends/broad-category **only — never event-weight-resolvable breakdown**; Recognition/Awards excluded from Signal derivation.
**I. Weekly decision recorded (CAP-452, Founder only):** ≤3 highlighted actions; persists metricSnapshots + projectionDefinitionVersion + catalogVersion; historical decision stays bound to captured versions.
**J. Version visibility (CAP-463):** **lastCalculatedAt + definitionVersion + freshness visible** on cards.

## Component library maturity note

⚠️ badge.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ skeleton.tsx has zero production usage — expect possible integration friction, report don't silently patch.

Production-proven (no warning): card.tsx.
