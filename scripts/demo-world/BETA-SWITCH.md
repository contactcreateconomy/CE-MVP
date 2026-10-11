# BETA-SWITCH — removing the demo world before beta (and keeping it for dev)

The demo world is ~40k registered rows (posts, comments, reactions, votes, ratings,
notifications, exposures, ground truth) plus ~700 storage files on the LOCAL backend
only. It never touches production (`convex/demoWorld/*` refuses any non-loopback
deployment via `seed/devGuard`). Nothing in product code depends on it — see
"No demo dependencies" below.

## Before you remove anything

1. **Export the ground truth + snapshot** (offline analytics tests use this):
   ```bash
   node scripts/demo-world/p6-export.mjs
   ```
   Writes `.demo-world-cache/export/world-snapshot.json` (world fingerprint +
   tallies verification + artifact hashes) plus verbatim copies of the member /
   post / comment ground-truth sources. Record the printed fingerprint if you
   plan to re-import and compare.

## Remove the world (beta switch)

2. **Remove everything** — registry rows, all demo storage files (covers,
   avatars, including the orphaned upload batch — every upload is registered
   under table `_storage`), job-output sweeps, then projection repair:
   ```bash
   node scripts/demo-world/p6-remove.mjs     # prints worldFingerprint BEFORE removal, purges storage, drains registry, sweeps
   node scripts/demo-world/p6-settle.mjs     # re-run all 12 projection jobs until drained → base-only projections
   ```
   The script exits non-zero if any registry row survives.

3. **Verify the base is intact**:
   ```bash
   pnpm seed:check    # must report the canonical fingerprint (see the S00 note below)
   ```
   Removal deletes every registered demo row + registered storage file + sweepable
   job output (`removalStatus.registryRows` must be 0). Job-output tables that are
   NOT in `seed:check`'s volatile-exclusion list can still carry run-history
   effects (e.g. `cardSummaries`, `adminInterventionAlerts` counts differ from a
   fresh seed). If `seed:check` mismatches after a clean removal
   (`registryRows: 0`), restore the canonical base exactly with:
   ```bash
   node scripts/reset-local.mjs   # DEV_TEST_USER_PASSWORD env var, never a flag with a literal
   pnpm seed:check     # → the canonical in scripts/seed-fingerprint.txt (S00 note below)
   ```
   (`reset:local` wipes table data and reseeds; functions, schema, env and the
   demo corpus cache are untouched. Verified end-to-end on the final 1,500-post
   world: remove → registryRows 0 → reset:local → base canonical → re-import →
   identical world fingerprint.)

> **S00 fix (2026-10-11, `fix-seed-fingerprint`): seed:check hashes CONTENT
> ONLY** — refined same-day by the Grok FIX-2 verdict. VOLATILE now contains
> only cron-ONLY tables (+ the pre-existing runtime surfaces); every
> MIXED-writer table is counted as its seed/human subset, selected by an
> existing origin field in `seed/check:fingerprint` (field + writer-site
> evidence in `convex/seed/check.ts`): storeStrikes `actorUserId` (platform
> reserved user = cron), trustHistory `reason` ("repeat_infringer*" = cron),
> generationRuns `runType` ("claims.extract" = cron), heroSlots
> `disclosureClass` ("community_top" = system fill), heroAssignments
> `reason` ("stale_auto_fill_community_top" = system), signalSeasons
> `seasonNumber` (1 = the founding season, restored to the hash), badges
> `subjectType` ("user" = seed/human; cron mints are "distribution"),
> cardSummaries `generationRunId` ("cards:*" = cron refresh). Three mixed
> tables have NO usable origin field and stay whole-hashed — **vibingTrends**
> (observed replay drift 8↔9: the one residual cross-machine parity risk;
> founder CR needed to add an origin field), integrityFlags,
> leaderboardProjections (upsert-stable, observed 2/2/2). Corrected record:
> merchantComplaints / moderationCases / moderationActions have no scheduled
> writer at all (precise function-block attribution) and are whole-hashed.
> RED/GREEN + three-state proof: `scripts/seed-check-proof.mjs`, full output
> committed under `ak-redesign/evidence/seed-fingerprint/`. Canonical is
> **`b6794007e68a`** (`scripts/seed-fingerprint.txt`, recomputed 2026-10-11
> after the reset:local replay). Historical values (`63fe5110e230`,
> `c9ebee53588c`, `d7b7f0c893f4`) belong to superseded hash definitions and
> are NOT comparable.

## Keep using the world locally (development after the export)

The corpus lives in `.demo-world-cache/` (gitignored). Re-import any time:

4. ```bash
   node scripts/demo-world/p6-import.mjs     # idempotent (re-anchors worldEnd = now), then:
   node scripts/demo-world/p6-settle.mjs
   ```
   Re-import identity proof: `scripts/demo-world/lib/fingerprint.mjs` (the paged
   client fold used by `p6-export`/`p6-remove`; the one-shot
   `demoWorld/importChrome:worldFingerprint` query hits Convex read caps at
   full-corpus scale) hashes every post/comment title+body by ground-truth
   refKey (ids and times excluded), so two imports of the same corpus produce
   the SAME fingerprint. Compare with
   the one printed at removal/export time. Note (amended by the S00 fix,
   2026-10-11): with the content-only fingerprint, `seed:check` MATCHES while
   the demo world is loaded — cron catch-up rows no longer break parity. A
   mismatch now means real content drift (or a seed change that must update
   `scripts/seed-fingerprint.txt` in the same commit).

## No demo dependencies in product code

Guaranteed by construction: everything demo-world lives under `convex/demoWorld/`
(import + removal, guarded by the loopback devGuard) and `scripts/demo-world/`.
The only product-surface change is CR-010a (`feed.list`/`getChrome` return
`coverImage` from `postSeoMeta.ogImageAssetId` — a real field written by the
production cover flow too; absent → `null`). Verify with:

```bash
grep -rn "demo" convex/ --include="*.ts" -l | grep -v "convex/demoWorld" | grep -v _generated
grep -rn "demoWorld\|demo.createconomy.invalid" apps/ -r --include="*.ts" --include="*.tsx" | grep -v __tests__
```
(the second list should be empty; the first only matches comments/seed guard helpers).

## What the beta world replaces

Real users. The demo corpus is disposable by design (00-TRANSITION): no migration,
no dual-write, one-command removal — the removal above. Production deploys are
unaffected and founder-only.
