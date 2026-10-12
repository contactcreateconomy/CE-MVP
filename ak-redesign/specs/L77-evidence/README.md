# L-77 — border reset into `@layer base` (before / after)

`packages/design-tokens/tokens.css` had an **unlayered** `* { @apply border-transparent; }`
(since S00-T01 `3513442`). Unlayered CSS beats every `@layer utilities` rule, so every
`border-border-*` colour class computed `transparent`. Fix: wrap the reset in `@layer base`.

Measured in the browser (elements carrying a `border-border-*` class whose computed
border colour is not transparent), 1440, both themes:

| Screen | Before | After |
|---|---|---|
| /lab/feed | 1 / 48 | 48 / 48 |
| /lab/foundation | 0 / 16 | 16 / 16 |
| /landing | 0 / 2 | 2 / 2 |
| /signin | 0 / 0 (no such classes on the server-rendered page) | 0 / 0 |

Screenshots: `before-*.png` / `after-*.png` (dark + light). RED `red.txt` → GREEN `green.txt`.
Founder visual pass needed before merge (L-77): borders appear on every screen at once.
Product routes needing Convex (`/feed`, `/discussions/*`) were not capturable in this container.
