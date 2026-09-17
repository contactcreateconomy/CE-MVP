# Agent Memory — CE-MVP

Append-only memory for AI coding agents working in this repo. This is the
third leg of the tracking system (code → CHANGELOG.md, progress → wiki,
**lessons → here**).

## Rules

1. **Append-only.** Never rewrite history here; add dated entries at the top
   of the relevant section. Correct a wrong entry with a new entry that
   supersedes it (`Supersedes: <date — title>`), not by deleting it.
2. **One lesson per entry.** Format: `### YYYY-MM-DD — short title` followed
   by 1–5 lines: what happened, the rule, why.
3. **What belongs here:** gotchas that cost debugging time, deviations from
   AGENTS.md assumptions, environment/tool failures (CI, Vercel, Convex CLI),
   decisions made in chat that aren't captured in docs/06-open-items/.
4. **What does NOT belong:** anything already in AGENTS.md, the CHANGELOG,
   the wiki tracker, or docs/06-open-items (link to it instead), and normal
   task progress (that's the wiki's job).
5. Agents should read this file's section headers on session start (cheap)
   and the full entries of any section relevant to the current task.

## CI / DevOps

### 2026-09-17 — Vercel origin var names are per-app (do not swap)

Forum Production: `NEXT_PUBLIC_CONVEX_URL` = kangaroo cloud, `NEXT_PUBLIC_ADMIN_ORIGIN` = `https://console.createconomy.com`. Admin Production: same Convex URL, `NEXT_PUBLIC_FORUM_ORIGIN` = `https://discuss.createconomy.com`. Forum must not set `NEXT_PUBLIC_FORUM_ORIGIN`; admin must not set `NEXT_PUBLIC_ADMIN_ORIGIN`. Putting the console URL on admin's `NEXT_PUBLIC_FORUM_ORIGIN` only breaks "Back to the feed" — it does not cause the Google bounce. First-create OAuth on empty prod failed because Convex Auth strips `emailVerified` (see Convex section).

### 2026-09-16 — Convex dest/prod env names (no values)

Verified `convex env list` on dest (`watchful-chameleon-570`) and prod (`energetic-kangaroo-55`): **same nine names on both**. Values not recorded here.

| Name | Required? | Why |
|---|---|---|
| `SITE_URL` | **Yes** (OAuth return origin) | Auth.js redirect fallback. Dest = local forum origin; prod = public forum origin (no path). |
| `AUTH_REDIRECT_ORIGINS` | **Yes** if admin (or other apps) use OAuth | Extra allowed origins (admin `:3001` / admin prod host). Forum origin is covered by `SITE_URL`. |
| `JWT_PRIVATE_KEY` | **Yes** | Convex Auth RS256. |
| `JWKS` | **Yes** | Matching public JWKS. |
| `AUTH_GOOGLE_ID` | **Yes** for Google sign-in | OAuth client id. |
| `AUTH_GOOGLE_SECRET` | **Yes** for Google sign-in | OAuth client secret. |
| `AUTH_GITHUB_ID` | No | Only if GitHub login is used. Set on both today. |
| `AUTH_GITHUB_SECRET` | No | Pair of the GitHub id. |
| `ADMIN_EMAILS` | **Yes** for founder bootstrap | Allow-list input to `isFounderEmail` (plus documented `contact.createconomy@gmail.com`). Not an `assertAdminPermission` check. |

