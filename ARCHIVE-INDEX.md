# ARCHIVE-INDEX — CE-MVP frozen archive map

CE-MVP is the **frozen archive** of the Createconomy PRD build (founder decision L-90,
2026-10-12). This repository is read-only from here on. The living backend + demo world +
backend tests + design tokens + docs were migrated to **CEY-PLATFORM**
(github.com/contactcreateconomy/CEY-PLATFORM, private) on 2026-10-12; the full migration log
is `docs/06-ops/MIGRATION-LOG.md` there.

- **Frozen point:** branch `feed-base` @ `96ae407`, tagged `archive/final-2026-10-12`
  (1,638 tracked files; this branch `archive-index` = that commit + only this file).
- **Nothing was deleted:** every file below still exists here, at the paths listed.
- **Known delta:** `ak-redesign/specs/FEED-DESIGN.md` here is the L-89 version; the canonical
  L-91 version (attached by the founder 2026-10-12) lives in CEY-PLATFORM at
  `docs/03-specs/FEED-DESIGN.md`.

## How to restore a file into CEY-PLATFORM

```bash
# from a CEY-PLATFORM checkout:
git -C ../CE-MVP show archive/final-2026-10-12:<path-in-this-repo> > <new-path>
# e.g. git -C ../CE-MVP show archive/final-2026-10-12:apps/forum/src/app/(app)/(shell)/feed/page.tsx > /tmp/feed-page.tsx
```
Pick the CE-MVP side from this index; place it per the destination's own conventions.
The manifest mapping (KEEP / KEEP-MOVED / ARCHIVE buckets, file-by-file for mixed dirs) is
`ak-redesign/CLEAN-PLAN.md` §2 — the authoritative "where did it go" table.

## 1. Frontend apps — archive-only (492 + 20)

