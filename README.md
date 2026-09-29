# Createconomy — MVP monorepo

Createconomy is a curated creator-discussion platform. Content flows through an editorial pipeline — operators source material, an AI-assisted pipeline drafts candidate posts, and human editors review, verify claims against source evidence, and approve publication before anything goes live. AI personas may also participate in discussions; their contributions are always labeled as AI-generated. Around that core: a typed-post forum (8 member-composable post types), a tool registry with integrity-protected community ratings, a free resource store and affiliate storefront, and a gamified reputation economy (Signals / Might / a 10-rung ladder) — all wrapped in trust & safety and a full admin console.

**Status:** Phases 1–7 complete (MVP code-complete 2026-09-10; 902/902 tests; 2026-09-12 audit reconciled doc drift). **Development runs against a local open-source Convex backend** (`pnpm backend`) — no Convex cloud account needed for dev. Production remains the Convex Cloud deployment (founder-only deploys). See [Local development setup](#local-development-setup) below or the full [SETUP.md](SETUP.md) walkthrough (macOS + Windows).

**Redesign:** a UI/UX redesign of every member-facing screen is in progress — see [`ak-redesign/README.md`](ak-redesign/README.md). `ak-redesign/` wins on UI/UX; `docs/` stays authoritative for backend contracts (AGENTS.md §0).

## Repository structure

| Path | What it is |
|---|---|
| `apps/forum` | **The app** — Next.js App Router frontend owning all MVP routes (member, admin, sell, storefront) |
| `apps/admin`, `apps/seller`, `apps/marketplace` | Parked placeholder apps (single page each; kept buildable, not built out) |
| `packages/auth-ui` | Shared auth modal + providers (`@cemvp/auth-ui`) |
| `packages/convex-client` | Tiny helper: `isConvexConfigured()`, `getConvexUrl()` |
| `convex/` | Shared Convex backend — 82-table schema, auth, crons, forum / ingest / qualify / admin / lib modules |
| `ak-redesign/` | UI/UX redesign control room: vision, status, decisions, specs, CRs, baselines |
| `docs/` | The complete PRD: 572 capabilities, 54 screens, 56 screen contracts, 132 slices across 7 phases, design system, 19 module build sheets, open-items register |
| `scripts/cap-coverage.mjs` | Capability→slice coverage gate (572/572) |

> **Path note:** the docs were authored against a `PRD/` + `PRD/app/` layout. Inside `docs/`, read `PRD/x` as `docs/x` and `PRD/app/x` as this repo root. (`SETUP.md`'s paths have been updated to this layout.)

## Tech stack

- **Frontend:** Next.js 16 (App Router, Turbopack), React 19, TypeScript 5.9 (strict)
- **Styling:** Tailwind CSS v4 (token system in `globals.css`), Radix UI primitives, `cva` + `clsx` + `tailwind-merge`, lucide-react, motion
- **Backend:** Convex 1.34.1 (pinned workspace-wide) + `@convex-dev/auth` (magic-link, password, Google/GitHub/Facebook OAuth providers — OAuth secrets not configured; auth UI is a reference implementation)
- **Editor:** TipTap 3 (lazy-loaded in the composer) · **State:** Zustand · **Virtualization:** TanStack Virtual
- **Tests:** Vitest 4 + Testing Library (jsdom), configured in `apps/forum`
- **Toolchain:** Node ≥ 22, pnpm 10, ESLint 9 flat config

## Local development setup

Development uses the **open-source Convex backend running locally** — no Convex cloud account, no shared quota, one disposable database per machine (state lives in gitignored `.convex/`). Production stays on Convex Cloud (founder-only deploys, unchanged).

### One-shot automated setup (recommended — agent-friendly)

Prerequisites: **Node ≥ 24** and **pnpm 10** (`npm i -g pnpm@10`). On Windows, also run `git config --global core.longpaths true` if `pnpm install` hits path-length limits.

```bash
git clone https://github.com/contactcreateconomy/CE-MVP.git && cd CE-MVP
git checkout 012-local-convex        # or the current working branch
pnpm install
node scripts/local-setup.mjs         # does EVERYTHING below, idempotently
```

The script verifies prerequisites, creates the app `.env.local` files, selects the local deployment, launches the backend, sets backend env vars (generating local JWT auth keys — the one manual step that is easy to get wrong by hand), and runs all required config seeders. Safe to re-run at any time; it skips whatever already exists.

When it finishes, it prints the last mile (below). If you ever see a manual prompt from `pnpm backend` on the very first launch, answer **Y** and choose **"start fresh"**, then re-run the script.

### Local dev: one command (setup → reset → verify)

Team workflow: see **[ak-redesign/TEAM-WORKFLOW.md](ak-redesign/TEAM-WORKFLOW.md)** — territories, CR flow, and the seed-fingerprint rule.
Daily ritual: `pnpm session:start` before you work, `pnpm session:end` when you stop (it refuses to leave anything unpushed).
Data parity across machines is `scripts/seed-fingerprint.txt` — `seed:check` compares against it and fails on drift.

Three commands cover the whole local lifecycle. Three independent gates keep them local-only: the deployment selector must be exactly `anonymous:anonymous-*`/`local:local-*`, child processes run with retargeting env overrides (`CONVEX_DEPLOY_KEY`, self-hosted vars) stripped, and a server-side allowlist (`seed/devGuard:assertLocal`) refuses to run on any non-loopback deployment before anything destructive executes.

| Command | What it does |
|---|---|
| `node scripts/local-setup.mjs` | First-time setup (env files, backend, auth keys, config seeds) |
| `DEV_TEST_USER_PASSWORD='<pw>' pnpm reset:local` | Rebuild a **known-good state**: wipes ALL table data (official `convex import --replace-all` path — functions/schema/env untouched) → config seeds → recreates `devtest@example.com` with staff roles → demo seed |
| `pnpm seed:check` | Prints the data **fingerprint** (row counts per table + short hash over counts and stable keys). Identical fingerprint = identical logical data across machines |
| `pnpm seed:demo` | Demo content only (idempotent, deterministic — same logical state on every machine) |

The demo seed ships **15 members across signal levels 1–8, 60 posts across every category and member post type** (incl. a 21-reply thread, a two-line-overflow title, a very long body, an empty body, zero-comment posts), comments/upvotes/bookmarks/debate votes, badges, leaderboard + feed chrome, and read+unread notifications for `devtest@example.com`. The shared dev password is supplied at run time (`DEV_TEST_USER_PASSWORD` or `--password`), never committed.

### Manual setup (what the script automates)

<details>
<summary>Step-by-step (click to expand)</summary>

```bash
# 0. env files (gitignored)
cp apps/forum/.env.example apps/forum/.env.local
cp apps/admin/.env.example apps/admin/.env.local

# 1. backend — terminal 1 (keep running; first launch: confirm Y, choose "start fresh")
pnpm backend

# 2. backend env + seeds — terminal 2, one-time:
pnpm exec convex env set SITE_URL http://localhost:3000
pnpm exec convex env set AUTH_REDIRECT_ORIGINS http://localhost:3000,http://localhost:3001
pnpm exec convex env set FOUNDER_EMAILS contact.createconomy@gmail.com,devtest@example.com
pnpm exec convex run seed:bootstrap              # platform config (REQUIRED for signup)
pnpm exec convex run legalContent:seedDefaults   # 4 legal docs
pnpm exec convex run rulebook:deploySeed         # moderation rulebook
pnpm exec convex run admin/widgetsCatalog:deploySeed   # admin nav
# Local auth keys (JWT_PRIVATE_KEY + JWKS) are also REQUIRED for sign-in —
# generate them with the jose package and set each as ONE value via
# `pnpm exec convex env set VAR -- "<value>"`. Never use --from-file for the
# PEM (the CLI splits multi-line files into junk variables). The setup script
# does this for you.

# 3. apps — terminals 3 & 4:
pnpm dev              # forum → http://localhost:3000
pnpm dev:admin        # admin → http://localhost:3001
```

</details>

### Dev login (manual testing)

| | |
|---|---|
| Forum | http://localhost:3000 |
| Admin console | http://localhost:3001 |
| Email | `devtest@example.com` |
| Password | fixed team password — agreed in team chat, never committed |

Sign up once per machine via **Login → Sign up** (the email is staff allow-listed, so it bypasses the signup gate and auto-receives **every staff role** in both apps). Social SSO buttons are intentionally disabled in local development — password sign-in only until real OAuth is wired.

**Founders:** use your own Google identity on production. Do not create local password accounts for `contact.createconomy@gmail.com`.

Until the legal docs are seeded, `/privacy`, `/terms`, `/dmca`, `/repeat-infringer` render the contract-sanctioned `unavailable_pending_legal` state — by design, not a bug.

### Troubleshooting

- **Sign-in error `InvalidAccountId`** → the account doesn't exist on this machine's database yet — complete **Sign up** first (each machine's local DB is separate).
- **Signup error `event "signup" is not registered in eventCatalog (CAP-437)`** → the platform-config seed didn't run: `pnpm exec convex run seed:bootstrap`.
- **Feed shows no posts / login hangs** → backend not running: start `pnpm backend` and keep it open.
- **`--from-file` created junk env vars** → delete each with `pnpm exec convex env remove <NAME>`; always pass multi-line values as a single argument instead.
- **Port in use** (3000/3001/3210) → kill the stale process (`lsof -nP -iTCP:3210 -sTCP:LISTEN` / `netstat -ano | findstr 3210`).
- **Fresh database wanted** → stop the backend, delete `.convex/`, restart (`pnpm backend`), re-run `node scripts/local-setup.mjs`.

Full walkthrough with Windows specifics: [SETUP.md](SETUP.md).

## Verification

| Command | What it checks |
|---|---|
| `pnpm typecheck` | `tsc --noEmit` (forum app) |
| `pnpm test:run` | Vitest suite |
| `pnpm lint` | ESLint (forum app) |
| `pnpm build` | Production build (Turbopack) |
| `node scripts/cap-coverage.mjs` | PRD capability coverage (expect 572/572) |

All root scripts target `apps/forum` (e.g. `pnpm build`). The admin console is `pnpm dev:admin` on port 3001. Parked apps have `pnpm dev:seller` / `dev:marketplace` and matching build/lint/typecheck variants.

## Environment variables

**Frontend (`apps/forum/.env.local`)** — the app source reads exactly one variable:

| Key | Purpose |
|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment client URL (via `@cemvp/convex-client`) |

**Backend (`convex/.env`)** — key names from `convex/.env.example`: `SITE_URL`, `AUTH_REDIRECT_ORIGINS`, `CONVEX_SITE_URL`, `JWT_PRIVATE_KEY`, `JWKS`, `AUTH_GOOGLE_ID/SECRET`, `AUTH_GITHUB_ID/SECRET`, `AUTH_FACEBOOK_ID/SECRET`, `ADMIN_EMAILS`. Additional seams referenced by code: `INBOUND_EMAIL_SECRET` (email-ingress webhook), `MODERATION_CLASSIFIER_API_KEY` and `GLM_API_KEY` (**pipeline-blocking for Phase 4+** — both fail closed while unset), `TWILIO_*` and PostHog keys (later phases).

## Testing

Vitest runs in `apps/forum` with jsdom + Testing Library; test files are colocated under `src/**/__tests__/` next to their components. Backend tests live at `convex/forum/__tests__/`. Run everything with `pnpm test:run` from the root.

## Project documentation

| Entry point | Contents |
|---|---|
| [AGENTS.md](AGENTS.md) | Operating instructions for coding agents (read order, hard rules, conventions) |
| [docs/AGENT-START-HERE.md](docs/AGENT-START-HERE.md) | The spec's own entry point — read before building any slice |
| [docs/00-project-status/PROJECT-STATUS.md](docs/00-project-status/PROJECT-STATUS.md) | What is built vs. verified vs. remaining |
| [docs/DEV-HANDOFF.md](docs/DEV-HANDOFF.md) | Terminal/CLI/deployment-blocked items, in priority order |
| [docs/FOUNDER-BOOTSTRAP.md](docs/FOUNDER-BOOTSTRAP.md) | Founder-only setup steps (admin role bootstrap) |
| [SETUP.md](SETUP.md) | Verified run notes (2026-09-04) |
| [CHANGELOG.md](CHANGELOG.md) | Reconstructed project history + ongoing changes |

The full build spec lives under `docs/`: `01-product-spec/` (capabilities, screens, data model), `02-contracts/` (per-screen UI contracts, waves 1–7), `03-slices/` (132 build units, Phases 1–7), `04-design-system/` (tokens + component specs), `05-build-sheets/` (module business logic), `06-open-items/` (decision register).

## Before development starts

Dev runs on the local open-source Convex backend — the one-time machine setup (backend env vars + seeds + founder sign-in) is documented in [SETUP.md](SETUP.md). Historical gates:

1. ~~**Convex login + codegen + legal seed**~~ — **done 2026-09-05** against the then-shared cloud dev deployment; on a fresh machine, re-run the seeds per SETUP.md (no login needed for local dev).
2. ~~**Founder bootstrap**~~ — **done 2026-09-05**: the `roleAssignments` administrator row was created and admin access verified (CAP-007 `grantFounder`). See [docs/FOUNDER-BOOTSTRAP.md](docs/FOUNDER-BOOTSTRAP.md). On the local backend the founder email self-grants on first sign-up.
3. ~~**Install the rate-limiter**~~ — **done 2026-09-05**: `@convex-dev/rate-limiter` installed and wired (gate G2 closed); limits are enforced.
4. ~~**Push the schema**~~ — **done 2026-09-05** (with item 1).
5. **Decide the keep-vs-rewrite posture** — per PROJECT-STATUS.md the existing implementation is optional raw material; the three reference implementations (`/feed`, auth modal, `/discussions/[slug]`) are the "extend, don't rebuild" baseline.
6. **Human review for wave-4-editorial** — its A10 evidence/diff panel is flagged NEEDS HUMAN REVIEW in `docs/06-open-items/SCREEN-SCORES.md`; all other 53 screens are cleared.
7. **Phase 4 pipeline keys** — `MODERATION_CLASSIFIER_API_KEY` and `GLM_API_KEY` fail closed and will hold the entire content pipeline once the forge is live.
8. **Open decisions** — E1, F-34, F-36, F-38 remain open (non-blocking) in `docs/06-open-items/OPEN-DECISIONS.md`.

Pre-launch-only gates (do **not** block development): lawyer review of the four legal documents, and ranking-calibration review (Readiness Category 8) — both gate `signup.mode=open` only.
