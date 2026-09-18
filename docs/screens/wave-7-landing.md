---
# Landing Page

**Route:** `/` (anonymous)
**Status:** NOT STARTED — live `/` redirects to `/feed` (PRD/app/apps/forum/src/app/page.tsx: `redirect("/feed")`, also declared in `next.config.mjs` `redirects()`), which is NOT the spec's anon landing page
**Route drift:** live root is a hard redirect to `/feed`; the spec's anonymous §12.3 landing layout has no build at all. Authenticated `/` remains Feed/Home (Wave 6) per contract §1 — the anon/mode-split at `/` is unbuilt.
**Contract:** PRD/02-contracts/wave-7/CONTRACT-7-landing-FINAL.md
**Slice(s):** P7T-12 (waitlist CTA delegates to CAP-014 — F-14 close; CAP-464/465 UTM + three-mode CTA render are P2-08 scope, consumed not rebuilt)

## Layout

```
┌─ §12.3 Landing layout (its own archetype — NOT §12.1 app-shell) ┐
│ (no Top Header / sidebars / tab bar bound by any CAP)            │
│ providers still mount: ErrorBoundary → CMP slot → BetaBanner →   │
│   children (CAP-025 tree)                                         │
│ ┌─────────────────────────────────────────────────────────────┐  │
│ │ Wordmark (§10.2)                       [Pill: Beta label]   │  │
│ │                                                              │  │
│ │ hero / single CTA set (never dual CTAs):                     │  │
│ │   mode open    → primary Button "Join public beta"           │  │
│ │   mode waitlist→ email capture only (no L08 signup_completed)│  │
│ │   mode closed  → no capture                                  │  │
│ │   (readiness-closed may override config-open server-side —   │  │
│ │    distinct state)                                           │  │
│ │ secondary: Explore free resources (→ /resources)             │  │
│ │ tertiary:  Discussions (→ feed, Hot = anonymous default)     │  │
│ │                                                              │  │
│ │ UTM states: valid (canonical URL strips UTMs) ·              │  │
│ │   unknown params → utmValidated=false · no UTMs              │  │
│ └─────────────────────────────────────────────────────────────┘  │
│   load state: Skeleton · error state: §11.8                      │
└───────────────────────────────────────────────────────────────────┘
```

## Components required

- §12.3 Landing layout — archetype/layout, not a library component
- §11.1 Buttons (primary/secondary/tertiary CTA hierarchy — single CTA set, never dual) → apps/forum/src/components/ui/button.tsx
- §11.5 Pill (Beta label) → apps/forum/src/components/ui/badge.tsx
- Wordmark §10.2 → nearest: apps/forum/src/components/ui/createconomy-logo-mark.tsx (logo mark only — no full wordmark/header pattern confirmed)
- §11.8 Error → MISSING: error component (§11.8) does not exist in the library (nearest stand-in: banner.tsx)
- §11.9 Skeleton → apps/forum/src/components/ui/skeleton.tsx
- CMP banner available (mounts in the CAP-025 slot) → apps/forum/src/components/ui/banner.tsx (the CMP banner itself is the wave-7-cmp screen; BetaBanner is ungoverned — Wave-1 OPEN-DECISIONS E1, still open)

Contract archetype gap: no formal signup-mode CTA switch or UTM-degraded landing state in §11.

## States required

*(Enum-backed set. GPT's ~40 transient states — each UTM sub-branch, each chrome-absent assertion — folded, since the `signup.mode` (3) + UTM-validity states are authoritative.)*

**A. signup-mode CTA set (CAP-464/478 — three modes):** **open** → primary "Join public beta" (email-verified account) · **waitlist** → email capture only (**no L08 signup_completed**) · **closed** → **no capture**. Always: Beta label · secondary Explore free resources (→ /resources) · tertiary Discussions (→ feed, Hot = anonymous default). Readiness-closed may override config-open server-side (distinct state).
**B. UTM state (CAP-465):** valid params (validated vs dictionary; **first-touch stored once**; canonical URL strips UTMs; emits M16 observational event) · unknown params → `utmValidated=false` · no UTMs. **referrer is the ONE non-backfillable field.**

## Component library maturity note

⚠️ badge.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ banner.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ skeleton.tsx has zero production usage — expect possible integration friction, report don't silently patch.

Production-proven (no warning): button.tsx.
