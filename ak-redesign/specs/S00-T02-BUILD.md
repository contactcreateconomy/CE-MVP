---
id: S00-T02-BUILD
type: BUILD
author-model: GLM 5.3
tool: zcode
round: 1
status: DONE
date: 2026-09-29
---

# S00-T02 — New tokens + STYLE-KIT — build report

Branch `s00-t02-new-tokens` (from `011-Akilesh-Redesign` @ `2f3a13f`, i.e. post-T01-merge).
Scope: exactly the §12 S00-T02 row + its referenced sections (§5.2–§5.6, D-007). No `convex/`
change, no new dependency. **No visual change** (proved two ways below).

## What changed

| File | Change |
|---|---|
| `packages/design-tokens/tokens.css` | **+49 declaration lines** — §5.2 glow renames with legacy names kept as aliases until T05 (`--glow-cta`←primary-md, `--glow-active`←primary-sm, `--glow-focus`←primary-border, `--glow-celebrate`←primary-lg, `--glow-live`, `--glow-track`); §5.3 glass (`--glass-subtle-bg` 78% light / 72% dark, `--glass-subtle-blur` 12px saturate(150%), `--glass-strong-bg` 55%, `--glass-strong-blur` 24px, `--glass-border` border/subtle 60%); §5.4 sheet (`--sheet-radius` = radius/xl, `--sheet-max-h` 90dvh, `--sheet-handle-w/h` 36×4, `--scrim` 25% light / 40% dark); §5.5 safe-area + chrome (`--safe-top/bottom/left/right` env insets, `--tabbar-h` 56px, `--topbar-h` 48px, `--theme-color-light/dark` = the bg-canvas literals); §5.6 state kit (`--skeleton-base`/`--skeleton-shine` resolving the existing surfaces — no new colours). |
| `docs/04-design-system/STYLE-KIT.md` | §2.2 rewritten to the D-007 guardrails (purpose table with new↔legacy names and the ONLY-utility rule), the five removed glow families **struck with date** (primary-text, primary-pill/-hover, primary-card-hover, primary-halo), and two new sections: §2.2a Glass, §2.2b Sheet/safe-area/app-chrome/state — every token documented with dark + light values. |
| `scripts/t01-visual-diff.mjs` | Takes an evidence-directory argument (T02 uses `specs/S00-evidence/T02/`; T01's committed evidence stays untouched). |
| `scripts/t02-css-identity.mjs` | New compiled-CSS identity harness (Grok's T01 method, generalized). |
| `ak-redesign/specs/S00-evidence/T02/` | 16 PNGs + before/after sha256 manifests. |

Note: `--radius-xl` (16px) already existed in `tokens.css` — the kit's radius/xl — so
`--sheet-radius: var(--radius-xl)` needed no new mint. `--glow-focus` carries the spec's light
value (solid `0 0 0 2px` ring) while the legacy `--glow-primary-border` keeps `none` in light;
nothing consumes either new name before T03/T05, which is what keeps this task visually inert.

## Acceptance proof (spec §12 row S00-T02)

**"STYLE-KIT documents every new token with dark/light values"** — §2.2 table (glow, with light
column), §2.2a (glass dark vs light), §2.2b (sheet/safe-area/chrome/state with values); removed
tokens struck with the S00-T02 date. **"No visual change yet"** — two proofs:

**1. Compiled-CSS identity** (`node scripts/t02-css-identity.mjs 2f3a13f`, Grok's T01 method —
`@tailwindcss/postcss` on each app's globals.css, T01-tree archive vs working tree):

```
forum: 6,461 → 6,510 lines · admin: 6,461 → 6,507 lines
added lines: 37 token declarations + 2 @supports-wrapper lines each
removed lines: 0 (both apps)
```
The only additions are the new custom-property declarations plus Tailwind's auto-generated
`@supports (color: color-mix(…))` fallback wrappers around the three color-mix glass tokens —
additive only, no removed or changed rules anywhere.

**2. Screenshot identity** (`node scripts/t01-visual-diff.mjs before|after|compare
ak-redesign/specs/S00-evidence/T02` — same method as T01: forum `/feed` + admin console ×
390/1440 × dark/light, sha256 of PNG bytes):

```
  [✓] admin-1440-dark / admin-1440-light / admin-390-dark / admin-390-light: identical
  [✓] forum-1440-dark / forum-1440-light / forum-390-dark / forum-390-light: identical
all 8 views BYTE-IDENTICAL (pixel-identical) before → after.
```

(One earlier standalone BEFORE shot of `forum-1440-light` rendered a one-off different frame —
the same transient class T01 met; fresh paired before/after captures are byte-identical, and
T01's committed evidence was restored untouched after the harness initially reused its folder —
the harness now takes an explicit evidence dir.)

**Guard test still green** (tokens live only in the package), admin globals still 9 lines.

## Gate (this branch)

typecheck ✅ · lint ✅ · forum tests 975/975 ✅ · convex tests 105/105 ✅ · cap-coverage 572/572 ✅ ·
no `convex/` files touched ✅

## Reproduce

```bash
node scripts/t02-css-identity.mjs 2f3a13f     # compiled-CSS: additive tokens only
node scripts/t01-visual-diff.mjs before  ak-redesign/specs/S00-evidence/T02
node scripts/t01-visual-diff.mjs after   ak-redesign/specs/S00-evidence/T02
node scripts/t01-visual-diff.mjs compare ak-redesign/specs/S00-evidence/T02
```
