---
id: S00-PREP-REVIEW
type: REVIEW
author-model: Grok
tool: Cursor
round: 3
status: ACTIVE
date: 2026-09-28
---

# S00-PREP review — seed + reset tooling

Reviewed `cbf2b2b` `.gitattributes`, `8a82170` seed/reset/check, `7f4aa2e` baselines + SETUP-REPORT-R3. No schema change. No `apps/` change. New backend surface is `convex/seed/demo.ts` + `convex/seed/check.ts` only (internal). I did not re-run `reset:local`.

## Verdict: BLOCK

Named-prod `convex run seed/demo:seed` should throw. `pnpm reset:local` can still wipe a cloud deployment. Do not merge until the gate matches what the CLI actually targets.

## BLOCKER

- `scripts/lib/local-gate.mjs:37-43` — gate is only `/^(local|anonymous):/` on `CONVEX_DEPLOYMENT`. The CLI applies `CONVEX_DEPLOY_KEY` first and does not cross-check the selector (Convex 1.34 `deploymentSelection.ts` ~502–539). This machine’s `.env.local` is `anonymous:anonymous-…`, so the gate passes, then `reset-local.mjs:48-54` runs `convex import --replace-all`. A prod deploy key in the shell wipes that deployment. `seed/demo`’s URL check never runs for the import. Why it matters: one leftover env var deletes prod data.
- `scripts/lib/local-gate.mjs:43` — `anonymous:<name>` passes even when `<name>` does not start with `anonymous-`. The CLI treats only `anonymous-*` as the local backend (`deployment.ts:19-32`); anything else is resolved in the cloud project (import/run default to that project’s dev deployment, not local). `CONVEX_DEPLOYMENT=anonymous:energetic-kangaroo-55` is enough. Why it matters: the “local only” claim is false for a one-line env override.
- `convex/seed/demo.ts:205-209` and `demo.ts:1232` — `assertNotProd` is a substring check for `energetic-kangaroo-55` / `discuss.createconomy.com` inside the four mutations. Direct `npx convex run seed/demo:seed` skips the script. On the named prod those env URLs should make it throw. Any other cloud URL is allowed. The `seed` action itself does not check. Why it matters: prod is a string match, not a deployment-type match, and the wipe path has no match at all.

Tried and closed: unset `CONVEX_DEPLOYMENT` exits 1; a `prod:` selector is refused; `--prod` is not forwarded (`reset-local.mjs` only reads `--password`).

## SHOULD-FIX

- `scripts/reset-local.mjs:85-90` — missing/short `DEV_TEST_USER_PASSWORD` still wipes and seeds. Notifications are skipped when `devtest@example.com` is absent (`demo.ts:1174-1176`), and `roleAssignments` never get the staff rows. Why it matters: two machines do not share fingerprint `9b9edfdf12c0` unless both passed a password. Abort instead of continuing.
- `ak-redesign/00-control/SETUP-REPORT-R3.md:24` — memberships listed as 26. The loop is `(15 − 1) × 2` flagship joins (`demo.ts:404-432`) = 28. Why it matters: the inventory is the baseline the other machines will check. 60 posts, 20 replies + 1 root, 26 badges, 8 tools, and 6 notification specs do match the code.

## NIT

- `scripts/lib/local-gate.mjs:26-27` — comment says the selector is read the way the CLI reads it. It is not (deploy key wins).
- `README.md:51` and `SETUP-REPORT-R3.md:18` — “production can never be touched” overclaims the same gate.
- Hash design is otherwise stable: no `Math.random`; `Date.now()` is only `now − fixed offset` (`demo.ts:234`, `576`, `706`, `1173`); `seed/check.ts` sorts emails/titles/slugs/dedupeKeys/badge labels and the script sorts counts. Timestamps and generated ids are outside the hash. A cron that successfully writes a non-volatile table between seed and check can still move the hash; the six jobs in report §7 throw, so they do not.

## One-time commands per machine

`cbf2b2b` changes `* text=auto` to `* text=auto eol=lf` and does not renormalize the tree. This checkout is already `core.autocrlf=false` / `core.eol=lf`, so it stays clean. A Windows checkout with `core.autocrlf=true` (CRLF worktree) will show a mass line-ending diff after pull. Do not commit it. Once per machine:

```
git pull
git rm --cached -r .
git reset --hard
```
