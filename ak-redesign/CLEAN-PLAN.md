---
id: CLEAN-PLAN
type: CONTROL
author-model: GLM
tool: ZCode CLI
date: 2026-10-12
branch: feed-base @ 49b1cf5
status: PLAN — founder decision 2026-10-12: repo keeps ONLY backend + demo world + backend tests + design tokens + docs; every frontend is archived. READ-ONLY session: this file is the only change.
---

# CLEAN-PLAN — backend-only repo, everything else archived

Execution basis: `git ls-files` at commit time = **1,638 tracked files** (1,637 measured + this file).
Every file is accounted for by the manifest in §2 (rule-based, mutually exclusive, verified by script —
totals reconcile exactly: 327 + 68 + 1,241 + 2 = 1,638). Nothing is deleted outright except 2 regenerable
artifacts; all frontend + history moves to the `ce-archive` branch (tag `archive/pre-backend-only-2026-10`).

## 1. Target tree (mainline after the clean — 395 files)

```
CE-MVP/
├── convex/                  # the backend: 160 files, 177 tables, 456 functions, 45 crons (UNTOUCHED — gate G8)
│   └── _generated/          # Convex codegen output (7) — tracked by Convex convention, `pnpm convex:codegen` refreshes
├── packages/
│   ├── design-tokens/       # tokens.css + utilities.css (2) — the surviving design source of truth
│   └── convex-client/       # isConvexConfigured()/getConvexUrl() env helper (3)
├── scripts/
│   ├── demo-world/          # demo engine P0–P6 + prompts + reports + run logs (34)
│   └── ops/                 # local-setup, reset-local, seed-check(+proof), seed-demo, session-start/end,
│                            # sync-components, gen-table-index, graph-explain, lib/ (3), seed-fingerprint.txt (14)
├── tests/                   # backend suites: convex/ (13), integration/ (3), scripts/ (2) — 151 tests
├── docs/
│   ├── 00-vision/           # CEY-VISION.md
│   ├── 01-product/          # _data-model.md (canonical entities + enums)
│   ├── 02-design/           # STYLE-KIT.md, DESIGN-BIBLE.md
│   ├── 03-specs/            # FEED-GAP.md (live backend gaps CR-013/014), DEMO-WORLD-SPEC.md
│   ├── 04-decisions/        # DECISIONS-LOCKED, OPEN-DECISIONS, redesign-DECISIONS (D-001…D-017), crs/ (16)
│   ├── 05-backend/          # 00-TOPOLOGY, 00-TRANSITION, SECURITY-FIX-QUEUE-R2, build-sheets/M0–M18 (22)
│   └── 06-ops/              # AGENT-START-HERE, AGENT-MEMORY, DEV-HANDOFF, FOUNDER-BOOTSTRAP,
│                            # redesign-CONVENTIONS, TEAM-WORKFLOW, CLEAN-PLAN (this file)
├── .github/                 # ci.yml (REWRITTEN backend-only), convex-prod-deploy.yml, dependabot.yml, wiki-tracker-sync.yml
├── .agents/ .claude/ .codex/ .cursor/   # agent skills + hooks + rules (87) — backend agents keep using these
├── graphify-out/            # tables.json + manifest.json only (2) — graph.json/GRAPH_REPORT.md untracked
└── root (16): README.md (rewrite) · AGENTS.md (rewrite) · CHANGELOG.md · CLAUDE.md · LICENSE ·
    package.json (rewrite) · pnpm-workspace.yaml (prune) · pnpm-lock.yaml (regen) · vitest.config.ts ·
    convex.json · skills-lock.json · .nvmrc · .gitattributes · .gitignore · .graphifyignore · .claudeignore
```

## 2. MANIFEST — every tracked file → bucket (rule-based, exhaustive, script-verified)

Method: each rule matches a disjoint path set; `SUM(rule counts) = git ls-files count`. Uniform trees are
represented by rule + count; every mixed directory (root, scripts/, docs/, ak-redesign keeps) is enumerated
file-by-file below. **Totals: KEEP 327 · KEEP-MOVED 68 · ARCHIVE 1,241 · DELETE-GENERATED 2 = 1,638.**
Mainline after clean = 395 files (24%); archive branch = 1,241 files (76%).

### KEEP — unchanged path (327)

