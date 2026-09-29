---
id: SETUP-R3
type: REPORT
author-model: GLM 5.3
tool: zcode
round: 3
status: DONE
date: 2026-09-28
---

# SETUP-REPORT R3 — anti-drift local dev + demo seed + baselines

Branch `012-local-convex` (on top of `8a1279c`, the Windows local-setup fixes).
Goal: any machine reaches an identical, realistic local state with one command. Achieved: `DEV_TEST_USER_PASSWORD='<pw>' pnpm reset:local` → fingerprint `c410ddce4f57` (v2 hash — see §4).

## 1. Demo seed — what shipped (`convex/seed/demo.ts`, `pnpm seed:demo`)

Gated three ways (review-fix, see §9): the script selector must be exactly `anonymous:anonymous-*`/`local:local-*`; every spawned convex child runs with retargeting env overrides (`CONVEX_DEPLOY_KEY` + self-hosted vars) stripped; and each seed mutation calls the server-side allowlist `seed/devGuard` first — a loopback `CONVEX_CLOUD_URL` is the only accepted shape, so any cloud deployment is refused regardless of name. Deterministic — no `Math.random`, every timestamp is `now − fixedOffset` (−10min … −60d), so ages always look fresh. Idempotent — every insert is keyed on a natural key (email, slug, exact title, dedupeKey, composite index) and skipped when present; a second run reports `created: 0`.

| Content | Count | Notes |
|---|---|---|
| Members | 15 | signal levels 1–8 (orbit…galaxy: 2/2/2/2/3/2/1/1), realistic creator bios, `@demo.createconomy.invalid` emails |
| Per-member distributions | 15 | `ensureDistributionTx` + patched might/level/reach; level assignments against the founding season |
| Distribution memberships | 28 | everyone joins the two flagship distributions (Reach) — (15 − 1) × 2 |
| Tools | 8 | `demo-*` slugs, referenced by review/compare posts |
| Posts | 60 | all 5 categories × all 7 member post types; ages −10min…−60d |
| Edge cases | 3 | two-line-overflow title, ~4k-char body (full-year audit), empty body |
| The thread | 21 comments | root + 20 depth-1 replies, 11 participants, chained replies every 4th |
| Scattered comments | 8 | on non-thread posts; several posts guaranteed zero comments |
| Comment upvotes / saves | 7 / 1 | `commentReactions` valuable + `commentSaves` |
| Post bookmarks | 10 | `saves` |
| Debate / list votes | 7 / 1 | agree/disagree mix + top list-item vote |
| Badges | 26 | level milestones (level ≥ moon) + profile completion, `badges` table + `users.completionBadges` |
| Journal (activityLedger) | 15 | one `tier_unlocked` row per member |
| Leaderboard | d7 + h24 | 10 ranked entries, points derived from might (deterministic) |
| Feed chrome | 6 vibing / 3 hero / 1 featured | trends+hooks, hero slots, editor's pick |
| Notifications (devtest) | 6 | 3 unread + 3 read across 6 types, real post/comment ids, ages 8min…3d |

## 2. What could NOT be seeded (would need backend changes — not hacked around)

