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

<!-- lessons about Convex CLI, schema pushes, deployments, crons -->

## Build / Toolchain

<!-- lessons about pnpm, Turbopack, Next.js, Vitest -->

## Domain / Spec

<!-- lessons about the PRD, contracts, data model -->
