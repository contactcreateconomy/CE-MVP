---
id: S00-T03-REVIEW
type: REVIEW
author-model: Grok
tool: Cursor
round: 1
status: ACTIVE
date: 2026-09-30
---

# S00-T03 review — utilities

Compared `b6e2846..34f3c08` to S00-SPEC §12 S00-T03 and §5.2–§5.5, and to `S00-T03-BUILD.md`. Did not trust the build report. The T02 §2.2 fix in `4585930` is closed: the dark column is the `.dark` strings from `tokens.css`, and "solid" is gone.

## Verdict: BLOCK

Glass does not blur. The rest of the utilities are in place.

## BLOCKER

`packages/design-tokens/utilities.css` lines 642–643 and 660–661 set `backdrop-filter` to the raw tokens. Those tokens are not filter functions:

- `--glass-subtle-blur` is `12px saturate(150%)` (`tokens.css` line 455)
- `--glass-strong-blur` is `24px` (`tokens.css` line 457)

Edge computes both as `backdrop-filter: none`. The same page, live, shows `none` on every `.glass-chrome` and `.glass-strong` demo, while the fill is the right mix (72% and 55%). `blur(12px) saturate(150%)` and `blur(24px)` compute to real filters in that same browser. The spec's "12px + saturate(150%)" has to be written as `blur(12px) saturate(150%)`. `blur(var(--glass-subtle-blur))` is also invalid, because `blur()` cannot take `12px saturate(150%)`. `blur(var(--glass-strong-blur))` does work for the 24px token.

The report's reduced-transparency check (`backdrop-filter: none`) passes even when the media query is off, because the property is already none. The opaque `rgb(18, 18, 18)` background is the part of that check that actually shows the nested fallback. Re-assert a non-none backdrop-filter in the normal state after the fix.

## SHOULD-FIX

The `.glow-cta` demo is a primary `Button` (`utilities-client.tsx` line 41). That variant always includes `dark:shadow-glow-primary-sm` (`button.tsx` line 19), and that rule is later in the compiled sheet than `.glow-cta`. On a dark OS color scheme the button's small glow wins, so the row does not show `--glow-cta` (`20px / 0.35` + `60px / 0.15`). The `.focus-ring` demo is also a `Button` (line 63), whose `focus-visible:ring-2` sets `box-shadow` later than `.focus-ring`. Put those two utilities on elements that do not set their own shadow.

## What holds

The T01 block is untouched: the diff only appends after line 569. `.glow-active` is `box-shadow: var(--glow-active)`. `.pulse-live` is the 2000 ms keyframe from `--glow-live` to `--glow-cta`, with `box-shadow: var(--glow-live)` kept and `animation: none` inside `prefers-reduced-motion`. `.glow-celebrate` is one 600 ms iteration. `.focus-ring` is `:focus-visible` only. Safe-area helpers are the four `env()` paddings. Fallbacks are nested inside `.glass-chrome` and `.glass-strong`, and those `@media` / `@supports` rules are still nested in the compiled CSS (browsers apply that nesting). `/lab` and `/lab/utilities` call `notFound()` when `NODE_ENV` is production. New names are not used outside the lab page and `utilities.css`.

Light and dark evidence PNGs are different pages: `utilities-light-390.png` samples `#FFFFFF`, `utilities-dark-390.png` samples `#050505`. I could not re-drive the toggle in this session. The dev server returns 403 for `/_next/static` script requests that carry an `Origin` header, so the client component never hydrated here (the safe-area line stayed on the server placeholder, and the theme button did not write `localStorage`). That is this server, not the utility CSS.