| Spec item | Blocker |
|---|---|
| **Follows** | No follow table exists in the schema — only the `firstFollowMade` activation bit. Follow edges are a backend change (change request per CONVENTIONS). |
| **Streaks** | No streak field/table anywhere in the schema. Same as above. |
| **Post-level upvote rows** | Posts have no vote table; engagement lives as counters in `postDistributionScores` (seeded). Comment-level upvotes exist and are seeded. |
| **Avatars** | `profile/page.tsx` hardcodes `avatarUrl: null` in both projections (renders initials by design at this stage) — no seed-side path can light an avatar up. |
| **Leaderboard podium page** | `MIN_CONTRIBUTORS = 25` (CAP-294 "never fabricates rankings") — with 15 members the page correctly renders "Podium is forming". The feed sidebar Podium DOES render the seeded top-5. Reaching the page floor needs ≥25 real members, not seed trickery. |
| **9 categories** | The platform has 5 categories (seed:bootstrap's canonical set). "9" in the brief matches the 9 visible feed nav entries = 5 categories + post-type facets. All 5 × all 7 member post types are covered. |

## 3. `pnpm reset:local` — the officially supported wipe

Data-only wipe via **`convex import --replace-all --yes` with an empty table file** — the CLI's documented semantics: *"clearing tables that appear in the schema but not in the import file"*. Functions, schema, backend env (auth keys, FOUNDER_EMAILS), and storage survive (unlike deleting `.convex/` state, which resets the deployment). Then: `seed:bootstrap` → `legalContent:seedDefaults` → `rulebook:deploySeed` → `admin/widgetsCatalog:deploySeed` → `dev/ensureTestUser:ensure` (password via `DEV_TEST_USER_PASSWORD`/`--password`, set-and-removed around the call, never committed; FOUNDER_EMAILS allow-list auto-grants every staff role — verified `roleAssignments = 7`) → `seed/demo:seed` → `seed:check`.

## 4. `pnpm seed:check` — fingerprint

Row counts for **all 175 tables** + stable identity keys (emails, post titles, tool slugs, notification dedupeKeys, badge labels resolved to emails — never timestamps or generated ids), folded into a sha256 short hash. Runtime-volatile tables (auth sessions, jobRuns, rawEvents, reading progress, feed exploration state, level-commit history, etc. — **24 tables** listed in `scripts/seed-check.mjs`) are printed but excluded from the hash: their counts depend on wall-clock activity and would break parity without saying anything about seed parity. `systemConfig` is counted **excluding** the two `tools.ratings.driftCheck.*` watermark keys the hourly drift-check cron registers after a reset (key-level exclusion via `isRuntimeConfigKey`, unit-tested in `tests/convex/dev-guard.test.ts`) — the 45 seeded config rows keep their drift signal while the hash stays stable across the cron's fire.

**Fingerprint after `reset:local` (v4): `63fe5110e230`** — stored in `scripts/seed-fingerprint.txt`, the single source; `seed:check` compares against it and fails closed on mismatch. Two machines running `reset:local` should match this value (deviation = drifted code or seeds, investigate before comparing screenshots).

*v2 note (review fix):* the earlier value `9b9edfdf12c0` hashed `feedExplorationState`, which logged-in browsing writes (one row per post viewed — the R3 baseline captures wrote 60). It is now hash-excluded like the other runtime tables, so the fingerprint survives browsing; the exclusion itself changed the hash, hence the new canonical value. *v3 note (R2 review fix):* the `systemConfig` watermark exclusion above is count-neutral right after a reset (45 with or without watermarks), so the canonical value is unchanged — it only becomes robust once the hourly cron fires. *v4 note (team workflow):* badges now count seeded types only (`isSeededBadge`: `level_milestone` + `profile_completion` — award crons mint `discoverer` badges from seeded leaderboard data; 7 appeared after one overnight catch-up), and `distributionLevelAssignments` + `pilotKillGateEvaluations` joined the volatile set (the monthly level-commit cron appends history rows when catch-up fires after downtime). The definition change moved the canonical value to `63fe5110e230`.

## 5. Rendering verification (390px, live demo data)

| Surface | Result |
|---|---|
| `/feed` | hero slots (Community Top + 2 Featured), Hot/Top/New tabs, cards with type badge, author, date, one-liner, ▲/💬/🔖 counts. Long-title fixture renders. |
| `/discussions/<thread>` | review layout, body, the 21-reply thread incl. chained replies. |
| `/users/maya` | name, handle, bio, profile-completion badges. |
| `/notifications` | 6 seeded rows, correct types + relative ages, Mark-read actions, header unread badge = 3. |
| `/leaderboard` | contract-correct "Podium is forming" (25-contributor floor; see §2). |
| Sign-in | devtest works end-to-end (RS256 local keys; staff roles). |

## 6. Baselines — `ak-redesign/00-control/baselines/`

16 core routes (RAW-INVENTORY §E list) × {390, 1440} × {logged-out, logged-in} = 64 captures + `CONTACT-390.png` / `CONTACT-1440.png` labelled contact sheets (4-column grid, top-900px preview per page; full-length pages live in the individual PNGs). Logged-in = devtest@example.com via the real auth modal. The thread slug is discovered live (post ids regenerate per reset). Captured with the system Edge channel (Playwright CDN download failed on this network); Next dev-tools badge hidden. The CMP consent banner is dismissed per-tab via a context init script (`sessionStorage cmp.dismissed=1`) — it never appears in any capture. R2's blocker (disabled cloud deployment covering every page with the dev error overlay) is gone.

**Visual acceptance: both contact sheets PASS** (independent visual review): all 16 routes present in both states at both widths; every cell a real render with seeded content; logged-out shows `Login` + auth gates on protected routes, logged-in shows unread badge 3 + avatar D + per-card `Why this?/Hide/Mute/Report` actions.

Render observations (non-blocking):
1. The sticky mobile bottom tab bar appears mid-page in some fullPage captures — a fullPage-screenshot artifact of sticky elements, not a page defect.
2. Redirect routes are captured at their target (`/welcome`, `/profile`, `/settings` → `/settings/profile`); by design.
3. `/landing` shows no auth indicator in either state — logged-in and logged-out cells are visually identical there.
4. First-paint loading inconsistency (spinner / null-blank / skeleton mix) remains as catalogued in RAW-INVENTORY §E.

Capture-tooling lessons (round 1 of the sheets failed review, fixed before commit): `object-fit: cover` height-caps center-crop short pages horizontally and reads as page overflow — use width-fit `img { width:100%; height:auto }` inside a fixed-height `overflow:hidden` figure; and per-tab sessionStorage consent needs a context-level `addInitScript`, not per-page clicks.

## 7. Cron `.withIndex` failures (for the dev team)

The local backend enforces index-prefix order strictly; these scheduled jobs throw `Uncaught Error: Tried to query index … didn't use the index fields in order` on every fire. Fix = add the leading field's equality filter or use a suitable index. **No code was changed** (backend change = change request per CONVENTIONS).

| Function | Index (ordered fields) | Query used | Missing leading field |
|---|---|---|---|
| `admin/homeAlertWriters:rankIntegritySweep` | `integrityFlags.by_actor_disposition` ["actorUserId","disposition","_creationTime"] | ["disposition"] | `actorUserId` |
| `analytics/projections:l08Core` | `rawEvents.by_eventType_time` ["eventType","occurredAt","_creationTime"] | ["occurredAt"] | `eventType` |
| `analytics/projections:orphanSweep` | `rawEvents.by_eventType_time` ["eventType","occurredAt","_creationTime"] | ["occurredAt"] | `eventType` |
| `jobs/legitimacy:recompute` | `rawEvents.by_user_time` ["userId","occurredAt","_creationTime"] | ["occurredAt"] | `userId` |
| `jobs/maxRefresh:sweep` | `comments.by_post_depth_created` ["postId","depth","createdAt","_creationTime"] | ["depth"] | `postId` |
| `jobs/repeatInfringer:evaluate` | `strikes.by_user_active` ["userId","active","_creationTime"] | ["active"] | `userId` |

`jobs/maxRefresh:sweep` fires every 15 min and `analytics/projections:*` hourly — they dominate backend log noise.

## 8. Machine notes (Windows/office laptop)

- Node 24.15.0 via fnm; pnpm 10.28.2. In Git Bash the pnpm sh shim is broken — use PowerShell/cmd for `pnpm` or invoke `pnpm.cjs` via node (setup scripts do the latter automatically).
- `.gitattributes` now pins `* text=auto eol=lf` (commit `cbf2b2b`) — CRLF checkouts failed 2 source-assertion tests.
- Convex CLI children on Node 24/Windows hit a libuv `UV_HANDLE_CLOSING` assertion **after** printing successful results; all seed wrappers tolerate it (result JSON is the source of truth, exit code is not).

## Errors hit and resolved during the build

1. `esbuild: Unexpected "*"` — a `local:*/anonymous:*` inside a block comment closed it early (the `*/`). Reworded.
2. `h.startsWith is not a function` — the Convex 1.34 filter builder has no `startsWith`; replaced with a collect+JS match.
3. Fingerprint initially unstable across resets — two causes fixed: badge keys embedded generated user ids (now resolved to emails), and volatile runtime tables excluded from the hash.
4. Playwright CDN download failed → captured via system Edge channel (`channel: "msedge"`).

## 9. Guard tests (review fix — each attack re-run against the shipped code)

Layers after the fix: (1) script selector must be exactly `anonymous:anonymous-<name>`/`local:local-<name>`; (2) every spawned convex child runs with `CONVEX_DEPLOY_KEY`, `CONVEX_SELF_HOSTED_URL`, `CONVEX_SELF_HOSTED_ADMIN_KEY`, `CONVEX_URL` stripped from its env (named in a warning); (3) `seed/devGuard:assertLocal` — a server-side allowlist accepting only a loopback `CONVEX_CLOUD_URL` — runs as a preflight before anything destructive and again inside every seed mutation. All test values below are FAKE.

**Attack 1 — fake `CONVEX_DEPLOY_KEY` (+ fake prod `CONVEX_URL`) exported in the shell, then `reset:local`:**
```
→ preflight: seed/devGuard:assertLocal …
  [!] WARNING: removed from child env (these would retarget the CLI at a
      cloud deployment regardless of the selector): CONVEX_DEPLOY_KEY, CONVEX_URL
  [✓] server-side guard passed — CLI is talking to the local backend
  [✓] all tables cleared (functions/schema/env untouched)
  … reset completes against the LOCAL backend; fingerprint unchanged — the attack is neutralized
```
(The review's scenario — key retargets `import --replace-all` at a cloud deployment — cannot occur from the shell: the key never reaches the child. Caveat: a key stored in `.env.local` IS reloaded by the CLI after spawn — the preflight's positive confirmation is the layer that catches that case, since a cloud-resolving CLI cannot produce `{ ok: true, url: <loopback> }`.)

**Attack 2 — `CONVEX_DEPLOYMENT=anonymous:energetic-kangaroo-55`:**
```
  [✗] seed:demo: refusing to run.
      CONVEX_DEPLOYMENT is anonymous:energetic-kangaroo-55 — expected anonymous:anonymous-* or local:local-*
      (the CLI treats only those names as the local backend; anything else
       targets a cloud project). …
  EXIT: 1
```

**Attack 3 — direct `convex run seed/demo:seed` (bypassing the scripts):** the seed mutations call the server-side guard first, so the direct path is guarded by deployment *type*, not name. On this machine the deployment is genuinely loopback, so the direct run passes — refusal is proven by the automated suite (`tests/convex/dev-guard.test.ts`, 6 cases, in `pnpm test:convex`):
```
✓ tests/convex/dev-guard.test.ts (6 tests) 11ms
  · accepts http://127.0.0.1:3210 and http://localhost[:port]
  · refuses https://energetic-kangaroo-55.convex.cloud
  · refuses ANY cloud URL (unnamed deployments too) and non-convex hosts
  · refuses loopback-lookalikes (127.0.0.1.evil.example, localhost.evil.example, …/127.0.0.1)
  · refuses when CONVEX_CLOUD_URL is unset
```
Defense-in-depth discovered while testing: the platform itself rejects shadowing the built-in — `convex env set CONVEX_CLOUD_URL …` → `EnvVarNameForbidden: Environment variable with name "CONVEX_CLOUD_URL" is built-in and cannot be overridden`. The guard cannot be lied to via deployment env.

**Attack 4 — missing dev password:** exits non-zero BEFORE any wipe; data verified intact after the refusal:
```
  [✗] reset:local: DEV_TEST_USER_PASSWORD missing or shorter than 8 chars.
      … Nothing was wiped — the check runs before the data reset …
  EXIT: 1
  $ pnpm seed:check → users: 17  posts: 60  tools: 8  notifications: 6  badges: 26   (untouched)
```

**Check 5 — does a real `CONVEX_DEPLOY_KEY` exist on this machine** (shell profiles, `.env*` files, user/machine env vars): **NO**.

**Test 6 — normal run still works:**
```
→ preflight: seed/devGuard:assertLocal …
  [✓] server-side guard passed — CLI is talking to the local backend
  fingerprint: c410ddce4f57  (anonymous:anonymous-agent)
  [✓] reset:local complete — feed/profile/leaderboard/notifications are demo-populated
```
(Fingerprint value moved from `9b9edfdf12c0` to `c410ddce4f57` with this fix — `feedExplorationState`, written by logged-in browsing, joined the hash-excluded volatile set; see §4's v2 note.)

### 9.1 R2 review fixes (S00-PREP-REVIEW-R2) — guard tests, actual output

Both SHOULD-FIXes closed: (1) the selector is now a FULL-STRING match — `^(anonymous:anonymous-[a-z0-9-]+|local:local-[a-z0-9_-]+)$` on all three scripts (`seed:check` included; the CLI keeps only the last colon segment, so the previous prefix match waved `anonymous:anonymous-x:<cloud>` through); (2) the preflight is a POSITIVE confirmation with zero exit-status tolerance — `seed/devGuard:assertLocal` now returns `{ ok: true, url }`, read via `convex run --watch` (watch keeps the child alive so the small result payload is actually written — plain `run` on Windows/Node 24 dies in the libuv teardown abort and eats it entirely, 0 of 6 sampled runs produced any stdout). The script proceeds ONLY when stdout parses to exactly `{ ok, url }` with `ok === true` and a loopback url; crash, teardown assertion, non-zero exit, empty or unparseable output all abort. The UV_HANDLE_CLOSING tolerance survives only in the seed steps AFTER preflight.

**Attack — `CONVEX_DEPLOYMENT=anonymous:anonymous-x:energetic-kangaroo-55` (multi-colon; last segment is a cloud name). All three scripts, exit 1 before any CLI call:**
```
$ CONVEX_DEPLOYMENT=anonymous:anonymous-x:energetic-kangaroo-55 node scripts/seed-demo.mjs
  [✗] seed:demo: refusing to run.
      CONVEX_DEPLOYMENT is anonymous:anonymous-x:energetic-kangaroo-55 — expected exactly
      anonymous:anonymous-<name> or local:local-<name> (full string, no extra segments).
  EXIT: 1
$ … seed-check.mjs   → identical refusal, EXIT: 1
$ … reset-local.mjs --password …
  [✗] reset:local: refusing to run.  …same message…   EXIT: 1
  (without a password it exits on the input gate first — both gates precede any CLI call)
```

**Attack — preflight with no positive confirmation (simulated crash/empty stdout).** A non-Convex listener was bound to the backend port so the watch child could produce no result:
```
→ preflight: seed/devGuard:assertLocal (positive confirmation) …
  [✗] reset:local: preflight REFUSED — no positive confirmation (watch produced no result within 30s).
      stdout: ""
      stderr: "✖ A different local backend not convex is running on selected port 3210"
      Fail-closed: nothing runs without the guard's explicit { ok: true, url }.
  EXIT: 1        → data verified intact afterwards (no wipe ran)
```
Related discovery: with the local backend STOPPED, a `convex run` child auto-starts it (the confirmation is then honestly loopback — it talks to the local backend it just started); killing the watch child stops that auto-started backend, so a broken environment still cannot reach the wipe (observed: the subsequent import aborted with "Local backend isn't running", data intact).

**Normal run still passes** (all three scripts; `seed:check` output):
```
  [✓] server-side guard confirmed local backend (http://127.0.0.1:3210)
  fingerprint: c410ddce4f57  (anonymous:anonymous-agent)
```
Note: the task brief expected `9b9edfdf12c0`; that value predates the v2 hash (`feedExplorationState` exclusion, confirmed correct by the R2 review) — the canonical value is `c410ddce4f57`, reproduced across resets and now stable across the hourly drift-check cron (v3 key-level `systemConfig` watermark exclusion, unit-tested).
