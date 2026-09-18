---
# Admin Shell + Command Palette

**Status (2026-09-18 screen audit correction):** LIVE (nav, search, command palette, env badge, role badge, Wiki link, profile menu all present). **Open, not fixed this pass:** no alert-count badge or live operational-mode indicator (hardcoded "normal"); no admin-app noindex metadata; CAP-392 per-route widget gating isn't enforced server-side (a direct URL to a page file still renders even if hidden from nav) — flagged in CHANGELOG.


**Route:** `/admin` (+ nested widget routes)
**Status:** NOT STARTED (no `app/admin/` tree exists)
**Contract:** PRD/02-contracts/wave-7/CONTRACT-7-admin-shell-FINAL.md
**Slice(s):** P3-02 (shell chrome + A11 command palette — Phase 3). Prerequisites from the same phase: P3-01 (two-layer authz foundation), P3-03 (adminWidgets catalog + deploy seeder).

## Layout

STYLE-KIT §12.4 admin layout: 48px header, 220px sidebar, dense content area.

```
┌─ 48px header ─────────────────────────────────────────────────┐
│ [env badge] [role badge] [search] [command palette ⌘K]        │
│ [alert count] [operational-mode indicator] [Wiki] [profile]   │
├─ 220px sidebar ─┬─ dense content area ────────────────────────┤
│ widget nav      │ /admin            → shell (this screen)     │
│ (filtered by    │ /admin/* widget routes render here, gated   │
│  required-      │   by CAP-392 R-REGISTRY / R-AUTHZ           │
│  PermissionKeys)│ hidden/unregistered route → FEATURE_DISABLED │
│                 │   / NOT_FOUND (never resolve on URL         │
│                 │   knowledge); flag false → fail-closed      │
└─────────────────┴──────────────────────────────────────────────┘
```

Chrome list (CAP-390, verbatim): env badge · role · search · command palette · alert count · operational-mode indicator · Wiki · profile.

## Components required

- §12.4 admin layout → no library layout component; build the 48px/220px shell per STYLE-KIT §12.4
- §11.4 nav / §12.1 Top Header → no dedicated nav component in the library (compose from primitives)
- §11.5 pills/badges (env, role, alert count) → apps/forum/src/components/ui/badge.tsx
- §11.9 skeleton / error boundary → apps/forum/src/components/ui/skeleton.tsx (error boundary: MISSING — no error-boundary component in the library)
- A11 Command palette → apps/forum/src/components/ui/command-palette.tsx (contract flags A11 as an inventory-§3 ARCHETYPE GAP and §11 defines none — the library file exists but has zero production usage; palette results draw only from `adminWidgets` reads)

## States required

*(Enum-backed set. GPT's ~45 transient states — each role active/inactive, each route sub-state — folded, since the role enum + route-resolution outcomes + revoke enforcement are authoritative.)*

**A. Staff session** — any staff role (E2): full chrome + widget catalog **filtered by `requiredPermissionKeys[]`** — a support_operator sees only support widgets; an Editor sees only editorial ones. Chrome renders the actor's own role badge.
**B. ~~Non-administrator staff session — UNOWNED (E2):~~** **E2 CLOSED 2026-08-26:** CAP-390 admits any staff role; CAP-392 admits per-widget by permission keys; narrow per-action authority stays on each screen's own rows.
**C. Widget-route states (CAP-392):** registered+permitted → render · hidden/unregistered → **FEATURE_DISABLED/NOT_FOUND** · flag false → fail-closed · metadata-present-but-executable-absent (fallback, no invented route).
**D. Mid-session revoke (CAP-430):** enforced on NEXT server request.
**E. Operational-mode chrome:** normal / degraded / STOP-active — ⚠️ no binding row to the stop flag/incident state → Open Question.
**F. Command palette:** closed / open / authorized-results / no-match / unauthorized-excluded / back-door-genome-excluded.

## Component library maturity note

⚠️ badge.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ skeleton.tsx has zero production usage — expect possible integration friction, report don't silently patch.
⚠️ command-palette.tsx has zero production usage — expect possible integration friction, report don't silently patch.

No production-proven library components cited beyond primitives (chrome is layout + pills).