| Rule | Files | Note |
|---|---|---|
| `convex/**` | 160 | Backend untouched (incl. `_generated/` 7, `demoWorld/` 11, `dev/` 2, `seed/` 3) |
| `.agents/**` + `.claude/**` | 86 | Agent skills/settings — still used by backend agents |
| `scripts/demo-world/**` | 34 | Demo engine + prompts + reports |
| `tests/**` | 18 | 151 backend tests |
| `packages/design-tokens/**` + `packages/convex-client/**` | 5 | Kept packages |
| `.github/**` | 4 | ci.yml gets rewritten content (same path) |
| root configs: `.gitattributes .gitignore .graphifyignore .claudeignore .nvmrc AGENTS.md CHANGELOG.md CLAUDE.md LICENSE README.md convex.json package.json pnpm-lock.yaml pnpm-workspace.yaml skills-lock.json vitest.config.ts` | 16 | AGENTS.md, README.md, package.json, pnpm-workspace.yaml get rewritten content (same path) |
| `.codex/hooks.json`, `.cursor/rules/graphify.mdc` | 2 | Agent-tool configs (found by the audit script) |
| `graphify-out/tables.json`, `graphify-out/manifest.json` | 2 | Table-writer audit inputs (used by this and future assessments) |

### KEEP-MOVED — new path (68)

Docs reorg (54 files land under `docs/`):

| Old path | New path |
|---|---|
| `docs/01-product-spec/_data-model.md` | `docs/01-product/_data-model.md` |
| `docs/04-design-system/STYLE-KIT.md` | `docs/02-design/STYLE-KIT.md` |
| `ak-redesign/specs/DESIGN-BIBLE.md` | `docs/02-design/DESIGN-BIBLE.md` |
| `ak-redesign/specs/FEED-GAP.md` | `docs/03-specs/FEED-GAP.md` |
| `ak-redesign/specs/DEMO-WORLD-SPEC.md` | `docs/03-specs/DEMO-WORLD-SPEC.md` |
| `docs/06-open-items/DECISIONS-LOCKED.md` | `docs/04-decisions/DECISIONS-LOCKED.md` |
| `docs/06-open-items/OPEN-DECISIONS.md` | `docs/04-decisions/OPEN-DECISIONS.md` |
| `ak-redesign/00-control/DECISIONS.md` | `docs/04-decisions/redesign-DECISIONS.md` |
| `ak-redesign/00-control/crs/*` (16 CR REQUEST/RESPONSE pairs) | `docs/04-decisions/crs/*` (CR-013/014 backend writers still OPEN) |
| `docs/00-project-status/00-TOPOLOGY.md` | `docs/05-backend/00-TOPOLOGY.md` |
| `docs/00-project-status/00-TRANSITION.md` | `docs/05-backend/00-TRANSITION.md` |
| `docs/06-open-items/SECURITY-FIX-QUEUE-R2.md` | `docs/05-backend/SECURITY-FIX-QUEUE-R2.md` |
| `docs/05-build-sheets/M0…M18` (19 backend milestone sheets) | `docs/05-backend/build-sheets/M0…M18` |
| `ak-redesign/01-vision/CEY-VISION.md` | `docs/00-vision/CEY-VISION.md` |
| `docs/AGENT-START-HERE.md` | `docs/06-ops/AGENT-START-HERE.md` (rewrite required) |
| `docs/AGENT-MEMORY.md` | `docs/06-ops/AGENT-MEMORY.md` |
| `docs/DEV-HANDOFF.md` | `docs/06-ops/DEV-HANDOFF.md` (GLM/classifier keys still live items) |
| `docs/FOUNDER-BOOTSTRAP.md` | `docs/06-ops/FOUNDER-BOOTSTRAP.md` |
| `ak-redesign/00-control/CONVENTIONS.md` | `docs/06-ops/redesign-CONVENTIONS.md` |
| `ak-redesign/TEAM-WORKFLOW.md` | `docs/06-ops/TEAM-WORKFLOW.md` (territory map needs post-clean edit) |
| `ak-redesign/CLEAN-PLAN.md` (this file) | `docs/06-ops/CLEAN-PLAN.md` |

Scripts re-folder (14 files land under `scripts/ops/`):
`local-setup.mjs, reset-local.mjs, seed-check.mjs, seed-check-proof.mjs, seed-demo.mjs, session-start.mjs,
session-end.mjs, sync-components.mjs, gen-table-index.mjs, graph-explain.mjs, lib/{local-gate,session,seedFingerprintRules}.mjs,
seed-fingerprint.txt` → `scripts/ops/<same name>`.

