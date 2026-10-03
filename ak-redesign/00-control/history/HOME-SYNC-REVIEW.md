---
id: HOME-SYNC-REVIEW
type: REVIEW
author-model: Grok
tool: Cursor
round: 1
status: ANSWERED
date: 2026-10-03
fix: HOME-SYNC-FIX-R1.md
---

# Home-sync review — `bb4ab7b` selector case + pnpm.cjs

Scope: the seed-gate regex in `scripts/lib/local-gate.mjs` and the `pnpm.cjs` fallback in `scripts/lib/session.mjs` and `scripts/local-setup.mjs`. Commit `bb4ab7b` on `011-Akilesh-Redesign`.

## Verdict: BLOCK

The widened selector still refuses every R1–R3 bypass re-run here, and every newly accepted string is a local deployment name. The commit lands neither change with a test that fails on the old code and passes on the new code.

## Finding

`scripts/lib/local-gate.mjs:90`, `scripts/lib/session.mjs:44-58`, `scripts/local-setup.mjs:82-96` — both behaviors changed, and the commit contains no test. The suite never requires `anonymous:anonymous-CE-MVP` and `local:local-CE_MVP` to pass, and never requires the R1–R3 selectors below to exit 1. It never requires `runPnpm` / local-setup to invoke `%APPDATA%\npm\node_modules\pnpm\bin\pnpm.cjs` after plain `pnpm` fails to spawn, or to throw when that file is absent. The S00-T03 bar (BUILD evidence + REVIEW check) is a test that fails on the old behavior and passes on the new one. This commit has neither side, so a later edit can accept an extra colon, or skip the APPDATA candidate, while the suite stays green.

Keep the character class. Add a driver around `assertLocalDeployment`: the attack list below must refuse, and the two uppercase selectors must return. Paste the same assertions failing against `[a-z0-9-]` / `[a-z0-9_-]` and passing against `[A-Za-z0-9-]` / `[A-Za-z0-9_-]`. Add a spawn test for the fallback: fake `APPDATA` with a `pnpm.cjs`, plain `pnpm` not spawnable, and assert node is invoked on that file; with the file removed, assert it throws.

## Probes (this round)

Regex: `/^(anonymous:anonymous-[A-Za-z0-9-]+|local:local-[A-Za-z0-9_-]+)$/`

These still refuse. Where a script is named, it exited 1 on the selector message before any preflight or CLI spawn (`reset:local` had a long password, so the selector gate is what fired):

- Extra segment: `anonymous:anonymous-x:energetic-kangaroo-55` from `seed:demo`, `seed:check`, and `reset:local`. `local:local-foo:energetic-kangaroo-55` from `reset:local`. Also `anonymous:anonymous-x:Energetic-Kangaroo-55` and `anonymous:anonymous-X:energetic-kangaroo-55`.
- Extra colon: `anonymous:anonymous-x:`, `anonymous::anonymous-foo`.
- Cloud selectors: `prod:energetic-kangaroo-55` (`seed:check`), `dev:energetic-kangaroo-55`, `anonymous:energetic-kangaroo-55` (`seed:demo`), bare `energetic-kangaroo-55`.
- Uppercase cloud shapes: `dev:Happy-Animal-123` (`seed:demo`), `prod:Energetic-Kangaroo-55`, `anonymous:Energetic-Kangaroo-55`, `local:Energetic-Kangaroo-55`, bare `Energetic-Kangaroo-55`, `preview:Feature-Branch`.
- Uppercase kind or prefix: `ANONYMOUS:anonymous-CE-MVP` (`seed:demo`), `anonymous:ANONYMOUS-ce-mvp`, `Anonymous:anonymous-CE-MVP`. `dev:anonymous-CE-MVP` and `prod:anonymous-CE-MVP` refuse at the gate.
- Whitespace on `anonymous:anonymous-CE-MVP`: leading space, trailing space, mid space, tab, embedded newline, trailing newline. `seed:demo` exited 1 for each. A trailing newline fails the regex (`$` rejects it).

These are the strings the old `[a-z…]` class refused and this class accepts. Each one stays on the local path in Convex 1.34.1:

- `anonymous:anonymous-CE-MVP` — `assertLocalDeployment` returned that string and exited 0, with no CLI spawn. `isAnonymousDeployment` is `startsWith("anonymous-")` (`node_modules/convex/dist/esm/cli/lib/deployment.js` lines 17–18), so the CLI treats the name as the anonymous local backend. `generateDeploymentName` builds `` `anonymous-${path.basename(cwd)}` `` (`anonymous.js` lines 281–285), which is how `CE-MVP` becomes `anonymous-CE-MVP`.
- `local:local-CE_MVP` — matches. The type is `local`. `handleOwnDev` loads on-disk local credentials when `deploymentType === "local"` (`api.js` lines 273–277). That is the linked-local name shape `local-<team>_<project>` (`localDeployment.js` lines 200–208).
- `anonymous:anonymous-Energetic-Kangaroo-55` — matches, and the last segment still begins with lowercase `anonymous-`, so the CLI classifies it as anonymous local.

Cloud deployment names in this CLI are `/^[a-z]+-[a-z]+-[0-9]+$/` (`deploymentSelector.js` line 8, and the same shape in `extractDeploymentNameForWorkOS.js` line 4). An uppercase letter fails that pattern. The strings this class adds are anonymous-local names or `local:local-…` names. A cloud selector is `dev:`, `prod:`, or `preview:` plus a lowercase `word-word-digits` name, and those still fail the gate.

## pnpm.cjs

`session.mjs` and `local-setup.mjs` use the same candidate order: `%APPDATA%\npm\node_modules\pnpm\bin\pnpm.cjs`, then `dirname(process.execPath)/node_modules/pnpm/bin/pnpm.cjs`. Plain `pnpm` is tried first. Both keep `shell: false` and pass argv as an array. The fallback does not read `CONVEX_DEPLOYMENT`.

## Checked

- [x] R1–R3 probes re-run on the new regex and on the three scripts
- [x] Uppercase matches classified with the Convex 1.34.1 CLI
- [x] RED/GREEN tests for the gate and the fallback (HOME-SYNC-FIX-R1.md — 27 refuse + 3 accept driver, plain-first spawn order; RED on pre-bb4ab7b class and on reversed fallback order, GREEN on current)
