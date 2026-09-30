---
id: S00-T03-BUILD
type: BUILD
author-model: GLM 5.3
tool: zcode
round: 1
status: DONE
date: 2026-09-30
---

# S00-T03 — Utilities — build report

Branch `s00-t03-utilities` (from `011-Akilesh-Redesign` @ `b6e2846`, i.e. post-T02-merge).
Scope: exactly the §12 S00-T03 row + its referenced sections (§5.2–§5.5). No `convex/` change,
no new dependency. No existing surface changed (utilities are additive; nothing consumes them
outside `/lab`).

## What changed

| File | Change |
|---|---|
| `packages/design-tokens/utilities.css` | **Appended** (the T01-moved block untouched, per the T01 review note): `.glow-cta`, `.glow-active`, `.focus-ring` (`:focus-visible` only), `.glow-celebrate` (one-shot 600 ms keyframe), `.pulse-live` (2000 ms pulse, base glow kept as static value), `.glass-chrome`, `.glass-strong`, safe-area helpers `.pt-safe/.pb-safe/.pl-safe/.pr-safe`; plus `/lab` demo scaffolding (`.lab-glass-backdrop`, `.lab-glass-underlay` — dev-page-only styles). |
| `apps/forum/src/app/(app)/lab/page.tsx`, `lab/utilities/page.tsx` + `utilities-client.tsx` | **New** `/lab` canvas + the utilities demo. Dev-only guard (T15's pattern, landed here first per the T03 row): `notFound()` when `NODE_ENV === "production"`. |
| `scripts/t03-evidence.mjs` | Evidence harness (screenshots + computed-style assertions). |
| `ak-redesign/specs/S00-evidence/T03/` | 6 PNGs + assertions output. |

**Engineering note — cascade:** the `@supports not (backdrop-filter…)` and both
`prefers-reduced-*` fallbacks are **nested inside each `@utility`** so they share the utility's
rule and can never lose the cascade. Standalone override blocks compile into an earlier cascade
layer than `@utility` output (verified live: the glass background fallback silently lost) —
nesting is the fix, and it is the pattern T05+ should keep for any utility with fallbacks.

## Acceptance proof (spec §12 row S00-T03)

**"Demo shows each utility in both themes"** — `/lab/utilities` renders every utility twice per
row: a **forced-dark panel** (nested `.dark` scope) beside a **page-theme panel**, so both themes
are visible simultaneously; the page carries a **theme toggle** (header button, flips
`resolvedTheme`). Evidence: `utilities-dark-390.png`, `utilities-dark-1440.png`,
`utilities-light-390.png`, `utilities-light-1440.png` (page theme dark + light; each screenshot
contains both panels). Glow is dark-only by design (D-007) — in the light panel only
`.focus-ring`'s solid ring shows; the page copy states this.

**"Toggling OS reduced-motion stops pulse/celebrate"** — emulated
(`page.emulateMedia({ reducedMotion: "reduce" })`), asserted from computed style, captured:
```
utilities-reduced-motion-390.png {"pulseAnimation":"none","pulseStaticGlow":"rgba(13, 162, 231, 0.2) 0px 0px 10px 0px"}
  [✓] reduced-motion: .pulse-live animation=none, static glow="rgba(13, 162, 231, 0.2) 0px 0px 10px 0px…"
```
(animation off AND the static base glow stays — §5.2's "static glow may stay").

**"Reduced-transparency makes glass solid"** — emulated and captured:
```
utilities-reduced-transparency-390.png {"chromeBackdrop":"none","chromeBg":"rgb(18, 18, 18)"}
  [✓] reduced-transparency: .glass-chrome backdrop=none, bg="rgb(18, 18, 18)" (opaque solid)
```
Fully opaque `bg-surface` and no blur. *Method note:* Playwright's
`emulateMedia({ reducedTransparency })` does not wire through on this Edge build (the media query
never matches — verified `matchMedia` false); the harness drives the raw CDP
`Emulation.setEmulatedMedia` feature, which matches the real query and exercises the real CSS
path.

**Phone on the same Wi-Fi** — dev server bound with `next dev -H 0.0.0.0`; LAN URL:
**http://10.6.20.174:3000/lab/utilities** (verified 200 over the LAN interface from this
machine; open it on any phone on the same network).

**Safe-area helpers** — demoed with a dashed safe-boundary box + computed `env()` readout
(0px on non-notched viewports; resolves per device).

## Gate (this branch)

typecheck ✅ · lint ✅ · forum tests 975/975 ✅ · convex tests 105/105 ✅ · cap-coverage 572/572 ✅ ·
no `convex/` files touched ✅

## Reproduce

```bash
cd apps/forum && node node_modules/next/dist/bin/next dev -H 0.0.0.0   # LAN bind
node scripts/t03-evidence.mjs                                            # evidence + assertions
```
