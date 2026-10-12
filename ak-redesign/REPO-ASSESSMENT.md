---
id: REPO-ASSESSMENT
type: CONTROL
author-model: GLM
tool: ZCode CLI
date: 2026-10-12
branch: feed-base @ 5ba9f62
status: READ-ONLY ASSESSMENT (one file added; nothing else touched)
---

# REPO-ASSESSMENT — engineering-manager report to the founder

All numbers below are measured on `feed-base @ 5ba9f62` (2026-10-12) unless marked as an estimate.
Estimates are HOURS as low / likely / high for (a) one experienced human developer and (b) our AI setup
(GLM builder + Opus/Claude UI + Grok review + founder review time). Token/API cost excluded; "AI setup"
hours are founder wall-clock while driving the agents.

## 7. SUMMARY TABLE (read this first)

| Option | What | AI-setup hours (low/likely/high) | Weeks @40 h | Risk | Verdict |
|---|---|---|---|---|---|
| **A — Keep renovating** | Strangler-renovate `apps/forum` screen-by-screen (U1–U3 pattern) + backend CLEAN + hygiene pass | 200 / **280** / 420 | 5 / **7** / 10.5 | Medium: legacy UI leaks, dual-path discipline | **RECOMMENDED** |
| **B — New `apps/web` + clean backend** | Fresh frontend for S00–S13 reusing design-tokens + feed-* + shell/motion; backend CLEAN; delete old forum | 240 / **330** / 500 | 6 / **8.3** / 12.5 | Medium-high: re-plumb auth/editor/hooks, test guard lost during swap | Viable if you want a hard cut (+~50 h) |
| **C — Rebuild everything** | New backend + new frontend to same feature level | 280 / **380** / 620 | 7 / **9.5** / 15.5 | High: parity traps, demo-world + 1,246-test safety net discarded, keys still external | Not justified — backend is healthy enough to keep |

**Recommendation: A.** The backend is tested, structured, and demo-world-proven — its problems are enumerated
and fixable (FEED-GAP, dead tables), not structural. The renovation path is already proven end-to-end
(S00 foundation + feed U1–U3 merged in 14 days with full spec/review ceremony). B buys a cleaner tree for
~+50 h AI but throws away ~8–10k LOC of working, tested composer/editor/thread code that S03/S04 need anyway.
C is dominated by A and B on every axis.

## Method / evidence base

Measured: `git ls-files`, `wc -l`, `grep`, `git log` (266 commits, 2026-09-05 → 2026-10-12, 19 active days,
14 merges, 4 author identities), `graphify-out/tables.json` (rebuilt after U3 merge), and both test suites
re-run for this report: **forum 1,095/1,095 passed (86 files, 27.8 s)** and **root convex/scripts 151/151
passed (18 files, 2.7 s)**. Calibration anchors for estimates: (1) Phases 1–7 — the whole ~97k-LOC reference
app — were built by the AI setup in 6 days (09-05 → 09-10); (2) the redesign ceremony (spec → build → Grok →
Opus verdict → founder rulings) delivered S00 + feed U1–U3 in 14 days. Human baselines use 50–150 tested
LOC/dev-day, adjusted for Convex boilerplate density and complete PRD docs.

## 1. INVENTORY (measured)

Repo: 1,636 tracked files · 306 Markdown files (34,902 lines) · 222 tracked PNGs (47.0 MB) · `.git` = 98 MB.
Code (excl. docs/tests mixed in): apps 49,625 + packages 2,795 + convex 38,404 + scripts 6,155 ≈ **97k LOC**.

