# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Read `AGENTS.md` first — it is the canonical operating doc for this repo** (read order, hard rules, open items). This file summarizes the essentials; the PRD itself lives under `docs/` (internal doc references to `PRD/x` mean `docs/x`; `PRD/app` means the repo root).

## What this is

Createconomy — a curated creator-discussion platform (typed-post forum, labeled AI-persona discussions, claims-first editorial pipeline, tool registry, reputation economy). pnpm monorepo: `apps/forum` (member Next.js app), `apps/admin` (staff console on port 3001), `convex/` (shared Convex backend, ~90-table schema), `packages/auth-ui` + `packages/convex-client`, and the full build spec in `docs/`. Phases 1–7 are code-complete; `apps/seller` and `apps/marketplace` are parked placeholders — keep them buildable, never build them out.

## Commands (from repo root)

| Command | What it does |
|---|---|
| `pnpm dev` | Forum dev server → http://localhost:3000 (`/` redirects to `/feed`) |
| `pnpm dev:admin` | Admin console → http://localhost:3001 (`/` redirects to `/admin`) |
| `pnpm typecheck` / `pnpm lint` | `tsc --noEmit` / ESLint for the forum app (lint enforces `--max-warnings 0`) |
| `pnpm test:run` | Forum Vitest suite (jsdom, colocated at `apps/forum/src/**/__tests__/`) |
| `pnpm test:convex` | Root Vitest — Convex unit tests (`tests/convex/`) + convex-test integration (`tests/integration/`); runs `scripts/sync-components.mjs` first |
| `pnpm test:e2e` | Playwright E2E (`e2e/`); starts its own dev server on :3000 |
| `pnpm build` | Forum production build (Turbopack) |
| `node scripts/cap-coverage.mjs` | PRD capability coverage gate — expect 572/572 |
| `pnpm convex:dev` / `pnpm convex:codegen` | Push Convex functions / regenerate `convex/_generated/` |
| `pnpm convex:seed-legal` | Seed the 4 legal docs (idempotent, needs `npx convex login` once) |
| `pnpm convex:deploy:prod` | Prod push — **Bucket-1: flag to founder before running** |

Single test: `pnpm --filter ./apps/forum test:run -- src/path/__tests__/file.test.tsx` · root suite: `pnpm exec vitest run tests/convex/lib-glm.test.ts` · one E2E: `pnpm test:e2e e2e/smoke.spec.ts`.

Toolchain: **Node 24** (`.nvmrc`, CI), pnpm 10 pinned via `packageManager`, **Convex pinned to 1.34.1** via pnpm override. Root `pnpm dev`/`typecheck`/`lint`/`test:run`/`build` target `apps/forum`; admin has `pnpm dev:admin` / `typecheck:admin` / `lint:admin` / `build:admin`. Seller/marketplace remain parked.

## Testing architecture (three separate suites)

1. **Forum unit** — Vitest 4 + Testing Library, jsdom, configured in `apps/forum` only. Tests colocated next to components.
2. **Convex backend** — root `vitest.config.ts`. `*.test.ts` files **cannot live under `convex/`** (the Convex bundler would deploy them), so pure-logic tests import from `convex/` into `tests/convex/`; integration tests in `tests/integration/` run real schema + the `@convex-dev/rate-limiter` component through `convex-test` (component files are copied in by `scripts/sync-components.mjs`).
3. **E2E** — Playwright at root, chromium only. Pipeline E2Es (submit → H-SAFE → qualify) are quarantined behind `E2E_PIPELINE_ENABLED` until the founder-owned `GLM_API_KEY` / `MODERATION_CLASSIFIER_API_KEY` land (both fail closed).

CI (`.github/workflows/ci.yml`) runs every gate above on **PRs into `main` and pushes to `main`**. `001-default` is an ordinary feature branch, not a CI target. Convex function deploys stay manual (`pnpm convex:dev` / `pnpm convex:deploy:prod`); `convex-prod-deploy.yml` is an optional `PROD-DEPLOY` confirmation path and is not triggered by merge.

## Hard rules (non-negotiable — from AGENTS.md §4–5)