| Path | Files | What / why |
|---|---|---|
| `apps/forum/` | 378 | The member Next.js app (Phases 1–7 + U1–U3 feed rebuild; /feed, /discussions, /new-post). To be rebuilt in CEY-PLATFORM per FEED-DESIGN L-91 (community app first). |
| `apps/admin/` | 72 | Staff console (/admin/*, port 3001). Rebuilt later per L-91. |
| `apps/seller/` | 21 | Parked placeholder app. |
| `apps/marketplace/` | 21 | Parked placeholder app. |
| `packages/auth-ui/` | 14 | Auth modal + providers reference implementation (@cemvp/auth-ui). |
| `e2e/` (3) + `playwright.config.ts` | 4 | Playwright E2E specs + config. |
| `scripts/{capture-baselines,t01-visual-diff,t02-css-identity,t02-glow-values-check,t03-evidence}.mjs` | 5 | Visual-diff/evidence tooling for the frontend labs. |

## 2. Packages — migrated (19)

| Path | Files | What / why | Now lives at |
|---|---|---|---|
| `packages/design-tokens/` | 2 | tokens.css + utilities.css — the design source of truth | CEY-PLATFORM `packages/design-tokens/` |
| `packages/convex-client/` | 3 | isConvexConfigured()/getConvexUrl() env helper | CEY-PLATFORM `packages/convex-client/` |
| `packages/auth-ui/` | 14 | (see §1 — frontend) | archive-only |

## 3. Backend — migrated (convex + tests + demo + ops + audit inputs)

| Path | Files | What / why | Now lives at |
|---|---|---|---|
| `convex/` | 160 | The Convex backend: 177 tables, 456 functions, 45 crons (incl. `demoWorld/`, `dev/`, `seed/`, `_generated/`) — copied byte-for-byte | CEY-PLATFORM `convex/` |
| `tests/` | 18 | Backend suites (convex/integration/scripts = 151 tests) | CEY-PLATFORM `tests/` |
| `scripts/demo-world/` | 34 | Demo-world engine P0–P6 + prompts + reports + run logs | CEY-PLATFORM `scripts/demo-world/` |
| `scripts/{local-setup,reset-local,seed-check,seed-check-proof,seed-demo,session-start,session-end,sync-components,gen-table-index,graph-explain}.mjs` + `lib/` (3) + `seed-fingerprint.txt` | 14 | Ops scripts (moved under `scripts/ops/`, paths fixed) | CEY-PLATFORM `scripts/ops/` |
| `graphify-out/{tables.json,manifest.json}` | 2 | Table-writer audit inputs | CEY-PLATFORM `graphify-out/` |
| `graphify-out/{graph.json,GRAPH_REPORT.md}` | 2 | Regenerable graph artifacts (tracked here, ignored there — regenerate with `graphify update .`) | regenerable |

## 4. Docs history — split (160 tracked; 30 migrated + 130 archive-only)

| Path | Files | What / why |
|---|---|---|
| `docs/01-product-spec/_data-model.md` | 1 | Canonical entities + enums → CEY-PLATFORM `docs/01-product/_data-model.md` |
| `docs/04-design-system/STYLE-KIT.md` | 1 | Tokens/components spec → `docs/02-design/STYLE-KIT.md` |
| `docs/06-open-items/{DECISIONS-LOCKED,OPEN-DECISIONS,SECURITY-FIX-QUEUE-R2}.md` | 3 | Decision registers → `docs/04-decisions/` + `docs/05-backend/` |
| `docs/00-project-status/{00-TOPOLOGY,00-TRANSITION}.md` | 2 | Binding architecture decisions → `docs/05-backend/` |
| `docs/05-build-sheets/M0–M18` | 19 | Backend milestone sheets → `docs/05-backend/build-sheets/` |
| `docs/{AGENT-START-HERE,AGENT-MEMORY,DEV-HANDOFF,FOUNDER-BOOTSTRAP}.md` | 4 | Operating docs → `docs/06-ops/` (START-HERE + others rewritten backend-only there) |
| `docs/01-product-spec/CAPABILITY-REGISTER-MERGED.md`, `MASTER-SCREEN-INVENTORY-MERGED.md`, `00-ROUTES.md`, `PROJECT-STATUS.md`, `BIBLE-FIXES.md`, `FINAL-HOLISTIC-AUDIT.md`, `KNOWN-UI-GAPS.md`, `SCREEN-SCORES.md`, `DESIGN-SYSTEM-OPEN-ITEMS.md` | 9 | PRD build registers + audits — archive-only (frontend program history) |
| `docs/02-contracts/` (56), `docs/03-slices/` (11), `docs/screens/` (54) | 121 | Screen contracts, slice catalogs, screen copies — archive-only |
| `SETUP.md` | 1 | Historical run guide (paths predate the monorepo layout) |
| `scripts/cap-coverage.mjs` | 1 | CAP→slice coverage gate (reads the archived registers) — archive-only |

## 5. Redesign control — mostly migrated (ak-redesign/00-control etc.)

| Path | Files | What / why |
|---|---|---|
| `ak-redesign/00-control/DECISIONS.md` | 1 | Redesign decision register D-001…D-017 → CEY-PLATFORM `docs/04-decisions/redesign-DECISIONS.md` |
| `ak-redesign/00-control/crs/` | 16 | CR REQUEST/RESPONSE pairs → `docs/04-decisions/crs/` |
| `ak-redesign/00-control/CONVENTIONS.md` | 1 | Working conventions → `docs/06-ops/redesign-CONVENTIONS.md` |
| `ak-redesign/00-control/SCREEN-INVENTORY.md` | 1 | 65-screen build backlog (living) → `docs/01-product/SCREEN-INVENTORY.md` |
| `ak-redesign/00-control/{STATUS,CURRENT-STATE,SPEC-INDEX,PM-BRIEF,OPUS-HANDOFF-GT}.md`, `history/**` (12), `session-log/**` (2), `baselines/**` (66), `_archive/**` (39) | 122 | Redesign control plane + evidence history — archive-only (the new repo's living control docs are its `docs/06-ops/` set) |
| `ak-redesign/01-vision/CEY-VISION.md` | 1 | Product vision → `docs/00-vision/CEY-VISION.md` |
| `ak-redesign/TEAM-WORKFLOW.md` | 1 | Three-machine workflow → `docs/06-ops/TEAM-WORKFLOW.md` (rewritten backend-only there) |
| `ak-redesign/CLEAN-PLAN.md` | 1 | The backend-only clean plan (this migration's reference) → `docs/06-ops/CLEAN-PLAN.md` |
| `ak-redesign/README.md`, `templates/**` (6), `evidence/**` (2) | 9 | Redesign entry + build templates — archive-only |

## 6. Specs + evidence (ak-redesign/specs)

| Path | Files | What / why |
|---|---|---|
| `ak-redesign/specs/FEED-DESIGN.md` | 1 | THE living feed spec (L-89 here; **L-91 canonical is in CEY-PLATFORM `docs/03-specs/FEED-DESIGN.md`**) |
| `ak-redesign/specs/DESIGN-BIBLE.md` | 1 | Design foundation (L-71) → `docs/02-design/DESIGN-BIBLE.md` |
| `ak-redesign/specs/FEED-GAP.md` | 1 | Live backend gaps CR-013/014 → `docs/03-specs/FEED-GAP.md` |
| `ak-redesign/specs/DEMO-WORLD-SPEC.md` | 1 | Demo-world spec → `docs/03-specs/DEMO-WORLD-SPEC.md` |
| `ak-redesign/specs/{FEED-B1,S00,L77,FEED-U2,S02,FEED-U1,FEED-U3}-evidence/**` | 157 | Build/review evidence for accepted specs — archive-only |
| `ak-redesign/specs/S02-refs/**` | 285 | Vendored prototype reference (CEfrontend) — archive-only; see the spec for its commit hash |
| `ak-redesign/specs/` build/review docs (FEED-B1/U1/U2/U3-BUILD, S00-*, S02-*, L77) | ~16 | Phase build + review records — archive-only |

## 7. Reports (1)

| Path | Files | What / why |
|---|---|---|
| `ak-redesign/REPO-ASSESSMENT.md` | 1 | The 2026-10-12 measured assessment that led to L-90 — archive-only (quoted by CEY-PLATFORM `docs/06-ops/REPO-RULES.md`) |

## 8. Agent + CI configs — migrated

| Path | Files | What / why | Now lives at |
|---|---|---|---|
| `.agents/` (41), `.claude/` (45), `.codex/` (1), `.cursor/` (1) | 88 | Agent skills/hooks/rules (Convex skill set) — copied verbatim | CEY-PLATFORM same paths |
| `.github/workflows/{ci,convex-prod-deploy,wiki-tracker-sync}.yml`, `.github/dependabot.yml` | 4 | CI — ci + prod-deploy + dependabot rewritten/copied in CEY-PLATFORM; wiki-tracker-sync dropped (no wiki there) | CEY-PLATFORM `.github/` |

## 9. Root files (18)

`AGENTS.md`, `README.md`, `CLAUDE.md`, `CHANGELOG.md`, `LICENSE` (rewritten/continued in
CEY-PLATFORM) · `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig` (per-app),
`vitest.config.ts`, `convex.json`, `.nvmrc`, `.gitattributes`, `.gitignore`,
`.graphifyignore`, `.claudeignore`, `skills-lock.json` (authored fresh or adapted there) ·
`SETUP.md`, `playwright.config.ts` (archive-only).

— End of index. Every top-level entry of this repository appears above; the file-by-file
mapping is `ak-redesign/CLEAN-PLAN.md` §2.