### ARCHIVE — CE-ARCHIVE branch (1,241)

| Rule | Files | Destination |
|---|---|---|
| `apps/forum/**` | 378 | `CE-ARCHIVE/frontend/apps/forum/` |
| `apps/admin/**` | 72 | `CE-ARCHIVE/frontend/apps/admin/` |
| `apps/seller/**` | 21 | `CE-ARCHIVE/frontend/apps/seller/` |
| `apps/marketplace/**` | 21 | `CE-ARCHIVE/frontend/apps/marketplace/` |
| `packages/auth-ui/**` | 14 | `CE-ARCHIVE/frontend/packages/auth-ui/` |
| `e2e/*` (3 specs) + `playwright.config.ts` | 4 | `CE-ARCHIVE/frontend/e2e/` |
| `scripts/{capture-baselines,t01-visual-diff,t02-css-identity,t02-glow-values-check,t03-evidence}.mjs` | 5 | `CE-ARCHIVE/frontend/tooling/` |
| `scripts/cap-coverage.mjs` | 1 | `CE-ARCHIVE/docs-history/tooling/` (kept beside the catalogs it reads) |
| `SETUP.md` | 1 | `CE-ARCHIVE/docs-history/SETUP.md` |
| `docs/02-contracts/**` (56), `docs/03-slices/**` (11), `docs/screens/**` (54), CAPABILITY-REGISTER-MERGED.md, MASTER-SCREEN-INVENTORY-MERGED.md, 00-ROUTES.md, PROJECT-STATUS.md, BIBLE-FIXES.md, FINAL-HOLISTIC-AUDIT.md, KNOWN-UI-GAPS.md, SCREEN-SCORES.md, DESIGN-SYSTEM-OPEN-ITEMS.md | 130 | `CE-ARCHIVE/docs-history/<old docs/ path>` |
| `ak-redesign/00-control/baselines/**` (66) + `_archive/**` (39) | 105 | `CE-ARCHIVE/evidence/00-control/{baselines,_archive}/` |
| `ak-redesign/specs/{FEED-B1,S00,L77,FEED-U2,S02,FEED-U1,FEED-U3}-evidence/**` | 157 | `CE-ARCHIVE/evidence/<same dir>/` |
| `ak-redesign/specs/S02-refs/**` | 285 | `CE-ARCHIVE/prototypes/S02-refs/` |
| redesign specs + state: FEED-DESIGN, FEED-B1/U1/U2/U3-BUILD, S00-{SPEC,NOTES,T01–T03 BUILD/REVIEW×4}, S02-{SPEC,NOTES} (16) | 16 | `CE-ARCHIVE/docs-history/redesign-specs/` |
| `ak-redesign/00-control/{STATUS,CURRENT-STATE,SCREEN-INVENTORY,SPEC-INDEX,PM-BRIEF,OPUS-HANDOFF-GT}.md` + `history/**` (12) + `session-log/**` (2) | 20 | `CE-ARCHIVE/docs-history/redesign-control/` |
| `ak-redesign/README.md`, `ak-redesign/templates/**` (6), `ak-redesign/evidence/**` (2), `ak-redesign/01-vision/.gitkeep` | 10 | `CE-ARCHIVE/docs-history/redesign-misc/` |
| `ak-redesign/REPO-ASSESSMENT.md` | 1 | `CE-ARCHIVE/reports/REPO-ASSESSMENT.md` |

### DELETE-GENERATED (2)

`graphify-out/graph.json`, `graphify-out/GRAPH_REPORT.md` — regenerable via `graphify update .`; the tracked
quartet shrinks to tables.json + manifest.json. (Blobs remain in git history; a history squash to actually
shrink `.git` (98 MB) is a separate founder decision — NOT part of this clean.)

## 3. Doc moves (summary)

