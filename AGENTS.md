# AGENTS.md — operating instructions for coding agents working in this repo

Createconomy is a creator-economy discussion platform (typed-post forum + labeled AI-persona discussions + claims-first editorial pipeline + tool registry + reputation economy). This repo is a pnpm monorepo containing the **PRD reference app**: the `apps/forum` Next.js frontend, a shared `convex/` backend, and the complete build specification under `docs/`.

**Status snapshot (2026-09-05, post-P4):** Phases 1–4 **code-complete** (P4-01…P4-15; the Phase-4 exit-gate E2E still needs GLM + classifier keys), 315 tests passing, typecheck/lint clean, coverage 572/572. Phases 5–7 not started. A live Convex **dev** deployment (`watchful-chameleon-570`) is now active — schema pushed, seeds run, G1 founder bootstrap executed (CAP-007 `grantFounder`), live probes passing. Caveat: `docs/00-project-status/PROJECT-STATUS.md` was written at the 2026-09-05 scope-stop and still says nothing has ever run live — it predates the resumed work; the `CHANGELOG.md` "Unreleased" entries are the up-to-date record.

---

## 1. Read this before anything else

1. **`docs/AGENT-START-HERE.md`** — the spec's declared entry point. Read it fully before touching code.
2. **`docs/00-project-status/PROJECT-STATUS.md`** — read when arriving cold; explains what is built, what is verified, and what isn't.

## 2. Spec path mapping (critical)

The PRD was authored against a folder layout that differs from this repo. Every internal doc reference must be translated:

| The docs say | In this repo it is |
|---|---|
| `PRD/01-product-spec/...`, `PRD/02-contracts/...`, etc. | `docs/01-product-spec/...`, `docs/02-contracts/...`, etc. |
| `PRD/app` (e.g. `cd PRD/app` in SETUP.md / DEV-HANDOFF.md) | the repo root |
| `PRD/app/apps/forum/...` | `apps/forum/...` |
| `PRD/app/convex/...` | `convex/...` |

The `Brainstorm/` folder referenced by AGENT-START-HERE does not exist in this repo (that fence is satisfied by default). SETUP.md's paths have been updated to this repo layout; `docs/DEV-HANDOFF.md` and `docs/FOUNDER-BOOTSTRAP.md` still use the `cd PRD/app` wording — run those commands from this repo root instead.

## 3. Mandatory read order before starting any slice/screen

From `docs/AGENT-START-HERE.md` §2 — in this order, every time:

1. `docs/01-product-spec/_data-model.md` — canonical entities and enums; every table, field, and enum literal must match it verbatim.
2. `docs/01-product-spec/CAPABILITY-REGISTER-MERGED.md` — the 572 capability rows (CAP-XXX IDs).
3. `docs/01-product-spec/MASTER-SCREEN-INVENTORY-MERGED.md` — the 54 screens, waves, contracts, template archetypes.
4. `docs/04-design-system/STYLE-KIT.md` — all tokens, component specs (§11.1–§11.26), layout.
5. `docs/04-design-system/DESIGN-SYSTEM-OPEN-ITEMS.md` — known-open items (A8 ladder sign-off, A2 charts unspecified).

Per-task lookup: slice in `docs/03-slices/SLICE-CATALOG-PHASE*.md` (scope/dependencies) → screen contract in `docs/02-contracts/wave-N/CONTRACT-*-FINAL.md` (exact UI) → module build sheet in `docs/05-build-sheets/` (business logic) → cross-check `docs/06-open-items/OPEN-DECISIONS.md`.

## 4. Hard rules (from AGENT-START-HERE §4 — non-negotiable)

1. **Never invent a token, color, spacing value, or component pattern not in `STYLE-KIT.md`.** If no token exists, stop and report; do not mint one silently.
2. **Never build a capability or screen not in the register/inventory.** No "usual product" surfaces.
3. **Contract vs. slice-catalog conflicts:** the CONTRACT is authoritative for UI/states/actions; the SLICE CATALOG for scope/sizing/dependencies. Flag conflicts explicitly — never silently pick one.
4. **If something is ambiguous or missing, STOP and report.** Do not fill gaps with assumptions (especially founder/legal-owned copy).

## 5. Governing architecture decisions

From `docs/00-project-status/` (founder-approved 2026-09-04 — read before any architecture-adjacent work):

