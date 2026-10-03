---
id: HOME-SYNC-FIX-R1
type: REVIEW-FIX
author-model: GLM
round: 1
date: 2026-10-03
review: HOME-SYNC-REVIEW.md
commit: bb4ab7b
status: DONE
---

# FIX-R1 — RED/GREEN tests for the selector gate and the pnpm.cjs fallback

Answers the BLOCK in `HOME-SYNC-REVIEW.md`. Tests only; the character
class in `scripts/lib/local-gate.mjs:90` is untouched. New files:

- `tests/scripts/local-gate.test.ts` — out-of-process driver around
  `assertLocalDeployment` (it `process.exit(1)`s, so each probe spawns a
  node child that imports the real module with `CONVEX_DEPLOYMENT` in its
  env). 27 refuse cases = the review's R1–R3 attack list verbatim; 3
  accept cases = every string the case-tolerant name segment added.
- `tests/scripts/pnpm-spawn.test.ts` — `runPnpm` with mocked
  `spawnSync`/`existsSync` (machine-independent): plain-first order proof,
  APPDATA-cjs invocation, node-dir candidate order, throw when absent.
- `vitest.config.ts` — root include gains `tests/scripts/**/*.test.ts`.

## RED — gate, pre-bb4ab7b regex (`[a-z0-9-]` / `[a-z0-9_-]`)

Method: `git checkout cfbaa65 -- scripts/lib/local-gate.mjs`, run, restore
(`git checkout HEAD -- …`). Line 87 in the checked-out old file:

```text
87:  if (!/^(anonymous:anonymous-[a-z0-9-]+|local:local-[a-z0-9_-]+)$/.test(deployment)) {
```

```text
     × accepts and returns: anonymous, uppercase project name 56ms
     × accepts and returns: local, underscore + uppercase project 56ms
     × accepts and returns: anonymous, cloud-shaped uppercase name 54ms
⎯⎯ Failed Tests 3 ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
 Test Files  1 failed (1)
      Tests  3 failed | 27 passed (30)

 FAIL  tests/scripts/local-gate.test.ts > … > accepts and returns: anonymous, uppercase project name
AssertionError: selector "anonymous:anonymous-CE-MVP" should exit 0: expected 1 to be +0 // Object.is equality
 FAIL  tests/scripts/local-gate.test.ts > … > accepts and returns: local, underscore + uppercase project
AssertionError: selector "local:local-CE_MVP" should exit 0: expected 1 to be +0 // Object.is equality
 FAIL  tests/scripts/local-gate.test.ts > … > accepts and returns: anonymous, cloud-shaped uppercase name
AssertionError: selector "anonymous:anonymous-Energetic-Kangaroo-55" should exit 0: expected 1 to be +0 // Object.is equality
```

