---
id: SETUP-R3-HOMEPC
type: REPORT
author-model: GLM 5.3
tool: zcode
round: 3
status: SUPERSEDED
superseded-by: SETUP-R3
date: 2026-09-27
---

# SETUP-REPORT R3 — local environment + real baselines

Branch flow: work on `012-local-convex` (synced to teammate's `d2d9984`), merged into `011-Akilesh-Redesign` (fast-forward, no conflicts), pushed.

## Step 1 — Prerequisites

node v24.12.0 ✓, pnpm 10.28.2 ✓, `pnpm install` already complete ✓, branch `012-local-convex` ✓. Backend initially NOT on :3210 — see below.

## The blocker and its resolution (root cause)

The founder's `pnpm backend` (= `convex dev`) kept attaching to the disabled cloud deployment because the **root `.env.local` carried `CONVEX_DEPLOYMENT=dev:watchful-chameleon-570`**. Additionally, `--configure new --dev-deployment local` failed with `InvalidProjectCreation: Project cannot be created or modified while your team is Disabled` — that attempt targeted the founder's **personal** team, not `harinie`. Resolution: `pnpm exec convex dev --configure existing --dev-deployment local --team harinie --project cemvp` → **succeeded**: created local deployment **`local-harinie-cemvp-2`**, downloaded the Windows backend binary, saved the selector to `.env.local`, serving `http://127.0.0.1:3210`. Relaunched as a **detached** watcher (pid 20504, log `%TEMP%\convex-local-backend.log`) so it survives this session. The teammate's `scripts/local-setup.mjs` could not run as-is on Windows (`execFileSync("pnpm", …, {shell:false})` fails — only .cmd shims exist, no pnpm.exe); its steps were executed manually and exactly.

## Step 2 — Env files

`apps/forum/.env.local` + `apps/admin/.env.local` created from `.env.example` (both `http://127.0.0.1:3210`), both gitignored (forum `.gitignore:29`, root `.gitignore:12`). Root `.env.local` now carries `CONVEX_DEPLOYMENT=local:local-harinie-cemvp-2` (gitignored).

## Step 3 — One-time backend config

- `SITE_URL`, `AUTH_REDIRECT_ORIGINS`, `FOUNDER_EMAILS` (incl. devtest@example.com) — set via `pnpm exec convex env set`.
- RS256 keys: throwaway scripts in `%TEMP%` (deleted after). **JWKS required two attempts** — the direct node-spawn path crashed on a Windows libuv assertion (`UV_HANDLE_CLOSING`) before persisting; resolved by routing the single-line JSON through bash argv. `JWT_PRIVATE_KEY` stored as one multi-line value (no `--from-file` used). `env list` verified: exactly the 5 expected vars, **zero junk vars**.
- Seeds: `seed:bootstrap` (platform config — REQUIRED for signup), `legalContent:seedDefaults` (4 legal docs), `rulebook:deploySeed`, `admin/widgetsCatalog:deploySeed` — all returned seeded-confirmations, exit 0.

## Step 4 — Demo seed

`DEMO_SEED_ENABLED` gated run of `dev/demoSeed:seed` (gate removed after). Result: 10 members, 12 tools, **15 posts × 10 members = 150 posts** across all 7 types, 6 hero slots, chrome queues (vibing 6, waitlist 8, cases 4, candidates 3, alerts 2, featured 2). **Slugs/handles deterministic**: handles fixed (maya…samir); tool slugs `demo-*`; discussion slugs human-readable `demo-{type}-from-{handle}-{n}-{suffix}` (discovered live: `/discussions/demo-compare-from-maya-2-8f6ar5`).

## Step 5 — Apps

`pnpm dev` (:3000) + `pnpm dev:admin` (:3001) running in background. `/feed` → 200, `/admin` → 200.

## Step 6 — Test account

Playwright automation (creds via env vars only — never written to any file). Needed 3 attempts: (1) generic selectors filled the wrong (login) form — submit disabled; (2) tabs are plain buttons, not `role=tab`; (3) exact IDs from auth-ui source (`#auth-signup-{name,email,password,confirm-password}` + native terms checkbox + "Create account") → **signup succeeded**. Admin sign-in with the same credentials: **header shows the "administrator" badge** (proof: `%TEMP%\ce-debug-v3-admin.png`, not committed). storageStates saved to `%TEMP%\ce-forum-state.json` + `ce-admin-state.json` (outside repo, never committed).

## Step 7 — Real baselines

34 captures + 2 labelled contact sheets (`CONTACT-390.png`, `CONTACT-1440.png` via Playwright-rendered HTML grid, no new deps) in `ak-redesign/00-control/baseline/`:
- Forum logged-in ×390/×1440: feed, discussions (real slug), new-post, users (/users/maya), notifications, search, discover, category-debate, leaderboard, drafts, settings-profile, setup
- Forum logged-out ×2: landing, signin
- Admin logged-in 1440: admin-home, admin-moderation, admin-editorial, admin-readiness
- Full-page 390: feed, discussions
The CMP consent overlay ("Your privacy choices") was dismissed before capture. Verified visually: real post cards (e.g. "Demo: Review — Claude Code for AI workflows" by Maya), logged-in chrome, no error overlays. `/leaderboard` correctly shows "Podium is forming" (needs 25 contributors; seed has 10).

## Step 8 — Gate (on merged tree)

| Command | Result |
|---|---|
| `pnpm typecheck` | **PASS** |
| `pnpm lint` | **PASS** |
| `pnpm test:run` | **FAIL — 2 of 972** (pre-existing, unchanged from first run): `p5-02-comments-eligibility.test.ts > CAP-140: preserve-draft outcome…`; `p7e-moderation.test.ts > CURRENT season is derived — never hardcoded season 1` |
| `pnpm test:convex` | **PASS** |
| `node scripts/cap-coverage.mjs` | **PASS — 572/572** |

Not fixed, per instructions (source-assertion tests, unrelated to setup work).

## Step 9 — Merge

`012-local-convex` merged into `011-Akilesh-Redesign` as a **fast-forward** (merge-base = 011 HEAD `612cc3c` → no conflicts; nothing to reconcile). Commits on 011: `[SETUP][BASELINE][GLM] real baselines on local convex`, `[GRAPH][REFRESH][GLM] refresh graph`, `[SETUP][INVENTORY][GLM] inventory delta after local convex`, `[SETUP][REPORT][GLM] report R3` (this file). Pushed.

## Errors & founder actions

1. **`scripts/local-setup.mjs` Windows incompatibility** — `execFileSync("pnpm", {shell:false})` fails (no `pnpm.exe`; only `.cmd` shims). Suggest the teammate resolves `pnpm.cmd` explicitly or wraps with `shell:true`. Not fixed (repo script, setup-engineer scope).
2. **5 scheduled jobs crash at backend start** — `analytics/projections:l08Core`, `jobs/legitimacy:recompute`, `jobs/maxRefresh:sweep`, `admin/homeAlertWriters:rankIntegritySweep`, `jobs/repeatInfringer:evaluate` all throw "Tried to query index … didn't use the index fields in order" (they query with only the second index field). App works; jobs fail. Logged, not fixed.
3. **2 failing gate tests** (above) — pre-existing on the branch.
4. `convex/_generated/*` is dirty in the working tree (regenerated by the local watcher) — deliberately **not committed**; expect this drift whenever the local backend runs.
5. Windows `convex` CLI noise: libuv `UV_HANDLE_CLOSING` assertion prints on many CLI exits — usually harmless; if a value didn't persist (happened once with JWKS), re-run via bash argv.
6. **Team `harinie` cloud status**: the disabled-projects banner still prints (free-plan limits on CLOUD projects). Local development no longer depends on it; production (`energetic-kangaroo-55`) untouched. Founder may still want to resolve the cloud team state for dashboard/prod work.

## Still running (left up per instructions)

- Local Convex backend: detached `convex dev` (pid 20504) on `http://127.0.0.1:3210`, log `%TEMP%\convex-local-backend.log`
- Forum `:3000`, admin `:3001` dev servers
