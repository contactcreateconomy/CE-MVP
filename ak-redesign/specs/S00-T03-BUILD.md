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

## Fix round 1 (S00-T03-REVIEW 16db502, BLOCK — applied same session)

**Blocker — glass does not blur.** Root cause per the review: the blur tokens were not filter
functions. THREE coordinated fixes:

1. **Tokens** (`tokens.css`): `--glass-subtle-blur: 12px saturate(150%)` → **`blur(12px) saturate(150%)`**;
   `--glass-strong-blur: 24px` → **`blur(24px)`** (names unchanged, both themes — declared on
   `:root`, inherited by `.dark`). STYLE-KIT §2.2a updated to the exact strings; the kit-vs-tokens
   diff script now covers the glass blur rows too:
   ```
     [✓] glow/cta dark: "0 0 20px hsl(199 89% 48% / 0.35), 0 0 60px hsl(199 89% 48% / 0.15)"
     … (all 6 glow tokens, both themes) …
     [✓] glass/subtle-blur (both themes): "blur(12px) saturate(150%)" (declared :root, inherited by .dark)
     [✓] glass/strong-blur (both themes): "blur(24px)" (declared :root, inherited by .dark)
   0 mismatches — every §2.2 glow value and §2.2a glass blur value is the exact tokens.css string.
   ```
2. **Second, subtler cause found while fixing:** Turbopack's CSS transform (lightningcss)
   **dropped the standard `backdrop-filter` declaration** when it preceded its `-webkit-` twin —
   the served sheet held only `-webkit-backdrop-filter`, so `getComputedStyle().backdropFilter`
   read `none` even with valid tokens. Declaration order in `utilities.css` is now
   `-webkit-backdrop-filter` first, `backdrop-filter` second (the same order Tailwind's own
   `backdrop-blur-*` utilities use, verified in the served CSS). Live computed values after both
   fixes: `.glass-chrome` → `blur(12px) saturate(1.5)`, `.glass-strong` → `blur(24px)`.
3. **Tests that can fail** (`e2e/glass-utilities.spec.ts`, real Chromium against `/lab/utilities`):
   normal → backdrop-filter **not** `none` **and** contains `blur(`; reduced-transparency (raw CDP
   emulation, `matchMedia` asserted true) → backdrop-filter **is** `none` **and** the fill is fully
   opaque. Proven to fail on the old token values (temporarily reverted, run, restored):

   *Old values (reverted) — the normal-state tests catch the bug:*
   ```
   Error: .glass-chrome backdrop-filter must not compute none
   > 44 |       expect(backdrop, `${name} backdrop-filter must not compute none`).not.toBe("none");
   Error: .glass-strong backdrop-filter must not compute none
   2 failed (the two reduced-transparency tests pass either way — exactly the review's point)
   ```
   *Fixed values (restored):*
   ```
   ok  normal: .glass-chrome blurs (backdrop-filter is a real filter)
   ok  normal: .glass-strong blurs (backdrop-filter is a real filter)
   ok  reduced-transparency: .glass-chrome falls back to solid (no blur, opaque fill)
   ok  reduced-transparency: .glass-strong falls back to solid (no blur, opaque fill)
   4 passed (24.2s)
   ```

**Should-fix — demos on neutral elements.** `.glow-cta` and `.focus-ring` demos no longer use the
kit `Button` (its `dark:shadow-glow-primary-sm` / `focus-visible:ring-2` win the cascade); they
are plain styled `span`s. Button itself untouched (T05).

**Visual proof over busy content.** The glass demos now render a sticky glass bar over a
scrollable column of content-like text rows (`.lab-glass-content`), in both theme panels — the
blur is clearly visible at 390 in `utilities-dark-390.png` and `utilities-light-390.png`
(evidence refreshed after all fixes; reduced-motion/reduced-transparency assertions re-verified).

**Phone / LAN:** unchanged — dev server bound `-H 0.0.0.0`, **http://10.6.20.174:3000/lab/utilities**
(verified 200 over the LAN interface).