- **00-TOPOLOGY:** the forum app (`apps/forum`) owns **ALL MVP routes** (member, admin, sell, storefront). `apps/admin`, `apps/seller`, `apps/marketplace` are parked placeholders — keep them buildable, do not build them out. Slice paths like `app/admin/...` mean `apps/forum/src/app/(app)/admin/...`.
- **00-ROUTES:** live route names are canonical: `/discussions/[slug]`, `/new-post`, `/users/[handle]`, `/profile` + `/settings` (they supersede older route fields in contracts/sheets — e.g. `/p/[slug]`, `/compose`). Do not rename routes to match contracts.
- **00-TRANSITION:** RESET + strangler pattern — canonical tables are built alongside legacy `forum*` tables; live-app data is disposable demo data; no migration, no dual-write. **NEVER write a legacy `forum*` table.** SLICE-P7-CLEANUP drops the legacy tables at the end.
- **Shared-file serialization:** `convex/schema.ts`, `convex/crons.ts`, and shared registries merge through one integration pass per phase.

## 6. Repo layout

| Path | Contents |
|---|---|
| `apps/forum` | The real app (Next.js App Router, ~250 files; all MVP routes) |
| `apps/admin`, `apps/seller`, `apps/marketplace` | Parked placeholder apps (single page each) |
| `packages/auth-ui` | Auth modal + providers (`@cemvp/auth-ui`) — reference implementation |
| `packages/convex-client` | Tiny env helper (`isConvexConfigured()`, `getConvexUrl()`) |
| `convex/` | Shared Convex backend: 89-table `schema.ts`, auth, crons, admission/ forum/ ingest/ qualify/ editorial/ posts/ admin/ lib/ |
| `docs/` | The complete PRD (this is what internal docs call `PRD/`) |
| `SETUP.md` | Historical run guide (paths predate this repo layout) |
| `scripts/cap-coverage.mjs` | CAP→slice coverage gate (run after any slice-catalog edit; expect 572/572) |

## 7. Commands (run from repo root)

| Command | What it does |
|---|---|
| `pnpm dev` | Forum dev server → http://localhost:3000 (`/` redirects to `/feed`) |
| `pnpm typecheck` / `pnpm lint` | tsc --noEmit / ESLint 9 (forum app) |
| `pnpm test:run` | Vitest suite (forum app) |
| `pnpm build` | Production build (Turbopack) |
| `pnpm convex:dev` | Push Convex function changes / run dev sync |
| `pnpm convex:codegen` | Regenerate `convex/_generated/` |
| `pnpm convex:seed-forum` / `-force` | Seed forum demo content |
| `pnpm convex:seed-legal` | Seed the 4 legal docs (requires one-time `npx convex login`) |
| `pnpm dev:seller` / `dev:admin` / `dev:marketplace` | Run parked placeholder apps |
| `pnpm convex:deploy:prod` / `convex:prod:ensure-categories` | Prod push + prod category check (Bucket-1 — flag before running) |
| `node scripts/cap-coverage.mjs` | Capability coverage gate (572/572 expected) |

Toolchain: Node ≥ 22, pnpm 10 (`packageManager` pins pnpm@10.28.2), Convex pinned to 1.34.1 via pnpm override, forum runs `next dev` on Turbopack.

Git: work happens on phase branches (currently `001-phase4`); the PR target is `001-default` (not `main`).

Gotchas: a long-running dev server accumulates a stale Turbopack graph — after several slices of new files, module-not-found errors mean **restart `pnpm dev`**, not a code bug. `npx convex run` needs the colon form for nested function names (`rulebook:deploySeed`) on convex 1.34.

## 8. Code conventions established by the reference implementations

Three pieces are real, verified code — **extend them; never build parallel versions**:

1. **Feed** — `apps/forum/src/app/(app)/(shell)/feed/page.tsx` + `components/feed/` (RSC + ISR, Convex-backed).
2. **Auth popup** — `packages/auth-ui` (`auth-modal.tsx`, `AppAuthProvider`, `useAuth`). UI complete; live OAuth providers intentionally not configured.
3. **Discussion page / post detail** — `apps/forum/src/app/(app)/discussions/[slug]/` — built through P4-15 as the strangler route: canonical `postSeoMeta` resolves first, legacy forum thread is the fallback; per-type render + debate/list/help/showcase mechanics are live. The thread/comments area is an honest Phase-5 placeholder — close the gap against `docs/02-contracts/wave-5/CONTRACT-5-discussion-thread-FINAL.md` when Phase 5 starts.

Conventions to follow:

