---
id: S00-CP1-VERDICT
type: VERDICT
author-model: Opus
tool: Claude Code (cloud)
round: 1
status: ACCEPTED
date: 2026-09-30
---

# S00 checkpoint 1 — verdict on T01–T03 (batched, D-003 amendment)

**Inputs:** `S00-T01/T02/T03-BUILD.md`, `S00-T01/T02-REVIEW.md`, `S00-T03-REVIEW.md` + `-R2`, merged diff on
`011-Akilesh-Redesign` (`98cce0d..62bd94f`: T01 `2f3a13f`, T02 `b6e2846`, T03 `62bd94f`), judged against S00-SPEC §5, §12.
**Loop:** T03 used 2 rounds (BLOCK → PASS); T01, T02 one each.

## Decision: ACCEPTED — the foundation holds for T04–T18

One fix applied by Opus (< 20 lines, below). Three spec errata corrected. One process rule added to the templates.

## What holds (checked, not taken from the reports)

- **Single source is real.** Both apps' `globals.css` are import shells (forum 13 lines, admin 9); every token and shared rule lives in `packages/design-tokens/`. Grok's compiled-CSS identity (byte-identical output before/after T01; additive-only for T02) is the right proof and stronger than screenshots.
- **Tokens match the spec and the kit.** Renamed glow set (`--glow-cta/-active/-focus/-celebrate/-live/-track`) with legacy aliases kept until T05; glass, sheet, safe-area, theme-color, skeleton tokens present in both themes; STYLE-KIT §2.2/§2.2a/§2.2b match `tokens.css` exactly (script-checked).
- **Utilities are built the right way for what follows.** Fallbacks (`@supports not`, `prefers-reduced-transparency`, `prefers-reduced-motion`) are **nested inside each `@utility`**, so they can't lose the cascade — T05 and later must keep this pattern. `-webkit-backdrop-filter` before `backdrop-filter` (Turbopack/lightningcss drops the standard one otherwise) — same.
- **`/lab`** exists with a production `notFound()` guard (T15 extends it). Glass e2e (`e2e/glass-utilities.spec.ts`) tests the normal state *and* the fallback.

## What the reviews missed

1. **The T01 guard could not catch most violations** (fixed here). Its regex allowed only 10 prefixes (`--color|bg|text|glow|glass|shadow|space|radius|duration|ease`), so re-declaring `--brand-*`, `--feedback-*`, `--border-*`, `--z-*`, `--cat-*`, `--type-*`, `--container-*` in an app file passed; and `^\s*--` missed a declaration on the same line as `:root {`. Root cause is **my own spec §5.1**, which listed those 10 prefixes — GLM and Grok followed it faithfully. Same failure class as T03: a check that was never shown failing.
2. **Spec errata** (mine; corrected in S00-SPEC): §5.3 blur tokens must be full filter values (`blur(12px) saturate(150%)`, `blur(24px)`) — the spec's "12px + saturate(150%)" caused the T03 blocker; §5.5/§6 named `--bg-base`, which doesn't exist — the builder correctly used `--bg-canvas`.
3. **Lab scaffolding lives in the shared product stylesheet.** `.lab-glass-content` (≈18 lines, `packages/design-tokens/utilities.css` L695+) ships to admin and production and uses an off-kit purple `hsl(280 80% 55%)` and raw px. Harmless now; **T15 must move `.lab-*` rules into the `/lab` route and drop the off-kit colour.**
4. **Not yet enforced (carry forward, not defects):** the "max 2 stacked glass layers" rule has no mechanism → **T08** (sheet sets chrome behind it to solid); `--glass-border` hairline isn't applied by `.glass-chrome` → **T12** adds it on top/tab bar; the "no glow/backdrop outside utilities.css" scan → **T05** as specified.

## Fix applied by Opus (S00-CP1)

`apps/forum/src/lib/__tests__/token-single-source.test.ts` — `TOKEN_DECLARATION` widened to any custom property:
`/(^|[{;])\s*--[\w-]+\s*:/m` (was the 10-prefix, line-start-only regex). 4 lines changed.

**RED/GREEN proof** (probes appended to `apps/forum/src/app/globals.css`, then restored):

| Probe | Old regex | New regex |
|---|---|---|
| `:root { --brand-primary: red; }` (same line) | **passed** (hole) | **fails** ✓ |
| `:root {` ↵ `--feedback-error: red;` ↵ `}` | passed (prefix not listed) | **fails** ✓ |
| `@theme inline { --z-modal: 9; }` | passed | **fails** ✓ |
| real tree | 3/3 pass | **3/3 pass** ✓ |

eslint clean on the file.

## The T03 lesson — ruling: YES, make it a rule

The first glass test asserted `backdrop-filter: none` under reduced transparency — true whether or not the fallback worked, because the broken token already computed `none`. The T01 guard had the same flaw at a different layer. Two of three tasks shipped a check that could only pass; one was caught by Grok, one by nobody until now. So:

- **`templates/BUILD.md`:** every automated acceptance check shows a **RED run on a deliberately broken version** (and how it was broken) plus a GREEN run; pattern/regex guards are probed with several violation shapes; a check with no RED run counts as missing; "can-only-pass" assertions must be paired with a normal-state assertion.
- **`templates/REVIEW.md`:** reviewer confirms a RED run exists for every acceptance check, breaks it once themselves if not; a check that cannot fail = BLOCK; regex guards probed for evasion.
- **`templates/SPEC.md` §8:** every automated check named in a spec must be writable with an obvious failing case.
Applies from **S00-T04** on. T04 (fixtures-import scan), T05 (glow/backdrop scan), T14 (COPY-1 scan) are exactly the kind of regex guards this catches.

## Next
T04 → T12 proceed on Grok PASS; next batched VERDICT after **T12**.
