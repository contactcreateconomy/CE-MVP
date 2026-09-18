---
# Repeat-Infringer Policy

**Status (2026-09-18 screen audit correction):** LIVE. **Fixed (this pass):** added `generateMetadata`/noindex while the doc is unpublished, matching the Wave-1 legal-family convention (was missing entirely). **Open, not fixed this pass:** no aggregate-statistics UI (E3 CLOSED state — "N repeat infringers actioned this period") exists yet; the page renders under the full app shell rather than the contract's wordmark-only 720px reading-column layout — flagged in CHANGELOG for follow-up.


**Route:** `/repeat-infringer`
**Status:** NOT STARTED (no route directory exists in the app tree)
**Contract:** PRD/02-contracts/wave-7/CONTRACT-7-repeat-infringer-FINAL.md
**Slice(s):** P7T-08 (public policy page; CAP-338 evaluate cron is P7T-09, off-screen)

## Layout

```
┌─ static content page — Wave-1 legal-pages family ────────────┐
│ Wordmark-only header (§10.2, pattern-extended; flagged)       │
│ (no app-shell chrome; no ConsentProvider)                     │
│ ┌─ 720px reading column (§4.3) ─────────────────────────────┐ │
│ │ A. repeat-infringer policy text                            │ │
│ │    (3 valid copyright strikes / 12 months → TERMINATED;    │ │
│ │     retroactive voiding)                                   │ │
│ │ B. aggregate statistics (precomputed counts only —         │ │
│ │    "N repeat infringers actioned this period"; no          │ │
│ │    identities, no per-user data)                           │ │
│ │ D. provenance/version block (policy version metadata)      │ │
│ │ footer links                                               │ │
│ └────────────────────────────────────────────────────────────┘ │
│   load state: Skeleton · error state: §11.8                   │
└───────────────────────────────────────────────────────────────┘
```

P7T-08 ships `unavailable_pending_legal` + fail-closed noindex until F-16 (content source unowned) — same shell treatment as P2-07's `/privacy` `/dmca` `/terms`.

## Components required

- 720px reading column (§4.3) — layout, not a component
- Wordmark-only header (§10.2) → nearest: apps/forum/src/components/ui/createconomy-logo-mark.tsx (logo mark only — no header pattern component; contract flags the Wordmark-header pattern as pattern-inference, not a register citation)
- provenance/version block → MISSING: provenance/version block does not exist in the library
- footer links → plain links (no library component)
- §11.9 Skeleton → apps/forum/src/components/ui/skeleton.tsx
- §11.8 Error → MISSING: error component (§11.8) does not exist in the library (nearest stand-in: banner.tsx)

## States required

**A. Static policy render** — the repeat-infringer policy text (CAP-338 policy: 3 valid copyright strikes / 12 months → TERMINATED; retroactive voiding).
**B. Aggregate-statistics state (E3 CLOSED 2026-08-25):** renders precomputed aggregate counts only — "N repeat infringers actioned this period" (a count, no identities). No per-user strike detail, no user identities, no case specifics. Firewall discipline consistent with CAP-394 (sealed economy keys) and Wave 5A's E-H (genome public-safe allowlist) — per-user moderation data never surfaces on an unauthenticated public route.
**C. Terminated-count state:** folded into B — the RI-termination count IS the aggregate B renders.
**D. Provenance/version:** policy version + provenance metadata (available/missing).

## Component library maturity note

⚠️ skeleton.tsx has zero production usage — expect possible integration friction, report don't silently patch.

No production-proven library components cited on this screen (render-only static page).
