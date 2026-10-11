# make/ — prototype feed screenshots

Screenshots of the S02 reference prototype (`../prototype/`, the founder's
pre-build CEfrontend v2 feed) captured for the feed build (FEED-DESIGN.md).

Captured 2026-10-11 (GLM, [FEED][PREREQ] session) by running the prototype
standalone and screenshotting `/feed`:

| File | Viewport | Theme |
|---|---|---|
| `feed-1440.png` | 1440×900 | dark (default) |
| `feed-390.png` | 390×844 | dark (default) |
| `feed-390-light.png` | 390×844 | light (header toggle) |

Regenerate with:

```
cd ak-redesign/specs/S02-refs/prototype
pnpm install --ignore-workspace
pnpm dev --port 3003   # then screenshot http://localhost:3003/feed
```

Reference only — same rule as `../prototype/REFERENCE.md`: read, never build
against; excluded from tsconfig/eslint/tests/graphify; not part of the pnpm
workspace.