Old `docs/` (160 files) splits **30 KEEP → new docs/** and **130 ARCHIVE**. New docs/ = 54 files:
00-vision (1) · 01-product (1) · 02-design (2) · 03-specs (2) · 04-decisions (19) · 05-backend (22) ·
06-ops (7). Rationale lines: `_data-model` stays because convex enums must match it verbatim; STYLE-KIT +
DESIGN-BIBLE stay because design-tokens survive; M0–M18 are backend milestones; TOPOLOGY/TRANSITION govern
backend structure and the never-write-legacy rule; FEED-GAP + DEMO-WORLD-SPEC are live backend specs;
DECISIONS/CRs remain binding. Everything screen/wave/slice/capability-related is frontend program history →
archive. `AGENT-START-HERE.md`, `AGENTS.md`, `README.md` need rewrites for the backend-only reality.

## 4. Archive layout (branch `ce-archive`, tag `archive/pre-backend-only-2026-10`)

```
CE-ARCHIVE/
├── INDEX.md                 # every top-level entry: origin path, file count, last commit, one-line what/why,
│                            # restore command (git checkout ce-archive -- <path>)
├── frontend/
│   ├── apps/{forum,admin,seller,marketplace}/   # 492 files — the four apps as-built @ feed-base
│   ├── packages/auth-ui/                         # 14
│   ├── e2e/                                      # 4 (3 specs + playwright.config.ts)
│   └── tooling/                                  # 5 visual-diff/evidence scripts
├── docs-history/            # 168: SETUP.md, tooling/cap-coverage.mjs, old docs/ tree (contracts, slices,
│                            # screens, capability+screen registers, status audits), redesign-control/,
│                            # redesign-specs/, redesign-misc/
├── evidence/                # 262: 00-control/{baselines(66),_archive(39)}, FEED-* /S00/S02/L77 evidence dirs (157)
├── prototypes/S02-refs/     # 285 — vendored prototype app (the 599 MB node_modules stays OUT of git entirely)
└── reports/                 # 1: REPO-ASSESSMENT.md
```
Ordered, no loose files: every archived file sits under one of the five buckets above; INDEX.md accounts for
each bucket's count (sum = 1,241).

## 5. Breakage list — what breaks when the frontend leaves, and the fix

Verified against the tree (grep/import checks run 2026-10-12):

| # | Breaks | Evidence | Fix |
|---|---|---|---|
| 1 | `pnpm-workspace.yaml` references apps/* | workspace globs | Prune to `packages/*` only |
| 2 | Root `package.json` scripts | `dev/build/start/lint/typecheck/test/test:run`, `dev:admin/build:seller/…` all `--filter` apps | Replace with backend set: `backend`, `test:convex` (+ `test` alias), `seed:demo`, `seed:check`, `reset:local`, `session:start/end`, `convex:codegen`, `convex:deploy:prod`; update `scripts/*.mjs` paths → `scripts/ops/*.mjs` |
| 3 | CI `ci.yml` | Every job targets forum/admin: typecheck×2, lint×2, `test:run` (1,095), playwright e2e | Rewrite backend-only: install → `tsc --noEmit` (new root tsconfig.json covering `convex/` + `tests/`) → `pnpm test:convex` → codegen-no-diff check |
| 4 | cap-coverage gate (572/572) | Reads `docs/01-product-spec/CAPABILITY-REGISTER-MERGED.md` + `docs/03-slices/` — both archived | Gate removed with them; script archived alongside; strike the rule from AGENTS.md rewrite |
| 5 | Scripts that touch the forum | `scripts/local-setup.mjs:107` loops `["apps/forum","apps/admin"]` writing `.env.local`; t01/t02×2/t03 + capture-baselines diff forum UI (archived — no fix needed) | Strip the app loop from local-setup (keep root `.env.local` steps). session-start/end + seed-check verified clean of apps/ references |
| 6 | `tests/integration/feed-u2-payload.test.ts` | `WRITE_WIRE_PAYLOAD=1` block writes `apps/forum/src/app/(app)/lab/feed/wire-payload.json` (lab fixture, archived) | Delete that env-gated block; the 5 tests seed convex-test directly and stay → 151/151 preserved |
| 7 | convex → frontend imports | **None exist** — only a comment at `convex/lib/urlGuards.ts:121` naming an apps/forum test path | Optional comment tidy; no functional change |
| 8 | `tests/scripts/local-gate.test.ts` (30 tests) | Asserts root package.json script names/selector rules that change in fix #2 | Update fixtures to the new script set |
| 9 | `AGENTS.md`, `README.md`, `docs/06-ops/AGENT-START-HERE.md`, `TEAM-WORKFLOW.md` | All document apps/, forum tests, cap-coverage, redesign precedence §0 | Rewrite backend-only (new read order: _data-model → build sheets → STYLE-KIT → AGENT-MEMORY); territory map becomes convex/ vs scripts/ |
| 10 | `vitest.config.ts` | Comment references apps/forum suite | Comment edit only (include patterns already `tests/**`) |
| 11 | `.env.local` files (3, untracked) | forum/admin copies orphaned | Root copy (Convex CLI vars) is the only one that matters post-clean; delete the two orphaned copies locally |
| 12 | Dependabot / wiki-tracker-sync / convex-prod-deploy workflows | Root-pnpm and CHANGELOG-rule based | No change needed (verified: no apps/* references in dependabot; prod deploy is convex-only) |
| 13 | Demo-world engine | Verified: no apps/ references in `scripts/demo-world/**` or `convex/demoWorld/**` | None — demo world survives intact (gates G4/G5 prove it) |
| 14 | New files required | No root `tsconfig.json` exists today (only per-app ones, archived; `convex/tsconfig.json` is machine-generated + gitignored) | Add root `tsconfig.json` (strict, `convex/**` + `tests/**`) for gate G1; regenerate `pnpm-lock.yaml` after workspace prune |

## 6. Backend-only gates — proof the repo is still healthy

- **G1 Typecheck:** `tsc --noEmit` green against the new root tsconfig (convex + tests).
- **G2 Unit/integration:** `pnpm test:convex` → **151/151** (incl. feed-u2-payload after fix #6 and
  local-gate after fix #8).
- **G3 Codegen:** `pnpm convex:codegen` produces no diff in `convex/_generated/` (schema + api surface consistent).
- **G4 Seed fingerprint:** `node scripts/ops/seed-check.mjs` → `0ef8369aa5d8` unchanged (demo seed intact).
- **G5 Demo world:** local backend up (`pnpm backend`), `npx convex run demoWorld:verifyWorld` passes;
  data lives in `.convex/` (gitignored) and is untouched by file moves. Snapshots
  `../demo-snapshot-2026-10-11.zip` + `../convex-backup-2026-10-11` remain the rollback.
- **G6 Backend untouched:** `git diff --stat HEAD~clean -- convex/` = 0 (the clean moves no convex file).
- **G7 Fresh clone CI:** `pnpm install --frozen-lockfile` + G1 + G2 green on a clean checkout.
- **G8 Prod path intact:** `convex-prod-deploy.yml` valid; deploy stays founder-only (`energetic-kangaroo-55`).
- **G9 Tree audit:** `git ls-files | wc -l` = 395; zero paths under `apps/`, `e2e/`, `ak-redesign/`,
  `packages/auth-ui`; `ce-archive` branch file count under `CE-ARCHIVE/` = 1,241 + INDEX.md.

## 7. Definition of Clean — 9-point acceptance checklist

1. ☐ Mainline tree == §1 target tree exactly; root has only README, AGENTS, configs (+ CHANGELOG, LICENSE, CLAUDE.md); no loose files.
2. ☐ `apps/`, `e2e/`, `ak-redesign/`, `packages/auth-ui`, `SETUP.md`, `playwright.config.ts` absent from mainline; present under `CE-ARCHIVE/` on branch `ce-archive` (tag `archive/pre-backend-only-2026-10`).
3. ☐ Manifest reconciles: KEEP(327) + KEEP-MOVED(68) + ARCHIVE(1,241) + DELETE-GENERATED(2) = 1,638 = pre-clean `git ls-files` count; nothing unaccounted, nothing lost.
4. ☐ Gates G1–G3 green (tsc, 151/151, codegen-no-diff) on the clean commit.
5. ☐ Demo world intact: G4 fingerprint unchanged + G5 verifyWorld passes on local backend.
6. ☐ CI rewritten per §5.3 and green on a fresh clone (G7).
7. ☐ docs/ reorg complete per §3 (54 files); AGENTS.md, README.md, AGENT-START-HERE.md, TEAM-WORKFLOW.md rewritten backend-only; internal links spot-checked (no dead references to apps/ or archived docs).
8. ☐ No tracked binary >500 KB in mainline; `graphify-out/` = tables.json + manifest.json only.
9. ☐ `CE-ARCHIVE/INDEX.md` lists every bucket with origin, count, and restore command; CHANGELOG.md carries one line for the clean (D-006 rule).

Execution order (one PR): (1) create `ce-archive` branch, move the 1,241 files + INDEX.md, tag it;
(2) on mainline: apply §2 moves, §5 fixes, §6 gate wiring, doc rewrites; (3) run gates G1–G9;
(4) PR with the checklist ticked. Estimated with the AI setup: 6/10/18 h (REPO-ASSESSMENT §2), dominated
by gate re-runs and the two doc rewrites, not by the moves.
