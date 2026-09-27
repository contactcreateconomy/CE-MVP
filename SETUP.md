# SETUP — Createconomy PRD reference app

Development runs against a **local open-source Convex backend** — no Convex
cloud account, no shared quota, and each developer gets their own database.
Production remains the Convex Cloud production deployment (founder-only,
unchanged). Paths below are relative to the repo root. Verified on macOS
(2026-09-27); Windows steps are called out inline.

## Prerequisites (macOS / Windows / Linux)

1. **Node.js ≥ 24 (LTS)** — CI and `.nvmrc` pin Node 24 (Node 26 exists but is
   not LTS). Check: `node -v`.
   - macOS: `brew install node@24`, or use fnm/nvm.
   - Windows: installer from nodejs.org, or `fnm install 24`.
2. **pnpm 10.x** — `corepack enable` (bundled with Node ≤ 25), or
   `npm i -g pnpm@10`. Note: Node 25+ no longer bundles corepack — use the
   npm install form there. Windows path-length fix if `pnpm install` fails:
   `git config --global core.longpaths true` (plus the Windows long-paths
   group-policy flag if needed — pnpm's `.pnpm` store is deep).
3. **That's it for the backend** — the open-source Convex backend binary is
   downloaded automatically by the CLI on first `pnpm backend` (native builds
   exist for macOS Apple Silicon/Intel, Linux x64/arm64, and Windows x64).

## One-time setup (fresh clone)

```bash
pnpm install          # ~621 packages; uses pnpm-lock.yaml

# frontend env (gitignored, never committed):
cp apps/forum/.env.example apps/forum/.env.local      # macOS/Linux
cp apps/admin/.env.example apps/admin/.env.local      # macOS/Linux
copy apps\forum\.env.example apps\forum\.env.local    # Windows (cmd)
copy apps\admin\.env.example apps\admin\.env.local    # Windows (cmd)
# both files already point at the local backend (http://127.0.0.1:3210)
```

## Daily run (from the repo root)

```bash
# Terminal 1 — the backend (keep it running; it IS the backend):
pnpm backend
#   First run only: it asks to configure the project → confirm (Y), and
#   offers to transfer data from an existing deployment → choose
#   "start fresh" (local databases are disposable dev data).
#   It then pushes functions/schema and stays alive on
#   http://127.0.0.1:3210. Stop with Ctrl+C when done for the day.
#   Windows: run it in Windows Terminal or a plain cmd window — the first-run
#   prompts are interactive keypress menus.

# Terminal 2 — frontend (one shell each, or run them one at a time):
pnpm dev              # forum  → http://localhost:3000 ("/" → /feed)
pnpm dev:admin        # admin  → http://localhost:3001 (staff console)
```

Verify: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/feed`
→ `200`.

## One-time per machine: backend env + seed data

With `pnpm backend` running in another terminal:

```bash
pnpm exec convex env set SITE_URL http://localhost:3000
pnpm exec convex env set AUTH_REDIRECT_ORIGINS http://localhost:3000,http://localhost:3001
pnpm exec convex env set FOUNDER_EMAILS contact.createconomy@gmail.com

# demo content (10 members, 12 tools, ~150 posts across all 7 post types):
pnpm exec convex env set DEMO_SEED_ENABLED true
pnpm exec convex run seed:bootstrap             # platform config (REQUIRED — categories, event catalog, jobs; without it signup finalization fails with an eventCatalog CAP-437 error)
pnpm exec convex run legalContent:seedDefaults   # 4 legal docs (idempotent)
pnpm exec convex run rulebook:deploySeed         # moderation rulebook (idempotent)
pnpm exec convex run admin/widgetsCatalog:deploySeed   # admin nav catalog (idempotent)
pnpm exec convex run dev/demoSeed:seed           # OPTIONAL demo members/tools/posts (idempotent)
pnpm exec convex env remove DEMO_SEED_ENABLED    # seeder gate is one-shot by policy
```

Until the legal docs are seeded, `/privacy`, `/terms`, `/dmca`,
`/repeat-infringer` render the contract-sanctioned `unavailable_pending_legal`
state — by design, not a bug.

Optional disposable test login (in addition to the founder account):

```bash
pnpm exec convex env set ALLOW_DEV_TEST_USER true
pnpm exec convex env set DEV_TEST_USER_PASSWORD 'some-password-8plus-chars'
pnpm exec convex run dev/ensureTestUser:ensure     # → devtest@example.com
pnpm exec convex env remove ALLOW_DEV_TEST_USER    # remove the gate after
```

(Password sign-up is dev-mode: no email verification, no email provider.)

## Dev test account (shared by the team for manual testing)

- **Email:** `devtest@example.com`
- **Password:** fixed team password, agreed in team chat (not committed to the repo — hardcoded dev credentials were removed by security scan 2026-09-13, finding 21).
- **Setup (once per machine):** the account is on the backend staff allow-list, which is what grants every staff role:

```bash
pnpm exec convex env set FOUNDER_EMAILS "contact.createconomy@gmail.com,devtest@example.com"
```

Then sign up once through the UI (Login → Sign up, use the team password) — the
allow-listed email bypasses the signup gate and auto-grants **every staff
role**, so the same login works in the forum **and** the admin console on
:3001. The real founder account (`contact.createconomy@gmail.com`) is reserved
for the founders' Google identity and is untouched by this.

## Founder sign-in (both founders)

Both founders use **`contact.createconomy@gmail.com`**. Each machine runs its
own local database, so do this once per machine:

1. Open http://localhost:3000 → **Login** → **Sign up** tab.
2. Enter the founder email, any name, and a password (≥ 8 chars — it does not
   need to match any Google password; it exists only in your local database).
3. Accept the terms → **Create account**. You are signed in.

The founder email bypasses the signup admission gate and automatically grants
**every staff role** (`convex/lib/founder.ts`), so the same identity has full
access in the forum **and** the admin console on :3001. If the users row
already exists and roles ever need re-granting:
`pnpm exec convex run admin/roles:grantFounderByEmail` (see
`docs/FOUNDER-BOOTSTRAP.md`).

## What runs where

| Thing | Dev (this setup) | Production (unchanged) |
|---|---|---|
| Convex backend | Local open-source binary via `pnpm backend` → `http://127.0.0.1:3210` | Convex Cloud production deployment (founder-only `pnpm convex:deploy:prod`) |
| Data | Your machine only (`.convex/`, gitignored; disposable) | Convex Cloud |
| Accounts | Password sign-up, no email verification | OAuth (Google/GitHub) once configured |
| Convex account | **Not required** | Required (founder) |

## Environment files

- `.env.local` (repo root) — Convex CLI config, written automatically by
  `convex dev --configure` on your first `pnpm backend`. `CONVEX_DEPLOYMENT=local:…`
  is what selects the local backend — don't hand-edit.
- `apps/forum/.env.local` — `NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210`
  (the only Convex var the app source reads) + `NEXT_PUBLIC_ADMIN_ORIGIN`.
- `apps/admin/.env.local` — same `NEXT_PUBLIC_CONVEX_URL` +
  `NEXT_PUBLIC_FORUM_ORIGIN`.
- Backend env vars (SITE_URL, seeds, OAuth secrets) live **on the backend**,
  set via `pnpm exec convex env set …` — key names in `convex/.env.example`.

## Verification commands (run from the repo root)

| Command | What it checks |
|---|---|
| `pnpm typecheck` | `tsc --noEmit` across the forum app |
| `pnpm test:run` | vitest suite (forum app) |
| `pnpm build` | production build (Turbopack) |
| `node scripts/cap-coverage.mjs` | CAP→slice coverage gate (expect 572/572) |

## Troubleshooting

- **Feed shows no posts / login hangs** → the backend isn't running. Start
  `pnpm backend` (terminal 1) and keep it open; both apps connect to it.
- **"Cannot prompt for input in non-interactive terminals"** during first
  `pnpm backend` → run it in a real interactive terminal (not a piped script
  or CI shell).
- **Wrong/old data after switching branches or experiments** → local state is
  `.convex/`; stop the backend, delete that folder, restart `pnpm backend`
  (choose "start fresh"), re-run the seed block above. Idempotent seeds make
  this cheap.
- **Port already in use** (3000/3001/3210) → a previous session's process is
  still alive: `lsof -nP -iTCP:3210 -sTCP:LISTEN` (macOS/Linux) or
  `netstat -ano | findstr 3210` (Windows), then kill it.
- **Module-not-found after adding files** → restart the Next dev server
  (stale Turbopack graph), not a code bug.

## Admin-access rollback (P2-AUTH-CUTOVER gate condition 4)

If the founder loses admin access on any deployment:

```bash
pnpm exec convex env set FOUNDER_EMAILS contact.createconomy@gmail.com
# Then sign up / sign in with that email — roles re-grant automatically.
# Or, if the users row already exists:
pnpm exec convex run admin/roles:grantFounderByEmail
```

Canonical authority is `roleAssignments` for every staff role (not an
`assertAdminPermission` email check). See `docs/FOUNDER-BOOTSTRAP.md`.
Production equivalents take `--prod` (founder-only).
