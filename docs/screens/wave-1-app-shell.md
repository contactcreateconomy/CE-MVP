# App Shell / Providers

**Route:** `(root layout)` — wraps the entire customer route tree; not independently addressable
**Status:** LIVE — `PRD/app/apps/forum/src/app/(app)/layout.tsx` (providers under `PRD/app/apps/forum/src/providers/`: `convex-provider.tsx`, `forum-profile-ensurer.tsx`, `navigation-progress-provider.tsx`, `shared-data-context.tsx`, `theme-provider.tsx`)
**Contract:** PRD/02-contracts/wave-1/CONTRACT-1-app-shell-FINAL.md
**Slice(s):** SLICE-P2-06 (provider chain + Platform-Wide Routing Convention + CMP reserved slot + BetaBanner stub)

## Layout

Derived from contract §6 (Components Used) only:

```
┌─ Provider chain — mount order IS the contract (CAP-025, FATAL-M1C-01) ─────────┐
│ ConvexAuthNextjsServerProvider → ConvexAuthNextjsProvider → ErrorBoundary      │
│   → CMP slot (M18, reserved) → BetaBanner → children                            │
│   (ErrorBoundary sits ABOVE the CMP slot — FATAL-M1C-03)                        │
└─────────────────────────────────────────────────────────────────────────────────┘

Desktop (§12.1):                               Mobile (§12.2):
┌─────────────────────────────────┐            ┌──────────────────┐
│ Top Header — 56px fixed         │            │ Header — 48px    │
│ (logo Mark 24px, §10/§11.4)     │            ├──────────────────┤
├─────────┬─────────────────┬─────┤            │ Children         │
│ Left    │                 │Right│            ├──────────────────┤
│ Sidebar │   Children      │Side-│            │ Bottom Tab Bar   │
│ 240px / │   (routes)      │bar  │            │ 64px             │
│ 64px    │                 │320px│            └──────────────────┘
│ collapse│                 │     │
└─────────┴─────────────────┴─────┘
Nav Item states (§11.4): Default / Hover / Active
```

Contract caveats carried into layout: whether Top Header / Left+Right Sidebar / Bottom Tab Bar render on every child route or only post-auth is **unspecified** (contract Open Question 4). Legal routes (`/privacy`, `/dmca`, `/terms`) render **outside the ConsentProvider subtree**. PostHog is never mounted in root.

## Components required

- Logo Mark (24px, header, §10/§11.4) → `PRD/app/apps/forum/src/components/ui/createconomy-logo-mark.tsx` (exists; Mark only — see MISSING below for full lockup)
- BetaBanner mount (contract flags: no §11 BetaBanner component exists; content/copy/dismissibility ungoverned — ESCALATION E1; SLICE-P2-06 ships a render-nothing stub) → nearest library host: `PRD/app/apps/forum/src/components/ui/banner.tsx`
  - ⚠️ banner has zero production usage — expect possible integration friction, report don't silently patch.
- MISSING: ErrorBoundary fallback UI does not exist in the library (contract archetype gap — §11 has no ErrorBoundary fallback pattern; fallback UI unspecified, contract Open Question 3)
- MISSING: CMP slot / consent-banner component does not exist in the library (contract archetype gap — the CMP surface itself is CAP-504–506, Wave 7; SLICE-P2-06 reserves an empty slot only)
- MISSING: Navigation chrome (Top Header, Left Sidebar, Right Sidebar, Bottom Tab Bar, Nav Item) does not exist in the library as components — must be composed; §11.4 defines the pattern but no library primitive matches. (Note: `navigation-progress-bar.tsx` exists in the library and a `navigation-progress-provider.tsx` is live in the shell, but that is a route-progress strip, not nav chrome, and is not contract-required.)

## States required

(Copied verbatim from CONTRACT-1-app-shell-FINAL.md §3)

1. **Normal mount** — full provider chain live; children render beneath `BetaBanner` (CAP-025).
2. **Render-error caught** — `ErrorBoundary` fallback fires; because it sits above the CMP slot, a downstream (CMP) crash is contained (CAP-026). Fallback UI is unspecified (Open Questions).
3. **CMP runtime-crash / degrade** — a **designed degrade, not a bug:** app stays up, analytics denied, legal pages still reachable (CAP-028, exact register language).
4. **Soft-beta chrome present** — `BetaBanner` is mounted in the CAP-025 chain. ⚠️ Included as a condition, not a governed state: no CAP defines its visibility/dismissal (Open Questions + ESCALATION E1).

## Component library maturity note

- ⚠️ banner has zero production usage — expect possible integration friction, report don't silently patch.
- createconomy-logo-mark.tsx is outside both the zero-production and production-proven lists — no warning supplied by the live-status map.
- Production-proven components (button, card, avatar, toast) are not required by this screen's contract.
