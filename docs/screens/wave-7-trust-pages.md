---
# Trust & Policy Pages

**Route:** `/how-we-review` · `/editorial-policy` · `/ai-disclosure` · `/about` · `/help` · `/how-we-use-your-store-data` (six anonymous routes, one shared template — NOT six independent contracts)
**Status:** NOT STARTED (none of the six route directories exist in the app tree)
**Contract:** PRD/02-contracts/wave-7/CONTRACT-7-trust-pages-FINAL.md
**Slice(s):** P7T-10 (six destination routes). P7T-11 (provenance + AI-disclosure footers) attaches to indexable host pages, not to these routes.

## Layout

```
┌─ static content + provenance template (one shared, six routes) ┐
│ Wordmark-only header (pattern-class, flagged)                 │
│ (no App-Shell member-only behavior; no ConsentProvider —      │
│  CAP-027-pattern carve-out)                                    │
│ ┌─ 720px reading column ────────────────────────────────────┐ │
│ │ route body per state A–E (methodology / editorial          │ │
│ │ standards / AI-disclosure incl. machine-readable marker /  │ │
│ │ about+help content / store-data honesty content)           │ │
│ │ [Pill/label: AI-disclosure machine-readable marker]        │ │
│ │ F. provenance/version block (current version available /   │ │
│ │    missing)                                                │ │
│ │ provenance-footer links                                    │ │
│ └────────────────────────────────────────────────────────────┘ │
│   load state: Skeleton · error state: §11.8                   │
└───────────────────────────────────────────────────────────────┘
```

P7T-10 ships all six as the P2-07 family: 720px · Wordmark-only · no ConsentProvider · `unavailable_pending_legal` + noindex (F-16 fence — content source unowned).

## Components required

- §11.5 Pill/label (AI-disclosure machine-readable marker) → apps/forum/src/components/ui/badge.tsx
- 720px reading column — layout, not a component
- Wordmark-only header → nearest: apps/forum/src/components/ui/createconomy-logo-mark.tsx (logo mark only — no header pattern component; contract flags this as pattern-inference, not a register citation)
- provenance-footer links / provenance block → plain links; MISSING: formally defined provenance block does not exist in the library
- §11.9 Skeleton → apps/forum/src/components/ui/skeleton.tsx
- §11.8 Error → MISSING: error component (§11.8) does not exist in the library (nearest stand-in: banner.tsx)

Contract archetype gaps: no formally defined provenance block, machine-readable disclosure companion, or seller-data-honesty component in §11 — flagged MISSING beyond generic primitives.

## States required

**A. `/how-we-review`:** methodology content backing CAP-468's provenance block (byline · Reviewed by · dates · sources · methodology links).
**B. `/editorial-policy`:** editorial standards (footer destination of CAP-468).
**C. `/ai-disclosure` (CAP-469, FATAL-M17-02):** states the **editorial responsibility holder**; documents visible + machine-readable persona AI labels; **Legal Art. 50 confirm recorded pre-beta** (jurisdiction · surfaces · rationale · reviewer · policy version) — process gate, listed not designed.
**D. `/about` · `/help`:** P0 list members — **E4 CLOSED: owned by CAP-562/563** (CAP-027-pattern static render; content source + publish trigger remain OQ, Wave-1 E5/E6 class).
**E. `/how-we-use-your-store-data` (CAP-262):** public content state + **accepted-as-part-of-application** state (the write lives on /sell/apply; **aggregate-only disclosed** — Traffic/Intent/Confirmed explained; no buyer identity, no exact times, no arbitrary multi-dim filtering; gated by CAP-231).
**F. Provenance/version:** current version available / missing.

## Component library maturity note

⚠️ badge.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ skeleton.tsx has zero production usage — expect possible integration friction, report don't silently patch.

No production-proven library components cited on this screen (static template).
