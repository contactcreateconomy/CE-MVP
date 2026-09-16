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

<!-- lessons about GitHub Actions, Vercel, deployment, branch protection -->

## Convex

### 2026-09-15 — Admin gates must use getAuthUserId, not ctx.auth.userId

`ctx.auth.userId` is not a Convex Auth field — it only existed on test fakes. Production Google/OAuth sessions resolve through `getAuthUserId(ctx)` (`ctx.auth.getUserIdentity()` + the auth session). `assertAdminPermission` using `ctx.auth.userId` treated every live session as anonymous, so `/admin` bounced a signed-in founder to `/signin`. Rule: resolve identity with `resolveAuthUserId` (live identity API first, fake `userId` fallback for unit tests). The `/admin` shell must use `useAuth()` from `@cemvp/auth-ui` (same modal as `/feed`), never a second magic-link surface.

### 2026-09-15 — Compound indexes must be queried left-to-right

`legalIntake.by_type_status` is `(type, status)`. A `.eq("status", …)` skip of `type` throws at runtime ("didn't use the index fields in order") and took down `/admin/home`. Query each type prefix, or add a dedicated `by_status` index — never skip a leading field.

## Build / Toolchain

<!-- lessons about pnpm, Turbopack, Next.js, Vitest -->

## Domain / Spec

### 2026-09-16 — Twilio OTP is optional `/setup`, not signup/signin/comments

Founder override: CAP-551 stays Twilio Verify but is one skippable profile-completion step. Do not require `mobileVerified` (or `TWILIO_*` env) for signup, sign-in, comments, or posting. Missing Twilio keys → `notConfigured`; Complete setup still proceeds. Password signup sets `emailVerified: true` so removing the signup OTP UI does not leave CAP-141 blocked on email. Dated addenda on DECISIONS-LOCKED #1, CONTRACT-5-setup, M7 sheet — do not rewrite locked historical INV-1 wording.

### 2026-09-16 — Admin has one AuthModal, not a second gate page

The `/admin` shell used a custom “Staff access required / Sign in” page that then opened `@cemvp/auth-ui` AuthModal — two stacked login surfaces. Rule: staff origin stays separately authenticated (`requireAuth` on `AppAuthProvider`); the modal is the only sign-in UI. Do not add a second magic-link or staff-gate page in front of it.

### 2026-09-15 — Admin console lives in `apps/admin`, not forum

00-TOPOLOGY originally parked `apps/admin`. Founder extraction 2026-09-15: `/admin/*` pages moved to `apps/admin/src/app/admin/` (port 3001). Forum redirects `/admin`. Do not re-create admin routes under `apps/forum`. Auth cookies do not cross origins — staff sign in on :3001. `AUTH_REDIRECT_ORIGINS` must include `http://localhost:3001` for Google OAuth.

<!-- lessons about the PRD, contracts, data model -->
