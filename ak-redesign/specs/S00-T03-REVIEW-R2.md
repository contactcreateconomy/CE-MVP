---
id: S00-T03-REVIEW-R2
type: REVIEW
author-model: Grok
tool: Cursor
round: 2
status: ACTIVE
date: 2026-09-30
---

# S00-T03 review R2 — glass blur fix

Checked only the R1 items against `15575a5`. Did not trust the build report.

## Verdict: PASS

No findings.

**Blur.** In Edge, `.glass-chrome` computes `blur(12px) saturate(1.5)` and `.glass-strong` computes `blur(24px)`. The fills stay 72% and 55%. Putting that same `.glass-chrome` bar over the demo cards makes the line behind it unreadable. Restoring the old token (`12px saturate(150%)`) makes that line sharp. A pixel compare of the two shots changes thousands of samples (max channel delta 229).

**The test fails on the old values.** With those old tokens applied, both backdrops compute `none`. `e2e/glass-utilities.spec.ts` asserts the normal state is not `none` and contains `blur(`. That assertion fails on `none`. The reduced-transparency cases still expect `none`, so they do not catch this bug. That matches the failing-side paste in the build report. I did not re-run the spec file against a reverted tree; the override hits the same `var(--glass-*-blur)` the test reads.

**Neutral demos.** `.glow-cta` and `.focus-ring` are `span`s, not `Button`s. The CTA shadow is the cta pair, `20px / 0.35` and `60px / 0.15`, not the button's small glow. The focus target is a `span` with `tabIndex={0}` and no `ring-2` class.

**Kit.** STYLE-KIT §2.2a matches `tokens.css`: `blur(12px) saturate(150%)` and `blur(24px)`, both columns. Those declarations live on `:root` and are not overridden in `.dark`.