| Area | Files | Lines | Disk | Running app needs it? | Class |
|---|---|---|---|---|---|
| `apps/forum` (member app) | 378 | 38,551 | 825 MB† | Yes — `/feed` etc. on :3000 | RUNTIME (mixed: `/lab/*` 12 files = dev-only TEST; pre-redesign UI = RUNTIME until S03–S13 rebuilt) |
| `apps/admin` (staff console) | 72 | 8,539 | — | Yes — `/admin/*` on :3001 | RUNTIME (not customer-facing; unaffected by A/B) |
| `apps/seller` + `apps/marketplace` | 42 | 2,535 | — | No — parked placeholders (one page each) | JUNK → archive |
| `packages/auth-ui` | 14 | ~1,400 | — | Yes — imported by forum, admin, seller, marketplace | RUNTIME (shared; must survive any frontend swap) |
| `packages/design-tokens` | 2 | 1,396 | — | Yes — tokens.css + utilities.css single source (S00-T01) | RUNTIME |
| `packages/convex-client` | 3 | tiny | — | Yes — env helper | RUNTIME |
| `convex/` (26 modules) | 160 | 38,404 | 3.3 GB† (`.convex/` state) | Yes — local open-source backend | RUNTIME + DEMO (`demoWorld/` 11 files, `dev/` 2, `seed/` 3 live inside the prod backend — tagged in tables.json as `demo_seed` class, 148 writer edges) |
| `scripts/` | 54 | 6,155 | — | Partly | DEMO (`demo-world/` engine, ~30 files, P0–P6) + ops RUNTIME (`session-*`, `reset-local`, `seed-*`) + TEST (`capture-baselines`, `t0x-*` visual gates) |
| `tests/` (root suite) | 18 | 1,867 | — | Keeps backend safe | TEST |
| `docs/` (the PRD) | 160 | 19,862 | — | Contracts feed CI cap-coverage gate (572/572) | LIVING-DOC (small HISTORY pockets: resolved open-items, superseded notes) |
| `ak-redesign/00-control/` | 143 | 7.6k MD + 105 PNG | — | Active control plane (STATUS, DECISIONS, CRs, SCREEN-INVENTORY: 65 screens) | LIVING-DOC + HISTORY (`_archive/` 39 PNGs) |
| `ak-redesign/specs/` | 461 | 5,118 | 599 MB† | Live specs + refs | LIVING-DOC (FEED-DESIGN, FEED-GAP, S00/S02 specs) + HISTORY (`S02-refs/` = 285 tracked files: full vendored prototype app, 225 ts/tsx + 18 PNG — obsolete once S02 ships) + TEST (evidence dirs: 157 screenshots across FEED-B1/U1/U2/U3, S00, L77) |
| `graphify-out/` (4 tracked) | 4 | 261,489 | 8.6 MB | No — regenerable (`graphify update .`) | Generated; `tables.json` + `manifest.json` earn their keep, `graph.json`/`GRAPH_REPORT.md` are archive candidates |
| `convex/_generated/` | 7 | — | — | Yes — codegen output, correctly tracked for Convex | Generated (required) |
| `.github/` (CI, dependabot) | 4 | — | — | Yes — CI gate | RUNTIME |
| Root `AGENTS.md`, `CHANGELOG.md`, `SETUP.md`, workspace configs | ~10 | — | — | Yes | LIVING-DOC / RUNTIME |

† Disk = untracked local state (node_modules, `.next`, `.convex/` 3.3 GB, `.demo-world-cache/` 130 MB, prototype node_modules inside `ak-redesign/specs/S02-refs/prototype/`). All correctly gitignored — but see §6.

**Demo world**: engine = `scripts/demo-world/` (~30 files) + `convex/demoWorld/` (11 importers) + `.demo-world-cache/` 130 MB local. Content (1,500 posts / 8,374+ comments / 500 members) lives in the local Convex DB, snapshotted outside the repo (`../demo-snapshot-2026-10-11.zip`, `../convex-backup-2026-10-11`). Verdict: keep — it is the only end-to-end proof the backend works at volume.

## 2. CLEANUP COST (archive HISTORY + JUNK, keep app + tests green)

Scope, measured: seller+marketplace (42 files), `/lab` pages (12), `S02-refs/` (285 files), `_archive/` +
stale evidence PNGs (~200 files, ~45 MB), graph.json/GRAPH_REPORT (2 files, ~8 MB), 9 dead tables +
14 no-writer tables from schema (needs a local migration rehearsal), stale remote branches (~10 of 31),
resolved docs pockets. Everything moves to an `archive/pre-cleanup-2026-10` branch + tag — nothing lost.

