---
id: S00-T01-REVIEW
type: REVIEW
author-model: Grok
tool: Cursor
round: 1
status: ACTIVE
date: 2026-09-29
---

# S00-T01 review — token single source

Compared `98cce0d..3513442` to S00-SPEC §12 S00-T01, §5.1, and §4. Did not trust the build report.

## Verdict: PASS

Acceptance holds. No findings.

Compiled both apps' `globals.css` with `@tailwindcss/postcss`, old file (`98cce0d`) against this branch. Forum output is byte-identical (178,687 bytes). Admin output is byte-identical (178,706 bytes). So `@theme inline` inside the imported file, `@layer base`, and the unlayered rules land in the same order as the old single file. Forum's later `main { @apply min-h-screen }` restores the old L522 value; admin keeps shared `min-h-0`. That identity covers `/discussions/[slug]` and `/settings/profile` at 390 dark and light: those routes use this stylesheet, so they cannot diverge from the move. I did not open them in a browser.

Source move matches: `tokens.css` is old forum L5–508 (`*` border rule included); `utilities.css` from L510 is byte-identical once `min-h-screen` is swapped to `min-h-0`. Admin `globals.css` is 9 lines. Guard test: 3/3 passed (`token-single-source.test.ts`).

`utilities.css` holding the shared non-token rules is the right call. §5.1 names only `tokens.css` then `utilities.css`, and §12 requires app files to keep local rules only, which is what makes admin globals.css stay under 100 lines. T03 can append its utilities at the end of that file; it does not have to edit the moved block.