All 27 attack selectors still refused (they pass in both RED and GREEN —
the old class refused them too; the review's bypass re-runs hold).

## RED — pnpm fallback, order reversed (candidates before plain spawn)

Method: temporary working-tree mutation of `runPnpm` in
`scripts/lib/session.mjs` (candidate `existsSync` check moved above the
plain-spawn probe), run, restore. The mutation is the failure mode the
review warns about ("skip the APPDATA candidate" / fallback silently
preferred over a working plain pnpm):

```text
     × prefers plain `pnpm` when it spawns, even with a pnpm.cjs on disk (fallback only after plain fails) 7ms
⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
 Test Files  1 failed (1)
      Tests  1 failed | 3 passed (4)

 FAIL  tests/scripts/pnpm-spawn.test.ts > … > prefers plain `pnpm` when it spawns, even with a pnpm.cjs on disk
AssertionError: expected 'C:\Program Files\nodejs\node.exe' to be 'pnpm' // Object.is equality
Received: "C:\Program Files\nodejs\node.exe"
 ❯ tests/scripts/pnpm-spawn.test.ts:81:17
```

The three review-mandated behaviors (APPDATA cjs invoked after plain
fails; node-dir candidate order; throw when absent) still pass under the
mutation — only the order constraint discriminates, which is the point.

## GREEN — current code (`bb4ab7b` regex, plain-first fallback)

`scripts/` verified clean (`git status --porcelain scripts/` empty) before
the run — the RED mutations were fully reverted:

```text
 ✓ tests/scripts/pnpm-spawn.test.ts > session.mjs runPnpm (pnpm.cjs fallback order) > prefers plain `pnpm` when it spawns, even with a pnpm.cjs on disk (fallback only after plain fails) 3ms
 ✓ tests/scripts/pnpm-spawn.test.ts > session.mjs runPnpm (pnpm.cjs fallback order) > invokes node on the %APPDATA% pnpm.cjs when plain `pnpm` fails to spawn 1ms
 ✓ tests/scripts/pnpm-spawn.test.ts > session.mjs runPnpm (pnpm.cjs fallback order) > falls back to the node-directory pnpm.cjs when APPDATA has none (candidate order) 0ms
 ✓ tests/scripts/pnpm-spawn.test.ts > session.mjs runPnpm (pnpm.cjs fallback order) > throws when plain pnpm fails and no pnpm.cjs candidate exists 1ms
 ✓ tests/scripts/local-gate.test.ts > … > refuses: extra segment (prod name) 57ms
 ✓ tests/scripts/local-gate.test.ts > … > refuses: extra segment (local kind) 52ms
 ✓ tests/scripts/local-gate.test.ts > … > refuses: extra segment (uppercase cloud name) 50ms
 ✓ tests/scripts/local-gate.test.ts > … > refuses: extra segment (uppercase local name) 50ms
 ✓ tests/scripts/local-gate.test.ts > … > refuses: trailing colon 51ms
 ✓ tests/scripts/local-gate.test.ts > … > refuses: double colon 50ms
 ✓ tests/scripts/local-gate.test.ts > … > refuses: prod cloud 50ms
 ✓ tests/scripts/local-gate.test.ts > … > refuses: dev cloud 50ms
 ✓ tests/scripts/local-gate.test.ts > … > refuses: anonymous prefix, cloud name 51ms
 ✓ tests/scripts/local-gate.test.ts > … > refuses: bare cloud name 50ms
 ✓ tests/scripts/local-gate.test.ts > … > refuses: dev + uppercase cloud 51ms
 ✓ tests/scripts/local-gate.test.ts > … > refuses: prod + uppercase cloud 52ms
 ✓ tests/scripts/local-gate.test.ts > … > refuses: anonymous + uppercase cloud 51ms
 ✓ tests/scripts/local-gate.test.ts > … > refuses: local + uppercase cloud 51ms
 ✓ tests/scripts/local-gate.test.ts > … > refuses: bare uppercase cloud 54ms
 ✓ tests/scripts/local-gate.test.ts > … > refuses: preview + uppercase branch 54ms
 ✓ tests/scripts/local-gate.test.ts > … > refuses: uppercase kind 59ms
 ✓ tests/scripts/local-gate.test.ts > … > refuses: uppercase name after kind 53ms
 ✓ tests/scripts/local-gate.test.ts > … > refuses: capitalized kind 51ms
 ✓ tests/scripts/local-gate.test.ts > … > refuses: dev + local-shaped name 51ms
 ✓ tests/scripts/local-gate.test.ts > … > refuses: prod + local-shaped name 51ms
 ✓ tests/scripts/local-gate.test.ts > … > refuses: leading space 50ms
 ✓ tests/scripts/local-gate.test.ts > … > refuses: trailing space 51ms
 ✓ tests/scripts/local-gate.test.ts > … > refuses: mid space 51ms
 ✓ tests/scripts/local-gate.test.ts > … > refuses: embedded tab 51ms
 ✓ tests/scripts/local-gate.test.ts > … > refuses: embedded newline 51ms
 ✓ tests/scripts/local-gate.test.ts > … > refuses: trailing newline 50ms
 ✓ tests/scripts/local-gate.test.ts > … > accepts and returns: anonymous, uppercase project name 52ms
 ✓ tests/scripts/local-gate.test.ts > … > accepts and returns: local, underscore + uppercase project 54ms
 ✓ tests/scripts/local-gate.test.ts > … > accepts and returns: anonymous, cloud-shaped uppercase name 53ms
      Tests  34 passed (34)
```

## Coverage of the review asks

- [x] every R1–R3 attack selector still refuses (extra segments, colons,
      cloud names incl. `dev:Happy-Animal-123`, whitespace/tab/newline)
- [x] `anonymous:anonymous-CE-MVP` and `local:local-CE_MVP` accepted (plus
      the review-classified `anonymous:anonymous-Energetic-Kangaroo-55`)
- [x] RED against the pre-bb4ab7b class, GREEN on the current one
- [x] runPnpm invokes the `%APPDATA%` pnpm.cjs only after plain `pnpm`
      fails to spawn; RED under reversed order; throws when no candidate
