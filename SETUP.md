# SETUP — Createconomy PRD reference app

Verified working from this exact copy on 2026-09-04. This file replaces the
historical root-README/docs references that were not carried into the PRD
copy (FINAL-HOLISTIC-AUDIT HOL-P2-007).

## Prerequisites (Windows/macOS/Linux)

1. **Node.js ≥ 22** — on the dev machine this project uses fnm-managed Node
   **v24.15.0** (`~/AppData/Roaming/fnm/node-versions/v24.15.0/installation`).
   Any Node ≥ 22 works.
2. **pnpm 10.x** — bundled with Node via corepack (`corepack enable`) or
   `npm i -g pnpm@10`. Note: on the reference dev shell, pnpm is NOT on the
   plain PATH — the fnm installation dir must be prepended first.

## Install & run

```bash
cd PRD/app
pnpm install          # ~42s cold; 621 packages; uses pnpm-lock.yaml
pnpm dev              # Next.js dev server → http://localhost:3000
```

`/` redirects to `/feed`. Verify with: `curl -s -o /dev/null -w "%{http_code}"
http://localhost:3000/feed` → `200`.

## Verification commands (run from PRD/app)

| Command | What it checks |
|---|---|
| `pnpm typecheck` | `tsc --noEmit` across the forum app |
| `pnpm test:run` | vitest suite (44 tests: registry, layer-3 components, tiered ladder, toggle-switch) |
| `pnpm build` | production build (Turbopack), 19+1 routes |

## Environment

`.env.local` files exist at `PRD/app/` and `PRD/app/apps/forum/` (values are
pre-configured for the shared Convex cloud deployment; key names only):

- `NEXT_PUBLIC_CONVEX_URL` — client URL (the only var the app source reads,
  via `@cemvp/convex-client`)
- `CONVEX_URL`, `CONVEX_SITE_URL`, `CONVEX_DEPLOYMENT` — Convex CLI config

**Both copies point at the SAME shared cloud deployment** — the PRD copy and
the original workspace talk to identical data.

## Convex backend

Function code lives in `PRD/app/convex/` (registered by `convex.json`).
Deploy/push function changes from the monorepo root: `pnpm convex:dev`.
Backend auth env (JWT_PRIVATE_KEY, JWKS, AUTH_GOOGLE_*, etc.) is documented
by key name in `convex/.env.example`; provider secrets are NOT part of this
copy (the auth UI is a reference implementation; wiring real OAuth providers
is future work per AGENT-START-HERE §1b).

## Legal content (DECISIONS-LOCKED #9)

The four legal documents (Terms/Privacy/DMCA/Repeat-Infringer) are served from
the versioned `contentVersions` table via `/privacy`, `/terms`, `/dmca`,
`/repeat-infringer`. **Seeding requires a one-time authenticated CLI run:**

```bash
npx convex login        # once — this environment has no Convex access token
pnpm convex:seed-legal  # inserts v1 published rows (idempotent)
```

Until seeded, those routes render the contract-sanctioned
`unavailable_pending_legal` state (banner + empty state) — by design, not a bug.
Note: `convex/_generated/api.d.ts` was hand-extended with the `legalContent`
modules (codegen needs the same CLI auth); the next authenticated
`npx convex dev` regenerates identical entries.

## Coverage gate

`node scripts/cap-coverage.mjs` — range-expanded CAP→slice coverage check
(572/572 as of 2026-09-04; 570 slice-owned + CAP-009/CAP-156 explicitly
deferred in the Phase-4 disposition table). Run after any slice-catalog edit.

