---
# SEO Health

**Status (2026-09-18 screen audit correction):** LIVE. **Fixed (this pass):** `seoHealthView` previously accepted any staff role via the same `requireAnyAdmin` helper — narrowed to `administrator`, matching CAP-567.


**Route:** `/admin/seo`
**Status:** NOT STARTED (no `app/admin/` tree exists)
**Contract:** PRD/02-contracts/wave-7/CONTRACT-7-admin-seo-FINAL.md
**Slice(s):** P7O-07 (health view + GSC pull — CAP-567 / CAP-483; CAP-484 consume — Home alert already P7A-06)

## Layout

STYLE-KIT §12.4 admin layout via shell: 48px header, 220px sidebar, dense content area.

```
┌─ 48px §12.4 header (shell chrome) ────────────────────────────┐
├─ 220px sidebar ─┬─ dense content area (render-only) ──────────┤
│ admin nav       │ ┌─ health widget ────────────────────────┐  │
│                 │ │ [pill/badge health dot · status]       │  │
│                 │ │ lastGscPullAt? · lastCalculatedAt      │  │
│                 │ └────────────────────────────────────────┘  │
│                 │ ┌─ stat cards ───────────────────────────┐  │
│                 │ │ sitemapUrlCount · lastSitemapBuildAt   │  │
│                 │ │ coverageErrorCount                     │  │
│                 │ │ thinIndexedCount (E3 field)            │  │
│                 │ │ heldIndexedCount  (E3 field)           │  │
│                 │ │ unavailable metric → "—" (never zero)  │  │
│                 │ └────────────────────────────────────────┘  │
│                 │ intervention deep link (alert ack/resolve/  │
│                 │ snooze live on /admin/home — not here)      │
│                 │ NO on-screen mutation (render-only by       │
│                 │ construction — CAP-567 Writes = none)       │
│                 │ load state: skeletons                        │
└─────────────────┴───────────────────────────────────────────────┘
```

## Components required

- Health widget (Stats card §11.3 + §11.5 pill/badge health dot) → apps/forum/src/components/ui/card.tsx + apps/forum/src/components/ui/badge.tsx
- Stat cards (sitemap count / coverage errors / thin-indexed / held-indexed) → apps/forum/src/components/ui/card.tsx
- A2 data-viz soft flag (count/trend display; no chart primitive) → MISSING: Charts (A2) does not exist — see PRD/04-design-system/DESIGN-SYSTEM-OPEN-ITEMS.md (contract calls this a soft flag — counts/trends only, no chart required)
- intervention deep link → button/link primitive (apps/forum/src/components/ui/button.tsx)
- §11.9 skeletons → apps/forum/src/components/ui/skeleton.tsx
- §12.4 layout

## States required

*(Enum-backed set. GPT's ~70 transient states — each metric available/unavailable/zero/positive, each indexability-protection sub-state — folded, since the `seoHealth.status` + alert-severity + freshness enums are authoritative.)*

**A. Fresh pull (CAP-483, cron weekly):** GSC pull ("Optional API"); `lastGscPullAt` current; drives M15 health dot.
**B. Stale (CAP-484, System):** → `adminInterventionAlerts` write. Predicates: coverageErrorCount > 0 · **thinIndexedCount > 0** · **heldIndexedCount > 0** (fields exist as of E3).
**C. Never-pulled / GSC not connected** ("Optional API") — render state unspecified (Open Question); absence must **not** be represented as healthy zeroes.
**D. Alert-predicate states:** coverage errors > 0 · thin indexed > 0 · held indexed > 0 (last two now field-backed, E3 CLOSED).
**E. Sitemap render:** `sitemapUrlCount` + `lastSitemapBuildAt` (fed by CAP-473's ISR-3600s sitemap, off-screen); non-indexable/held/draft/private records excluded from sitemap (CAP-466/467).
**F. Unavailable metric** rendered as **"—"**, not zero.

## Component library maturity note

⚠️ badge.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ skeleton.tsx has zero production usage — expect possible integration friction, report don't silently patch.

Production-proven (no warning): card.tsx, button.tsx.
