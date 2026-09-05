# 00-TRANSITION — Live reference app → canonical architecture (RESET, strangler pattern)

**Decision (founder-approved 2026-09-04):** the live app's data is **disposable demo
data** (M4: "no production data yet"; users are test accounts). There is **no data
migration and no dual-write machinery**. Canonical tables are built alongside the
legacy `forum*` tables; each screen is **ported** onto canonical queries one at a
time; legacy tables are dropped in one cleanup slice after the last port.
This resolves FINAL-HOLISTIC-AUDIT **HOL-P0-001**.

## What "extend, don't rebuild" means under this decision

- The live **UI/interaction patterns** (feed card assembly, composer ergonomics,
  thread tree, MIN/MAX toggle, modal auth shell, token styling) remain the quality
  reference — copy the patterns, not the queries.
- The live **data layer** (`forumPosts`, `forumPostComments`, `forumProfiles`,
  `memberships`, `forumNotifications`, `forumReports`, `forumModActions`,
  `forumAnalyticsEvents`, `forumDailyStats`, `forumFeedCache`, …) is legacy and
  gets **retired**, not extended. New work never writes a `forum*` table.

## Legacy → canonical mapping

| Legacy (retire) | Canonical (build per slices) | Ported by |
|---|---|---|
| Auth `users` + `memberships` + `forumProfiles` | `users` + `privateUserData` + `roleAssignments` (P1-01a, P2-01) | Auth cutover (below) |
| `forumPosts` + category payloads + rich threads | `posts` + typed extension tables (P4-01) | P4-13 port |
| `forumPostComments` (+ local optimistic reactions) | `comments` + reaction/save/score/read-state (P5-01) | P5-02/03 port |
| `forumNotifications` (4 legacy kinds) | `notifications` + dedupe/batching (P1-02 substrate) | P7T-01 port |
| `forumAnalyticsEvents` + `forumDailyStats` | `rawEvents` + `eventCatalog` (P1-07) | P7O-03 port |
| `forumReports` + `forumModActions` | `moderationCases` + actions + `legalIntake` (P1-03, P7E-10) | P7E-14 port |
| `forumFeedCache` + virality ranking | `postDistributionScores` + canonical feed queries (P6-01/02) | P6-03 port |
| `ADMIN_EMAILS` auto-grant | Founder bootstrap + `roleAssignments` (P2-01, P3-09) | Auth cutover |

## Porting protocol (per screen)

1. Canonical tables/functions for the domain exist (per slice).
2. **Port** = rewire the screen's queries/mutations to canonical APIs, keeping the
   existing UI structure; seed canonical data via the slice's seeders.
3. **Acceptance:** a canonical write (e.g. create post/comment) is **visible in the
   ported screen**, and the screen performs zero reads of the legacy table.
4. Only after every screen in a domain is ported does that domain's legacy table
   become drop-eligible.

## Auth cutover (the one structural replacement)

Replace the password/OAuth backend with the canonical magic-link admission
(CONTRACT-1-signin) while keeping the `auth-ui` modal shell as the UI host:
- `convex/auth.ts` swaps Password/OAuth providers for the magic-link flow;
  `ADMIN_EMAILS` grant is removed — staff roles come from Founder bootstrap
  (P2-01) and `roleAssignments`.
- Existing demo accounts are **not migrated** — the reset decision; delete or
  ignore. The signup → bootstrap → timezone (auto-detect, no Skip —
  DECISIONS-LOCKED #2) path creates canonical users only.

## Cleanup slice (new — add at end of Phase 7)

**SLICE-P7-CLEANUP** — after P7T-01 (last `forumNotifications` reader) and P7O-03
(last analytics reader) land: drop all `forum*` tables + their indexes + dead
helpers (`forumFeedCache` crons, virality scorer, local-reaction optimistic code);
full-repo grep asserts zero `forum*` references remain; tsc/vitest/build green.

## Rollback

Any port is revertible per-screen (git revert of the port commit) since legacy
tables still exist until the cleanup slice. After cleanup, rollback = redeploy
prior build; no data to recover (demo-only).

## Build-order consequence

Phases proceed per the catalogs; the strangler ports above are **the existing
slices' acceptance criteria**, not extra work. No slice may add a write path to a
legacy table after its canonical successor lands.