- **Styling:** Tailwind CSS v4 — tokens are defined in `apps/forum/src/app/globals.css` (`@theme inline`), sourced from STYLE-KIT. Never use a raw hex or px value where a named token exists. Radix primitives + `cva`/`clsx`/`tailwind-merge` for components.
- **Shared data:** use `useSharedData()` (from `SharedDataProvider`) for categories + unread notification count — do not duplicate `listCategories` subscriptions.
- **Convex guards:** components calling `useQuery` must run under `ConvexProvider`; guard with `isConvexConfigured()` where pages must prerender without a Convex URL.
- **Heavy editor:** the TipTap editor in `/new-post` is `React.lazy`-loaded — keep it that way.
- **Tests:** Vitest 4 (jsdom) configured in `apps/forum` only; colocate under `src/**/__tests__/` next to the component, following the existing phase suites.
- **Convex versioning:** `next.config.mjs` pins `convex` + `@convex-dev/auth` to the forum app's own copies via resolveAlias (shared React context under Turbopack) — don't remove this when touching config.

## 9. Open items — check before assuming anything is final

- `docs/06-open-items/OPEN-DECISIONS.md` — still open (non-blocking): E1 (BetaBanner ungoverned), F-34 (eligibility-state routing unowned), F-36 (two waitlist capture surfaces), F-38 (support-scoped intervention inbox), plus FUTURE-* rows.
- `docs/06-open-items/SCREEN-SCORES.md` — **wave-4-editorial is flagged NEEDS HUMAN REVIEW** (A10 evidence/diff panel). Do not attempt that screen without founder input. All other 53 screens cleared.
- `docs/04-design-system/DESIGN-SYSTEM-OPEN-ITEMS.md` — A8 tiered-ladder visual sign-off open; A2 charts have no spec (flag before building admin analytics).
- `docs/06-open-items/DECISIONS-LOCKED.md` — all 11 former stop-and-report fences resolved 2026-09-04 (OTP=Twilio Verify, 7 activation bits, A10 two-pane, etc.).

## 10. Terminal/deployment-blocked items

Anything requiring the Convex CLI, package installs, deployment pushes, or external accounts is **Bucket-1: stop, flag, hand off** — see `docs/DEV-HANDOFF.md` (note: its "Immediate" items 1–5 — Convex login/codegen, founder bootstrap, rate-limiter install, schema push, widget seeder — are all **closed**, executed 2026-09-05 against the live dev deployment; the doc still lists them). Still blocked, in priority order: **GLM API key** and **moderation-classifier provider** (both pipeline-blocking — H-SAFE/qualify holds every candidate until wired) — **founder deferred both on 2026-09-06 ("will do later"); build continues, the P4 exit-gate E2E waits until the keys land** — then Twilio / PostHog / email providers, legal-doc seed verification, and the prod push. Founder-only steps live in `docs/FOUNDER-BOOTSTRAP.md`; the admin-access rollback is documented in `SETUP.md`.

Pre-launch-only gates (do NOT block build): lawyer review of the four legal docs, and Readiness Category 8 (ranking calibration reviewed) — both gate `signup.mode=open` only.

## 11. Progress tracking — GitHub wiki (MANDATORY per slice)

The step-by-step build tracker lives on the repo wiki: **https://github.com/contactcreateconomy/CE-MVP/wiki** (pages: Development Roadmap · Working Agreements · Progress Tracker · one per phase). It is the single source of truth for what's done — the repo docs deliberately do not duplicate it.

**Every completed slice MUST update the wiki in the same session that ships it** (this is part of the definition of done, alongside the CHANGELOG entry):

1. `Progress-Tracker.md` — add a log row (date, slice, commit hash, one-line note); adjust the "Next up" queue and the remaining-slices count.
2. The phase page (e.g. `Phase-4-Content-Core.md`) — flip the slice row's status (✅ + date + commit, or 🔜 for the new next-up).
3. `Home.md` current-status snapshot — update when a phase completes (not per slice).

Mechanics: the wiki is its own git repo —

```bash
git clone https://github.com/contactcreateconomy/CE-MVP.wiki.git   # needs gh auth (gh auth login)
# edit pages, then:
git add -A && git commit -m "Tracker: <slice> done (<hash>)" && git push
```

Wiki clone lives locally at `/tmp/CE-MVP-wiki` on the founder Mac (re-clone if missing). If wiki push is impossible (no auth), STOP and report — do not let code and tracker drift apart.
