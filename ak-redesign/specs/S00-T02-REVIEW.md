---
id: S00-T02-REVIEW
type: REVIEW
author-model: Grok
tool: Cursor
round: 1
status: ACTIVE
date: 2026-09-29
---

# S00-T02 review — new tokens

Compared `2f3a13f..c5bc71c` to S00-SPEC §12 S00-T02 and §5.2–§5.6, and to `S00-T02-BUILD.md`. Did not trust the build report. HEAD `e968795` is a session-log commit on top of `c5bc71c`; product files match `c5bc71c`.

## Verdict: PASS WITH FIXES

Visually inert, main rules intact, T01 evidence untouched. One documentation fix.

## SHOULD-FIX

`docs/04-design-system/STYLE-KIT.md` §2.2 (lines 61–66) does not record the dark glow values that `packages/design-tokens/tokens.css` declares. The rewrite replaced the old full strings with abbreviations, and the focus row invents a word the CSS does not have.

| Token | tokens.css (`.dark`) | STYLE-KIT dark column |
|---|---|---|
| `--glow-cta` | `0 0 20px hsl(199 89% 48% / 0.35), 0 0 60px hsl(199 89% 48% / 0.15)` | `0 0 20px /0.35, 0 0 60px /0.15` |
| `--glow-focus` | `0 0 0 1px hsl(199 89% 48%), 0 0 15px hsl(199 89% 48% / 0.25)` | `0 0 0 1px solid + 0 0 15px /0.25` |
| `--glow-celebrate` | `0 0 30px hsl(199 89% 48% / 0.4), 0 0 80px hsl(199 89% 48% / 0.2)` | `0 0 30px /0.40, 0 0 80px /0.20` |
| `--glow-track` | `0 0 6px hsl(199 89% 48% / 0.5), 0 0 14px hsl(199 89% 48% / 0.2)` | `0 0 6px /0.5, 0 0 14px /0.2` |

`--glow-active` is the only dark row that still includes `hsl(199 89% 48%)`. Light values match (`none`, and focus `0 0 0 2px hsl(199 89% 48%)`). Paste the `.dark` strings into the dark column. Drop "solid".

## What holds

**Additive CSS.** Compiled each app's `globals.css` with `@tailwindcss/postcss`, tree `2f3a13f` against the working tree, `from` set to that app's globals so imports resolve. Sequence diff: forum 6464 → 6510 lines, admin 6461 → 6507, 46 insertions, 0 removals, shared lines stay in order. Insertions are the new custom properties plus Tailwind's `color-mix` fallback (`--glass-*-bg` / `--glass-border` fall back to the source variable, then `@supports (color: color-mix(in lab, red, red))` restores the mix). Four `@supports` blocks, not the two the report counts. Nothing else moved. The report's "removed lines: 0" is right; the wrapper count is not.

**Legacy aliases.** Every `--glow-primary-*` declaration in the compiled CSS is unchanged: 42 lines before, 42 after, same text, both apps. Removed families (`primary-text`, `primary-pill`, `primary-pill-hover`, `primary-card-hover`, `primary-halo`) are still declared in `tokens.css`. New and renamed names appear only in `tokens.css` (grep of `*.css`, `*.ts`, `*.tsx`). Nothing consumes them.

**Dark values that differ are overridden in `.dark`.** `--glow-cta` / `--glow-active` / `--glow-focus` / `--glow-celebrate` / `--glow-live` / `--glow-track` match the legacy dark shadows they rename (`--glow-live` is the `--glow-primary-sm` stop; the 2000 ms pulse is a T03 keyframe). `--glass-subtle-bg` is 78% in `:root` and 72% in `.dark`. `--scrim` is `hsl(0 0% 0% / 0.25)` and `hsl(0 0% 0% / 0.4)`. Shared literals (`12px saturate(150%)`, `24px`, 55%, 60%, `90dvh`, `36px`/`4px`, safe-area `env()`, `56px`, `48px`) sit on `:root` only, which is correct because `.dark` is the class on `html`. `--theme-color-light` / `--theme-color-dark` are `hsl(0 0% 100%)` and `hsl(0 0% 2%)`, the light and dark `--bg-canvas` values. There is no `--bg-base` token. `--skeleton-base` / `--skeleton-shine` are `var(--bg-surface)` / `var(--bg-overlay)`.

**Self-repair.** `packages/design-tokens/utilities.css` and `apps/forum/src/app/globals.css` are identical at `b95a300`, `2f3a13f`, and HEAD. Shared rule is `main { @apply min-h-0; }`. Forum override is `main { @apply min-h-screen; }`.

**Evidence.** `git diff b95a300 HEAD -- ak-redesign/specs/S00-evidence/T01` is empty.

**Struck, not deleted.** STYLE-KIT §2.2 lists the five removed families with strikethrough under `REMOVED (S00-T02, D-007 — …)`. Glass (§2.2a) and sheet / safe-area / theme-color / skeleton (§2.2b) match the CSS percentages and literals above. The glow dark column is the exception in the finding.