**Not in the dashboard list (unset or platform-injected):**
- `CONVEX_SITE_URL` — `auth.config.ts` reads it; Convex Cloud usually injects the HTTP Actions host (`*.convex.site`). Set explicitly only if JWT issuer errors appear.
- `AUTH_FACEBOOK_ID` / `AUTH_FACEBOOK_SECRET` — optional; Facebook login unused.
- `FOUNDER_EMAILS` — optional extra founder emails; documented address is hardcoded as fallback.
- `FORCE_FOUNDER_REGRANT` — optional CLI hatch for `grantFounder` when another admin exists.
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_VERIFY_SERVICE_SID` — optional `/setup` CAP-551 only.
- `GLM_API_KEY` (+ optional `GLM_API_BASE`, `GLM_MODEL`, `GLM_EMBEDDING_MODEL`) — pipeline; fail-closed while unset.
- `MODERATION_CLASSIFIER_API_KEY` (+ optional `MODERATION_CLASSIFIER_ENDPOINT`) — H-SAFE; fail-closed while unset.
- `INBOUND_EMAIL_SECRET` — inbound email webhook; unused until that surface is live.
- `YOUTUBE_API_KEY` — ingest poller; no-op while unset.
- `GSC_API_KEY` — SEO pull; honest no-op while unset.
- `ALLOW_DEV_TEST_USER` / `DEV_TEST_USER_PASSWORD` — dest-only test user; never prod.

Frontend Vercel vars (`NEXT_PUBLIC_CONVEX_URL`, origins) are **not** Convex dashboard env.

### 2026-09-16 — `main` is the production branch; Convex deploys stay manual

Supersedes the earlier assumption that `001-default` was the PR target. GitHub default/production branch is **`main`**. Full CI (`ci.yml`) runs on pull requests into `main` and on pushes to `main` (merge from any sub-branch). `001-default` is an ordinary feature branch and does not trigger CI. Convex functions are pushed by a human (`pnpm convex:dev` → `watchful-chameleon-570`, `pnpm convex:deploy:prod` → `energetic-kangaroo-55`); merge to `main` does not deploy Convex. The optional `convex-prod-deploy.yml` Action must set `CONVEX_DEPLOY_KEY` (CLI ignores `CONVEX_DEPLOY_TOKEN`).

<!-- lessons about GitHub Actions, Vercel, deployment, branch protection -->

## Convex

### 2026-09-17 — `/feed` is an index over `postDistributionScores`, not `posts`
Organic Hot/Top/New never scan `posts`. A published row with no `postDistributionScores` document is invisible. Rank crons only **patch** dirty existing score rows — they do not insert. Insert the score (and `postSeoMeta` slug) in the same transaction as publish (`ensurePostDistributionScoreTx`). Demo/visual fixtures belong in dest-gated `convex/dev/demoSeed.ts`, never `seed.bootstrap` (R-FOUNDER / CAP-022).

### 2026-09-17 — `convex codegen` may type a new module without deploying it
`pnpm convex:codegen` regenerated `internal.dev.demoSeed` locally while dest `convex run` still listed no `dev/demoSeed:*`. A dest push required `pnpm exec convex dev --once --typecheck=disable` (this repo has no `convex/tsconfig.json`). Confirm with `convex run`’s available-function list before assuming the upload landed.

### 2026-09-17 — Convex Auth default insert strips `emailVerified`

First Google login on empty prod bounced to the login screen (`grantFounderByEmail` → `no_user`; dest still worked). `@convex-dev/auth` pulls `emailVerified`/`phoneVerified` off `profile()` and writes `emailVerificationTime` instead. Our `users.emailVerified` is required, so the insert failed and the HTTP callback silently redirected home. Fix: `callbacks.createOrUpdateUser` → `createOrLinkAuthUser` (library skips `afterUserCreatedOrUpdated` when that callback is set). Google OAuth client + `SITE_URL` were already correct.

### 2026-09-16 — Founder email auto-grants all staff roles

Supersedes the "sign in then grantFounder" step after the prod wipe. `contact.createconomy@gmail.com` (`ADMIN_EMAILS` / `FOUNDER_EMAILS` plus that documented address) bypasses CAP-001 closed signup, OAuth writes `canonicalSignupFields`, and `ensureFounderPrivileges` assigns every `STAFF_ROLES` literal + `isStaff`. Forum and admin share Convex but not cookies — sign in on both origins. CLI: `admin/roles:grantFounderByEmail` (`no_user` = has not signed in yet).

### 2026-09-16 — Prod wiped and redeployed (schema catch-up)

Supersedes: 2026-09-16 — Prod schema push blocked by pre-canonical `users` rows. Auth-era prod `users` failed current schema (`accountStanding` required). Founder chose full cleanup over backfill (00-TRANSITION: live-app data is disposable). `convex import --prod --replace-all` then `convex deploy -y` succeeded on `energetic-kangaroo-55`. Legal v1 docs re-seeded. Prod has no users/admin until someone signs in and `grantFounder` is re-run. Local `CONVEX_DEPLOYMENT` stays `dev:watchful-chameleon-570`.

### 2026-09-16 — Prod schema push blocked by pre-canonical `users` rows

Dev (`watchful-chameleon-570`) accepted `convex dev --once`. Prod (`energetic-kangaroo-55`) rejected `convex deploy`: existing Auth-era `users` documents (email/name/handle/image only) fail current schema validation — first missing required field `accountStanding`. Do not weaken the data-model validators. Unblock with a prod backfill of CAP-002 defaults, then retry deploy. Local `CONVEX_DEPLOYMENT` must stay `dev:watchful-chameleon-570` after a prod push.

### 2026-09-16 — Convex cloud URLs (dev vs production)

Team `harinie`, project `cemvp`, region US East (N. Virginia), Convex 1.34.1. **Do not point local `pnpm convex:dev` at production.** Prod push remains manual/founder-only (`pnpm convex:deploy:prod`). Prod last deployed ~3 months before this note — treat it as stale vs current `main` code until a founder prod push. Merge to `main` does not deploy Convex.

| Kind | Dashboard name | Slug | Cloud URL | HTTP Actions |
|---|---|---|---|---|
| Development | `dev/harinie` | `watchful-chameleon-570` | `https://watchful-chameleon-570.convex.cloud` | `https://watchful-chameleon-570.convex.site` |
| Production | `production` | `energetic-kangaroo-55` | `https://energetic-kangaroo-55.convex.cloud` | `https://energetic-kangaroo-55.convex.site` |

Vercel Preview → dev cloud URL. Vercel Production → prod cloud URL. OAuth callbacks use the HTTP Actions host (`*.convex.site`), not Vercel.

