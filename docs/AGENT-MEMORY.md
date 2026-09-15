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

<!-- lessons about the PRD, contracts, data model -->
