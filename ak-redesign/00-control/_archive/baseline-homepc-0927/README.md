# baseline/ — REAL capture, 2026-09-27 (round 3)

**These are valid design baselines** (unlike the 2026-09-27 round-2 set, deleted, which
showed only the Next.js error overlay from the disabled cloud deployment).

## Capture environment

- Backend: **local open-source Convex** (`local-harinie-cemvp-2`) at `http://127.0.0.1:3210`, detached `convex dev` watcher running.
- Data: **demo seed applied** — 10 members (maya, jordan, priya, luca, amina, noah, sofia, kenji, elena, samir), 12 demo tools, 15 posts × 10 members = 150 posts across all 7 types, comments on every 3rd post, 6 hero slots, chrome queues (vibing 6, waitlist 8, cases 4, candidates 3, alerts 2, featured 2).
- Auth: forum captures are **logged in** as `devtest@example.com` (staff allow-list account, every role); `/landing` + `/signin` are logged-out; admin captures are logged in (1440 only) — header shows the **administrator** badge.
- The CMP consent overlay ("Your privacy choices") was dismissed before each capture (it otherwise covers first-visit UI).
- Viewports 390×844 and 1440×900; ~3.5s settle; never `networkidle` (Convex websockets).
- Real data references: discussion = `/discussions/demo-compare-from-maya-2-8f6ar5` (discovered from the live feed), user = `/users/maya` (handle confirmed from feed slugs — the feed DOM exposes no /users links).

## Files

- `{route}-{390|1440}.png` — forum logged in: feed, discussions, new-post, users, notifications, search, discover, category-debate, leaderboard, drafts, settings-profile, setup
- `landing-*` / `signin-*` — forum logged out
- `admin-{home,moderation,editorial,readiness}-1440.png` — admin console
- `feed-full-390.png`, `discussions-full-390.png` — full-page mobile captures
- `CONTACT-390.png` / `CONTACT-1440.png` — labelled contact sheets

## Notes

- `/leaderboard` shows its "Podium is forming" state by design (needs 25 eligible contributors; seed has 10).
- Observed backend log noise at startup: several scheduled jobs (analytics/projections:l08Core, jobs/legitimacy:recompute, jobs/maxRefresh:sweep, admin/homeAlertWriters:rankIntegritySweep, jobs/repeatInfringer:evaluate) throw "Tried to query index … didn't use the index fields in order" — pre-existing app-level issue, logged in SETUP-REPORT-R3, not fixed here.

## Re-capture

```bash
# backend running (pnpm backend) + apps running (pnpm dev, pnpm dev:admin)
# storageStates assumed at %TEMP%/ce-forum-state.json + ce-admin-state.json
# (re-create the devtest session first if missing)
node <this-script> # ce-baselines.mjs (temp, not committed) — see SETUP-REPORT-R3 for its logic
```