1. Never invent a token, color, spacing value, or component pattern not in `docs/04-design-system/STYLE-KIT.md` — stop and report instead.
2. Never build a capability or screen not in the capability register (572 CAP-XXX rows) / screen inventory (54 screens). No "usual product" surfaces.
3. UI/state/action conflicts: the screen CONTRACT (`docs/02-contracts/`) wins; scope/dependencies: the SLICE CATALOG (`docs/03-slices/`) wins. Flag conflicts, never silently pick.
4. Something ambiguous or missing → STOP and report. Never fill gaps with assumptions (especially founder/legal-owned copy).
5. **Never write a legacy `forum*` table** (00-TRANSITION: strangler pattern; legacy tables are disposable demo data).
6. Live route names are canonical and supersede contract text: `/discussions/[slug]`, `/new-post`, `/users/[handle]`, `/profile`, `/settings`. Don't rename routes to match contracts.

Before any slice/screen, the mandatory read order is `docs/AGENT-START-HERE.md` §2 → `docs/01-product-spec/_data-model.md` (every table/field/enum must match verbatim) → capability register → screen inventory → STYLE-KIT. Scan `docs/AGENT-MEMORY.md` section headers for prior lessons; append new ones there (append-only).

## Architecture

- **Frontend** `apps/forum`: Next.js 16 App Router, React 19, TS strict. Route groups under `src/app/`: `(app)/(shell)` (feed + main surfaces), `(app)/(content)`, `(auth)`, `(compose)`. Tailwind v4 tokens live in `src/app/globals.css` (`@theme inline`) — never use raw hex/px where a named token exists. Radix primitives + `cva`/`clsx`/`tailwind-merge`; Zustand stores in `src/stores`; TipTap composer is `React.lazy`-loaded (keep it that way).
- **Admin** `apps/admin`: staff console at `/admin/*` (port 3001). Same Convex backend + `@cemvp/auth-ui`. Forum `/admin` redirects here.
- **Convex providers**: components using `useQuery` must sit under `ConvexProvider`; guard with `isConvexConfigured()` where pages must prerender without a Convex URL. Use `useSharedData()` (SharedDataProvider) for categories + unread count — don't duplicate `listCategories` subscriptions.
- **`next.config.mjs`** pins `convex` + `@convex-dev/auth` to the forum's own copies via resolveAlias (shared React context under Turbopack) — don't remove.
- **Backend** `convex/`: single `schema.ts` (~90 tables) + `crons.ts` + module dirs (`admission`, `forum`, `ingest`, `qualify`, `editorial`, `posts`, `admin`, `moderation`, `economy`, `lib`, …). Content pipeline: ingest → H-SAFE/moderation + qualify (AI, fail closed without keys) → human editorial review with evidence → publish.
- **Env**: forum and admin both read `NEXT_PUBLIC_CONVEX_URL` via `@cemvp/convex-client`. Forum also uses `NEXT_PUBLIC_ADMIN_ORIGIN` (redirects `/admin` → port 3001). Admin uses `NEXT_PUBLIC_FORUM_ORIGIN` for “back to the feed”. Backend secrets in `convex/.env` (see `convex/.env.example`). Convex cloud: **dev** `watchful-chameleon-570` (`https://watchful-chameleon-570.convex.cloud`) · **prod** `energetic-kangaroo-55` (`https://energetic-kangaroo-55.convex.cloud`). Vercel Preview → dev; Vercel Production → prod. HTTP Actions / OAuth callbacks use `*.convex.site`.
- **Reference implementations** (extend, never build parallel versions): the feed (`(app)/(shell)/feed` + `components/feed/`), the auth modal (`packages/auth-ui`), and `/discussions/[slug]` (canonical `postSeoMeta` first, legacy thread fallback).

## Process & tracking

- **Git:** work on numbered topic branches (`NNN-name`); PR target is **`main`** (production/default). `001-default` is a feature branch.
- **Definition of done per slice:** CHANGELOG entry + wiki tracker update in the same session (wiki is its own git repo — see AGENTS.md §11). `wiki-tracker-sync.yml` posts a reminder if CHANGELOG wasn't touched.
- **Bucket-1 items** (Convex CLI deploys, package installs, external accounts/keys) → stop, flag, hand off via `docs/DEV-HANDOFF.md`; founder-only steps in `docs/FOUNDER-BOOTSTRAP.md`.
- Status of built vs. remaining: `docs/00-project-status/PROJECT-STATUS.md`.

## Gotchas

- A long-running dev server accumulates a stale Turbopack graph — module-not-found errors after adding files mean **restart `pnpm dev`**, not a code bug.
- `npx convex run` needs the colon form for nested function names (`rulebook:deploySeed`) on convex 1.34.
- Until legal docs are seeded, `/privacy`, `/terms`, `/dmca`, `/repeat-infringer` render the contract-sanctioned `unavailable_pending_legal` state — by design.

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
