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
> ONLY.** Every table a scheduled job can insert into or delete from is now in
> seed-check's VOLATILE list (25 additions incl. `cardSummaries`,
> `vibingTrends`, `adminInterventionAlerts`, `recognitionEvents`,
> `leaderboardProjections`, `signalLedger`, `vibingTrends`'s siblings — full
> list + cron→table evidence in `scripts/seed-check.mjs`). Patch-only jobs
> (`jobs/rank` value recompute over `commentScores` / `postDistribution*`)
> can't move the hash and are not listed. RED/GREEN proof: changing one demo
> post title flips the fingerprint (FAIL); the three machine states that
> previously hashed apart on cron-row deltas (`384d38db79af` pre-reset,
> `5989cbd616ce` post-replay, office `c9ebee53588c`) now ALL hash to the same
> value. Canonical is now the content-only world fingerprint
> **`d7b7f0c893f4`** (`scripts/seed-fingerprint.txt`). Historical values
> (`63fe5110e230` base-only, `c9ebee53588c` world-loaded-with-counts) belong
> to the old count-sensitive hash and are NOT comparable — the removal flow
> above must be re-baselined against `d7b7f0c893f4`'s successor if you ever
> go back to a base-only state (a `reset:local --no-demo` run recomputes it).

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
