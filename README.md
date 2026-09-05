# Createconomy — MVP monorepo

Createconomy is a curated creator-discussion platform. Content flows through an editorial pipeline — operators source material, an AI-assisted pipeline drafts candidate posts, and human editors review, verify claims against source evidence, and approve publication before anything goes live. AI personas may also participate in discussions; their contributions are always labeled as AI-generated. Around that core: a typed-post forum (8 member-composable post types), a tool registry with integrity-protected community ratings, a free resource store and affiliate storefront, and a gamified reputation economy (Signals / Might / a 10-rung ladder) — all wrapped in trust & safety and a full admin console.

**Status:** active build. The PRD reference app implements Phases 1–3 fully and Phase 4 partially (≈47 of 132 slices), with 279 tests passing and clean typecheck/lint. The backend is deployed and seeded on the shared Convex dev deployment (`watchful-chameleon-570`) and the dev server smoke-tested against it (2026-09-05) — see [Before development starts](#before-development-starts) for what remains.

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

```bash
# prerequisites: Node >= 22, pnpm 10 (corepack enable)
pnpm install

# environment
cp apps/forum/.env.example apps/forum/.env.local   # set NEXT_PUBLIC_CONVEX_URL
cp convex/.env.example convex/.env                 # backend auth keys (as available)

# backend (one-time): authenticate the Convex CLI, push functions + schema, seed
npx convex login
pnpm convex:dev          # or: npx convex dev --once
pnpm convex:seed-forum   # demo content (skip if deployment already has data)
pnpm convex:seed-legal   # the 4 legal docs as v1 published (idempotent)

# frontend
pnpm dev                 # → http://localhost:3000  ("/" redirects to /feed)
```

Until the legal docs are seeded, `/privacy`, `/terms`, `/dmca`, `/repeat-infringer` render the contract-sanctioned `unavailable_pending_legal` state — by design, not a bug.

### Verification

| Command | What it checks |
|---|---|
| `pnpm typecheck` | `tsc --noEmit` (forum app) |
| `pnpm test:run` | Vitest suite |
| `pnpm lint` | ESLint (forum app) |
| `pnpm build` | Production build (Turbopack) |
| `node scripts/cap-coverage.mjs` | PRD capability coverage (expect 572/572) |

All root scripts target `apps/forum` (e.g. `pnpm build`). Parked apps have `pnpm dev:seller` / `dev:admin` / `dev:marketplace` and matching build/lint/typecheck variants.

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

These are the gates that should be cleared before new feature development (details and commands in [docs/DEV-HANDOFF.md](docs/DEV-HANDOFF.md)):

1. ~~**Convex login + codegen + legal seed**~~ — **done 2026-09-05**: functions + schema pushed, `api.d.ts` regenerated by real codegen, all four legal docs seeded v1 published, platform bootstrap seeded.
2. **Founder bootstrap** — create the `roleAssignments` administrator row and verify admin access (blocks the auth cutover). See [docs/FOUNDER-BOOTSTRAP.md](docs/FOUNDER-BOOTSTRAP.md).
3. **Install the rate-limiter** — `pnpm add @convex-dev/rate-limiter`; limits are currently defined but not enforced.
4. ~~**Push the schema**~~ — **done 2026-09-05** (with item 1).
5. **Decide the keep-vs-rewrite posture** — per PROJECT-STATUS.md the existing implementation is optional raw material; the three reference implementations (`/feed`, auth modal, `/discussions/[slug]`) are the "extend, don't rebuild" baseline.
6. **Human review for wave-4-editorial** — its A10 evidence/diff panel is flagged NEEDS HUMAN REVIEW in `docs/06-open-items/SCREEN-SCORES.md`; all other 53 screens are cleared.
7. **Phase 4 pipeline keys** — `MODERATION_CLASSIFIER_API_KEY` and `GLM_API_KEY` fail closed and will hold the entire content pipeline once the forge is live.
8. **Open decisions** — E1, F-34, F-36, F-38 remain open (non-blocking) in `docs/06-open-items/OPEN-DECISIONS.md`.

Pre-launch-only gates (do **not** block development): lawyer review of the four legal documents, and ranking-calibration review (Readiness Category 8) — both gate `signup.mode=open` only.
