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
Goal: any machine reaches an identical, realistic local state with one command. Achieved: `DEV_TEST_USER_PASSWORD='<pw>' pnpm reset:local` → fingerprint `9b9edfdf12c0`.

## 1. Demo seed — what shipped (`convex/seed/demo.ts`, `pnpm seed:demo`)

Hard-refuses anything but a `local:`/`anonymous:` deployment selector (scripts/lib/local-gate.mjs reads the selector the same way the CLI does); the module additionally refuses on any production URL in backend env. Deterministic — no `Math.random`, every timestamp is `now − fixedOffset` (−10min … −60d), so ages always look fresh. Idempotent — every insert is keyed on a natural key (email, slug, exact title, dedupeKey, composite index) and skipped when present; a second run reports `created: 0`.

| Content | Count | Notes |
|---|---|---|
| Members | 15 | signal levels 1–8 (orbit…galaxy: 2/2/2/2/3/2/1/1), realistic creator bios, `@demo.createconomy.invalid` emails |
| Per-member distributions | 15 | `ensureDistributionTx` + patched might/level/reach; level assignments against the founding season |
| Distribution memberships | 26 | everyone joins the two flagship distributions (Reach) |
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

Row counts for **all 175 tables** + stable identity keys (emails, post titles, tool slugs, notification dedupeKeys, badge labels resolved to emails — never timestamps or generated ids), folded into a sha256 short hash. Runtime-volatile tables (auth sessions, jobRuns, rawEvents, reading progress, etc. — 21 tables listed in `scripts/seed-check.mjs`) are printed but excluded from the hash: their counts depend on wall-clock activity and would break parity without saying anything about seed parity.

**Fingerprint after `reset:local`: `9b9edfdf12c0`** — reproduced identical across two consecutive full resets on this machine. Two machines running `reset:local` should match this value (deviation = drifted code or seeds, investigate before comparing screenshots).

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
