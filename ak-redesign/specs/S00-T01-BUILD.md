---
id: S00-T01-BUILD
type: BUILD
author-model: GLM 5.3
tool: zcode
round: 1
status: DONE
date: 2026-09-29
---

# S00-T01 — Token single source — build report

Branch `s00-t01-token-single-source` (from `011-Akilesh-Redesign` @ `98cce0d`, i.e. post-PR-#13).
Scope: exactly the §12 S00-T01 row + its referenced sections (§5.1, CS §1). No `convex/` change, no
new dependency, no lockfile change, no visual change.

## What changed

| File | Change |
|---|---|
| `packages/design-tokens/tokens.css` | **New** — 512 lines: the `@theme inline` + `:root` + `.dark` blocks, moved **verbatim** from `apps/forum/src/app/globals.css` L5–509 (the two apps' 1,073-line files differed only on L522). |
| `packages/design-tokens/utilities.css` | **New** — 571 lines: the shared base/component/keyframe/`@utility` rules (forum L510–1073) moved verbatim, with one deliberate exception: the `main { @apply … }` rule ships as `min-h-0` (the admin value). |
| `apps/forum/src/app/globals.css` | 1,073 → **13 lines**: tailwind import, `@source`, the two package `@import`s, and the forum-local override `main { @apply min-h-screen; }` (the L522 difference, now app-local per CS §1's ruling). |
| `apps/admin/src/app/globals.css` | 1,073 → **9 lines**: imports only (admin keeps the shared `min-h-0`). |
| `apps/forum/src/lib/__tests__/token-single-source.test.ts` | **New** guard test (spec §5.1): fails if either app globals declares `--color-*`/`--bg-*`/`--text-*`/`--glow-*`/`--glass-*`/`--shadow-*`/`--space-*`/`--radius-*`/`--duration-*`/`--ease-*`; also asserts both apps `@import` the package and admin stays < 100 lines. |
| `scripts/t01-visual-diff.mjs` | Evidence harness (below). |
| `ak-redesign/specs/S00-evidence/T01/` | 16 PNGs + before/after sha256 manifests. |

**Interpretation note (flagged for review):** spec §4 row 1 describes `tokens.css` as the token
blocks and reserves `utilities.css` for §5's new utilities (T02/T03). The §12 acceptance
"admin `globals.css` < 100 lines" is only achievable if the ~560 lines of *shared non-token rules*
also leave the app files, and CS §1's ruling says "a `packages/` stylesheet" for the shared source.
I put them in `utilities.css` (their natural home; T03 extends that file) rather than inventing a
third file. No rule text was altered — everything is byte-verbatim except the documented `main`
exception.

## Acceptance proof (spec §12 row S00-T01)

**Forum + admin render pixel-identical to before at 390 + 1440, both themes.**
`node scripts/t01-visual-diff.mjs before|after|compare` — captures forum `/feed` and the admin
console at 390/1440 in dark/light (localStorage `theme`, CMP banner dismissed, dev-tools badge
hidden), 3.5 s settle, and compares **sha256 of the PNG bytes** (byte-identical ⇒ pixel-identical;
stricter than pixel-diff). Result on this machine:

```
  [✓] admin-1440-dark.png: identical (4afd9390ce95…)
  [✓] admin-1440-light.png: identical (651e54efc03c…)
  [✓] admin-390-dark.png: identical (326d5c7869f1…)
  [✓] admin-390-light.png: identical (2b1a831d6c69…)
  [✓] forum-1440-dark.png: identical (107e2a9030b5…)
  [✓] forum-1440-light.png: identical (f0659b0868c9…)
  [✓] forum-390-dark.png: identical (f132aa69168a…)
  [✓] forum-390-light.png: identical (80e428986e8b…)
all 8 views BYTE-IDENTICAL (pixel-identical) before → after.
```

(One earlier `after` run had a single transient diff on `forum-1440-light` — a re-render timing
artifact, gone on the immediate re-capture; all other views were identical on the first try.)

**Admin `globals.css` < 100 lines:** forum = 13 lines, admin = **9 lines** (enforced by the test).

**Test green:** `token-single-source.test.ts` (3 cases) passes in `pnpm test:run`; typecheck,
lint, forum suite, convex suite, cap-coverage all green (see gate below).

## Gate (this branch)

typecheck ✅ · lint ✅ · forum tests **975/975** (972 + 3 new) ✅ · convex tests 105/105 ✅ ·
cap-coverage **572/572** ✅ · no `convex/` files touched (`git diff --name-only 98cce0d..HEAD`
lists only `apps/*/src/app/globals.css`, `packages/design-tokens/*`, the test, the harness, and
this report) ✅

## Reproduce

```bash
node scripts/local-setup.mjs                 # first time on a machine
DEV_TEST_USER_PASSWORD='<pw>' pnpm reset:local
pnpm dev & pnpm dev:admin                    # both apps up
node scripts/t01-visual-diff.mjs before      # on the pre-change tree
git checkout s00-t01-token-single-source     # the change
node scripts/t01-visual-diff.mjs after
node scripts/t01-visual-diff.mjs compare     # expects: all 8 byte-identical
```
