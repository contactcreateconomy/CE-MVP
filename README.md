# Createconomy — MVP monorepo

Createconomy is a curated creator-discussion platform. Content flows through an editorial pipeline — operators source material, an AI-assisted pipeline drafts candidate posts, and human editors review, verify claims against source evidence, and approve publication before anything goes live. AI personas may also participate in discussions; their contributions are always labeled as AI-generated. Around that core: a typed-post forum (8 member-composable post types), a tool registry with integrity-protected community ratings, a free resource store and affiliate storefront, and a gamified reputation economy (Signals / Might / a 10-rung ladder) — all wrapped in trust & safety and a full admin console.

**Status:** Phases 1–7 complete (MVP code-complete 2026-09-10; 902/902 tests; 2026-09-12 audit reconciled doc drift). **Development runs against a local open-source Convex backend** (`pnpm backend`) — no Convex cloud account needed for dev. Production remains the Convex Cloud deployment (founder-only deploys). See [Setup](SETUP.md) for the full macOS/Windows walkthrough.

## Repository structure

| Path | What it is |
|---|---|
| `apps/forum` | **The app** — Next.js App Router frontend owning all MVP routes (member, admin, sell, storefront) |
| `apps/admin`, `apps/seller`, `apps/marketplace` | Parked placeholder apps (single page each; kept buildable, not built out) |
| `packages/auth-ui` | Shared auth modal + providers (`@cemvp/auth-ui`) |
| `packages/convex-client` | Tiny helper: `isConvexConfigured()`, `getConvexUrl()` |
| `convex/` | Shared Convex backend — 82-table schema, auth, crons, forum / ingest / qualify / admin / lib modules |
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

## Quickstart

Development uses a **local open-source Convex backend** (state in `.convex/`, gitignored). Every developer runs their own backend and database — no Convex account, no shared quota.

```bash
# prerequisites: Node >= 24, pnpm 10 (corepack enable)
pnpm install

# environment (gitignored, never committed)
cp apps/forum/.env.example apps/forum/.env.local   # points at the local backend
cp apps/admin/.env.example apps/admin/.env.local

# backend — terminal 1 (keep running; it IS the backend)
pnpm backend
#   first run only: confirm the project prompt (Y) and choose "start fresh".
#   The local backend then hosts functions on http://127.0.0.1:3210.

# backend env + seeds — terminal 2, one-time per machine:
pnpm exec convex env set SITE_URL http://localhost:3000
pnpm exec convex env set AUTH_REDIRECT_ORIGINS http://localhost:3000,http://localhost:3001
pnpm exec convex env set FOUNDER_EMAILS contact.createconomy@gmail.com
pnpm exec convex env set DEMO_SEED_ENABLED true
pnpm exec convex run seed:bootstrap              # platform config (REQUIRED — categories, event catalog, jobs; without it signup finalization fails with an eventCatalog CAP-437 error)
pnpm exec convex run legalContent:seedDefaults   # 4 legal docs (idempotent)
pnpm exec convex run rulebook:deploySeed         # moderation rulebook (idempotent)
pnpm exec convex run admin/widgetsCatalog:deploySeed   # admin nav catalog (idempotent)
pnpm exec convex run dev/demoSeed:seed           # OPTIONAL demo members/tools/posts (idempotent)
pnpm exec convex env remove DEMO_SEED_ENABLED    # seeder gate is one-shot by policy

# frontend — terminal 3:
pnpm dev                 # → http://localhost:3000  ("/" redirects to /feed)
pnpm dev:admin           # → http://localhost:3001  (staff console)
```

**Founder sign-in (both founders):** use `contact.createconomy@gmail.com`. Each machine has its own local database — sign up once per machine with that email (any password ≥ 8 chars); the founder email bypasses the signup gate and automatically receives every staff role in the forum and the admin console. Full walkthrough (macOS + Windows): [SETUP.md](SETUP.md).

Until the legal docs are seeded, `/privacy`, `/terms`, `/dmca`, `/repeat-infringer` render the contract-sanctioned `unavailable_pending_legal` state — by design, not a bug.

### Verification

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