| | low | likely | high | Confidence |
|---|---|---|---|---|
| (a) one human dev | 24 | 45 | 80 | High on file scope (fully enumerable); medium on table drops |
| (b) AI setup | 6 | 10 | 18 | High — moving files is trivial; the cost is re-running every gate (typecheck, 1,095+151 tests, cap-coverage 572/572, `seed:check` fingerprint 0ef8369aa5d8, visual baselines, e2e smoke) after each batch |

## 3. BACKEND HEALTH — verdict: **CLEAN UP** (not rebuild)

Structure: domain-organized (26 modules: admission, ingest, qualify, editorial, jobs, admin, persona,
store, demoWorld…), 3,288-line schema, **177 tables** (AGENTS.md's "89-table" note is stale), **456 exported
functions** (82 query, 182 mutation, 143 internalMutation, 23 internalQuery, 26 actions), **45 crons**,
2 httpActions. Instrumentation is real: `graphify-out/tables.json` maps every writer/reader per table with
`prod` vs `demo_seed` classes (372 prod writer / 523 prod reader / 148 demo writer edges; 392 distinct
functions touch tables).

Honest deficits (all measured):
- **9 dead tables** (no writer AND no reader): deployLog, outcomeDefinitions, personaStyleBaseline, postGigs,
  postLaunchPads, threadPositions, threadQuestions, threadThemes, vouches. **14 tables have no writer** (the
  above + analyticsReconcileResults, jobDeadLetters, reviewConflicts, seoHealth, similarityChecks).
- **FEED-GAP** (`ak-redesign/specs/FEED-GAP.md:179`): prod has **no writers for post counters (CR-014), day
  buckets (CR-013), post saves, exposure events** → Top/Hot/Vibing/Rising/Fav rankings are flat in prod.
- Dead-function risk: 264 public functions vs ~110 distinct `api.*` references across forum+admin. Many of
  the remainder are legitimately cron/internal-called, but a verified call-graph sweep has not been done.
- Demo machinery (demoWorld/dev/seed) is deployed inside the prod function surface — works, tagged, but mixed.
- External blockers (not code): GLM API key + moderation-classifier key still missing — the qualify pipeline
  holds every candidate until wired (founder-owned, unchanged by any option).
- Test coverage: 151 root tests (pure logic + scripts + integration) — good on libs/gates, thin on function
  behaviour (no per-function Convex tests; convex-test skill now available to close this).

| Estimate | low | likely | high | Confidence |
|---|---|---|---|---|
| (i) CLEAN it (FEED-GAP writers, dead-table removal, demo/prod separation, unused-fn sweep, schema-doc sync) — AI setup | 30 | 50 | 80 | Medium — FEED-GAP scope is well-specified in CR-013/014; the unknown is how many "unreferenced" fns are load-bearing via crons |
| (i) CLEAN it — one human dev | 150 | 250 | 400 | Medium |
| (ii) REBUILD from scratch to same feature level (assumption: M1–M18 = full parity with today's convex/: 177 tables, ~456 fns, 45 crons, 151 tests, pipelines, demo-world import) — AI setup | 70 | 110 | 170 | Low-medium — anchored on Phases 1–7 taking ~40–60 h AI total; rebuild adds parity-testing and re-discovery of decisions that today live only in code |
| (ii) REBUILD — one human dev | 800 | 1,400 | 2,200 | Low-medium — 38.4k backend LOC at 50–150 tested LOC/day with complete PRD |

## 4. FRONTEND

**What admin is:** `apps/admin` — the staff console (`/admin/*`, port 3001; curation, resources, store,
widgets). It shares `convex/` + `packages/auth-ui` + `packages/convex-client` and is **unaffected by A and B**
as long as those packages survive (verified: admin imports auth-ui in 7 files).

| Estimate | low | likely | high | Confidence |
|---|---|---|---|---|
| (i) REMOVE old frontend (delete `apps/forum` 378 files / 38.5k lines + its 86 test files + CI/forum wiring; keep admin + packages) — AI setup | 4 | 7 | 12 | High — mechanical; cost is CI/workspace unwiring and keeping admin green |
| (i) REMOVE — one human dev | 20 | 35 | 60 | High |
| (ii) BUILD new `apps/web` for S00–S13 (65-screen inventory; ~8 screens' equivalent already built: S00 foundation, S02 feed+search display+wiring, auth modal prototype; remaining ≈ 55 screens over 12 specs, reusing design-tokens 1.4k lines, feed-* 22 comps / 3.1k lines, U3 shell/motion, auth-ui, existing queries) — AI setup | 180 | 260 | 400 | Medium — anchored on observed 14 days for S00+feed with full ceremony; per-spec spread is wide (notifications ≈ 0.5 day vs composer/discussions/storefront 3–5 days) |
| (ii) BUILD — one human dev | 800 | 1,300 | 2,000 | Medium |
| (iii) RENOVATE `apps/forum` to the same result (strangler per screen; retire old comps via L-51-style rulings; keep composer/TipTap, canonical-thread per-type bodies, 1,095-test guard) — AI setup | 150 | 220 | 330 | Medium-high — this is the proven path (U1–U3 executed exactly this way) |
| (iii) RENOVATE — one human dev | 700 | 1,100 | 1,700 | Medium |

**Cheaper: renovate (iii), by ~15–25% both for AI and human.** Renovation keeps ~8–10k LOC of working,
tested code the new screens still need (TipTap composer, per-type discussion bodies, canonical-thread
strangler, e2e smoke) and keeps the 1,095-test guard alive throughout; a new app pays to re-plumb auth
gating, editor loading, pipeline hooks, and rebuilds a test suite from zero mid-swap. The new-app premium
(~+40–80 h AI) buys a smaller tree and no dual-path period — a risk-preference call, not a cost call.

## 5. COST — calendar weeks, solo founder ~40 h/week with the AI setup

| Option | AI hours (low/likely/high) | Weeks (low/likely/high) | Main risks |
|---|---|---|---|
| A renovate + clean backend + cleanup | 200 / 280 / 420 | 5.0 / 7.0 / 10.5 | Legacy UI regressions leaking into beta; dual-path discipline during transition; FEED-GAP writers touch ranking — needs staged rollout; GLM/classifier keys still external and gate the pipeline regardless of choice |
| B new frontend + clean backend | 240 / 330 / 500 | 6.0 / 8.3 / 12.5 | Same backend risks + auth/editor re-plumbing surprises; test guard lost during swap; two frontends to maintain until cutover; demo world needs re-pointing |
| C rebuild everything | 280 / 380 / 620 | 7.0 / 9.5 / 15.5 | Parity traps (behavior only in code); demo-world + seeds rebuilt; 1,246-test net discarded; longest review fatigue; still blocked on the same external keys |

Common risk worth naming: these are founder wall-clock estimates assuming the current review cadence
(founder rulings + Grok per task + Opus verdicts). Founder availability is historically the pacing item —
spec rounds went stale ×4 on U3 alone.

## 6. REPO HYGIENE — recommendations for THIS repo, and today's violations

**Folder structure.** Keep `apps/` + `packages/` + `convex/` + `tests/` + `scripts/`. Move demo tooling to
`scripts/demo-world/` (already true) and consider `convex/demoWorld/` → gated behind a build flag or a
separate convex project later (CR-worthy; territory rule applies). Docs: `docs/` = PRD reference (freeze
after beta), `ak-redesign/00-control/` = living control plane (STATUS, DECISIONS, CRs) — this split is right.

**Branches.** Today: main is **166 commits behind feed-base** (last merge to main = PR #7, 2026-09-18), 31
remote branches, ~10 stale. Rule: `feed-base` (or `011`) is the integration branch; merge to **main every
2 weeks** via PR with the full CI gate; delete remote branches on merge; dependabot branches merge or close
within a week.

**Commits/PRs.** Keep the `[AREA][TYPE][AGENT]` prefix convention but cap subject ≤100 chars and body ≤20
lines (recent subjects run to multi-line essays — searchable, but noisy). One CHANGELOG line per accepted
spec / backend change (already rule D-006 — enforced only by reminder workflow today; make CI check it).
Four git author identities for two humans + agents: add a `.mailmap` and an agent-identity convention.

**What breaks the rules today (measured):**
1. **47 MB / 222 PNGs tracked in git** (evidence screenshots + baselines; `.git` already 98 MB). Evidence
   should live outside git (a `evidence/` folder in cloud storage, or GitHub issues/wiki attachments, or
   LFS if it must be in-repo). Baselines needed by the visual-diff gate are the only PNGs that belong in git.
2. **Vendored prototype inside `ak-redesign/specs/S02-refs/prototype/`** — 285 tracked files including its
   own `node_modules` on disk (599 MB folder). Every recursive tool trips on it (this assessment's own grep
   hit path warnings). Reference repos belong in a sibling checkout (`../CEfrontend`), referenced by commit
   hash in the spec — not copied into the tree.
3. **`graph.json` + `GRAPH_REPORT.md` tracked (8.6 MB, regenerable)** — keep `tables.json` + `manifest.json`
   (small, load-bearing for audits like this one), regenerate the rest on demand.
4. main 166 behind + stale branches (above).
5. AGENTS.md stale facts ("89-table" vs measured 177) — control docs should cite measured values or none.

**.gitignore.** Already correct for the heavy local state (`.convex/` 3.3 GB, `.demo-world-cache/` 130 MB,
`.next/` 825 MB, node_modules). Add: `*.tsbuildinfo` anywhere (present), `tests/integration/components/`
(present) — fine. Nothing material missing.

**Evidence/screenshots.** Convention going forward: evidence for a verdict lives in `ak-redesign/specs/*-evidence/`
**only for open reviews**, is deleted (from tip, kept in history) once the spec is ACCEPTED; long-term proof
artifacts go to the archive branch, not mainline. This keeps git growth bounded without losing audit trail.

**Generated files.** `convex/_generated/` tracked (correct for Convex), `graphify-out/` as above,
`.demo-world-cache/` ignored (correct). Add a CI step that fails if a PR adds >1 MB of binaries.

**CI.** Current gate is genuinely good: typecheck + lint (forum + admin), 1,095 forum tests, 151 root tests,
e2e smoke, cap-coverage 572/572. Add: binary-size budget, CHANGELOG-line check (replaces the reminder-only
workflow), branch-staleness cron, and — once written — a convex-test suite gate for writer functions
(FEED-GAP class of bug: ranking silently flat because a writer never existed).

### One-page rulebook (adopt as `00-control/REPO-RULES.md`)

1. Territories per TEAM-WORKFLOW.md: redesign = founder/agents (`ak-redesign/**`, forum UI); backend = dev
   (`convex/**`); cross-territory ⇒ CR. 2. Integration branch merges to main every 2 weeks; merged remote
   branches deleted same day. 3. No binaries >500 KB in git; evidence PNGs are deleted after ACCEPTED;
   baselines exempt. 4. Vendored third-party code is forbidden — reference by commit hash instead. 5.
   `graphify update .` after code merges; only tables.json + manifest.json are load-bearing. 6. Every
   accepted spec/backend change gets one CHANGELOG line in the same PR (CI-enforced). 7. Commit subject
   ≤100 chars, body ≤20 lines, `[AREA][TYPE][AGENT]` prefix. 8. New backend writers ship with a convex-test
   (negative authz + happy path) — no silent no-writer tables. 9. Control docs quote measured numbers, and
   get re-measured when they make claims (no "89-table" folklore). 10. Before deleting anything: archive
   branch + tag first; nothing is ever lost, only moved.

## Assumptions & confidence log

- "M1–M18" interpreted as full parity with today's backend feature level (no such milestone list exists in
  the repo; if it means less, rebuild estimates drop proportionally). Confidence: low on the label, medium
  on the parity anchor.
- AI-setup hours = founder wall-clock at observed cadence (266 commits / 37 days; Phases 1–7 ≈ 6 days;
  S00+U1–U3 ≈ 14 days), including founder rulings, Grok reviews, Opus verdicts; excludes waiting on API
  quotas and the external GLM/classifier keys.
- Human estimates assume one experienced dev, full-time, with the PRD docs as spec — no agent assistance.
- Screen count basis: SCREEN-INVENTORY.md = 65 screens; ~8 screens' equivalent built; S01, S03–S13 not
  started (STATUS.md 2026-10-12). Beta line = S00–S13 done + SEC pass (D-005).
- Test counts verified by running both suites during this assessment; all green on feed-base @ 5ba9f62.