### 2026-09-15 — Admin gates must use getAuthUserId, not ctx.auth.userId

`ctx.auth.userId` is not a Convex Auth field — it only existed on test fakes. Production Google/OAuth sessions resolve through `getAuthUserId(ctx)` (`ctx.auth.getUserIdentity()` + the auth session). `assertAdminPermission` using `ctx.auth.userId` treated every live session as anonymous, so `/admin` bounced a signed-in founder to `/signin`. Rule: resolve identity with `resolveAuthUserId` (live identity API first, fake `userId` fallback for unit tests). The `/admin` shell must use `useAuth()` from `@cemvp/auth-ui` (same modal as `/feed`), never a second magic-link surface.

### 2026-09-15 — Compound indexes must be queried left-to-right

`legalIntake.by_type_status` is `(type, status)`. A `.eq("status", …)` skip of `type` throws at runtime ("didn't use the index fields in order") and took down `/admin/home`. Query each type prefix, or add a dedicated `by_status` index — never skip a leading field.

## Build / Toolchain

<!-- lessons about pnpm, Turbopack, Next.js, Vitest -->

## Domain / Spec

### 2026-09-16 — Forum vs admin roles (`roleAssignments.role`)

Canonical enum (`schema.ts` / `_data-model.md`): `member`, `editor`, `publisher`, `moderator`, `store_operator`, `support_operator`, `administrator`. Scope v1 = `global` only.

**Forum app:** every signed-in account gets `member` at bootstrap (CAP-002). That is the customer role. Staff roles do not add forum screens; they only matter if a forum mutation calls `assertAdminPermission` (rare staff tools). Comment/post eligibility is standing + email, not role.

**Admin app:** shell entry = **any** of the six staff roles (`STAFF_ROLES` in `lib/authz.ts`). `member` alone is `NOT_STAFF`. Widget keys are OR-matched:

| Staff role | Typical admin surfaces |
|---|---|
| `administrator` | Home, config, audit, affiliate inventory, readiness, analytics, reliability, UTM, SEO; also roles + moderation (shared). Founder grant assigns **all six** staff roles so support is included. |
| `editor` | `/admin/roles`, `/admin/wiki` |
| `publisher` | `/admin/wiki` |
| `moderator` | `/admin/moderation`, `/admin/wiki` |
| `store_operator` | `/admin/wiki` |
| `support_operator` | `/admin/support` (this key **only**), `/admin/wiki` |

`/admin/personas/genome` is never in the catalog. Forum and admin share Convex; cookies do not cross origins — staff sign in on both.

### 2026-09-17 — Admin kit already exists; do not `shadcn add`

Staff pages still had native `<select>`/`<input>`/`<textarea>` despite STYLE-KIT wrappers in `apps/admin/src/components/ui`. Swap onto those primitives (and add a §11.2 Textarea twin of Input). Do not run `shadcn init`/`add` — it rewrites the palette. Keep A1/A11/A12/A14 composites.

### 2026-09-16 — Admin shell look/feel is shadcn-admin, tokens stay STYLE-KIT

When restyling `apps/admin`, copy the [shadcn-admin](https://github.com/satnaing/shadcn-admin) composition (grouped sidebar, command search, user dropdown) onto existing STYLE-KIT tokens and CAP-390 chrome. Do not run `shadcn init` (it rewrites the palette), do not add inventory screens, and keep `/admin/personas/genome` out of the palette.

### 2026-09-16 — Twilio OTP is optional `/setup`, not signup/signin/comments

Founder override: CAP-551 stays Twilio Verify but is one skippable profile-completion step. Do not require `mobileVerified` (or `TWILIO_*` env) for signup, sign-in, comments, or posting. Missing Twilio keys → `notConfigured`; Complete setup still proceeds. Password signup sets `emailVerified: true` so removing the signup OTP UI does not leave CAP-141 blocked on email. Dated addenda on DECISIONS-LOCKED #1, CONTRACT-5-setup, M7 sheet — do not rewrite locked historical INV-1 wording.

### 2026-09-16 — Admin has one AuthModal, not a second gate page

The `/admin` shell used a custom “Staff access required / Sign in” page that then opened `@cemvp/auth-ui` AuthModal — two stacked login surfaces. Rule: staff origin stays separately authenticated (`requireAuth` on `AppAuthProvider`); the modal is the only sign-in UI. Do not add a second magic-link or staff-gate page in front of it.

### 2026-09-15 — Admin console lives in `apps/admin`, not forum

00-TOPOLOGY originally parked `apps/admin`. Founder extraction 2026-09-15: `/admin/*` pages moved to `apps/admin/src/app/admin/` (port 3001). Forum redirects `/admin`. Do not re-create admin routes under `apps/forum`. Auth cookies do not cross origins — staff sign in on :3001. `AUTH_REDIRECT_ORIGINS` must include `http://localhost:3001` for Google OAuth.

<!-- lessons about the PRD, contracts, data model -->
