---
id: SCREEN-INVENTORY
type: CONTROL
author-model: GLM
tool: ZCode CLI
date: 2026-10-03
status: READ-ONLY PM INVENTORY (no code changed; not committed)
---

# SCREEN-INVENTORY — every screen in Createconomy

**Method / sources read:**
- Routes: `git ls-tree` on **`origin/011-Akilesh-Redesign` @ `132bae0`** (all four apps). Working tree was `s00-t04-no-fabricated-data` @ `98ef61a` — not switched.
- s00-t04 deletions vs merge-base `132bae0`: `/content`, `/content/spark` deleted; `/category/[slug]/page.tsx` rewritten to live filtered feed (S00-T04, D-012).
- Specs: `ak-redesign/00-control/SPEC-INDEX.md` (S00–S14 + SEC), `specs/S00-SPEC.md` (APPROVED), `specs/S02-SPEC.md` (DRAFT, exists **only on `origin/s02-feed-ui` @ `f003876`**). **No other S-series SPEC files exist.**
- Design refs: `specs/S02-refs/prototype-v2/` (on `origin/s02-feed-ui` @ `f003876` — real-repo slice: feed page + login/signup modals; `screens/` = feed, login-modal, signup-modal × 390/1440 × dark/light) and `specs/S02-refs/prototype/` (v1: 12 routes + auth modal + report dialog).
- Lab ports: **`origin/s02-feed-ui` @ `f003876`** → `/lab` (index), `/lab/utilities` (also on 011/HEAD from S00-T03), `/lab/feed` (feed display port, fixtures only). **`origin/s01-auth-ui` does not exist** — no trace in any local/remote ref or history → S01 has **no lab port**. The S02 worktree (`CE-MVP-explore`) is clean @ `f003876` — no S02-NOTES logged, no live tweaks yet.
- Ground truth for "wired to real data": `00-control/CURRENT-STATE.md` §2–§4, amended by S00-T04 (branch `s00-t04-no-fabricated-data` @ `ada2e4a`, pending Grok review + merge into 011).

**Definitions applied:** screen = distinct route OR full-screen sheet/modal/drawer. States, auth variants, own-vs-other, mobile-vs-desktop = variants. Small centered confirm/form dialogs = variants of their parent screen (listed in "Non-screen surfaces"). Redirects, dev-only pages, parked apps = not counted.

---

## TABLE A — USER-FACING

| # | Screen | Route or trigger | Spec | Design ref | Lab port | Tweaked | Wired to real data | Variants + states needed | Notes |
|---|---|---|---|---|---|---|---|---|---|
| **S02 — Feed + Search** |||||||||
| 1 | Feed | `/feed` | S02-SPEC (DRAFT, feed part) + S00 | **v2** (v1 superseded) | s02-feed-ui@f003876 (`/lab/feed`) | no — founder rulings 2026-10-03 in spec; live tweak pending (D-016) | yes (`feed.list`, `getChrome`) | in/out nearly identical at 390; desktop hero + left nav + Vibing/Podium rail; sort Top/Hot/New/Fav; loading/empty ✓, error ✗ (S00-T10); title clamp broken (CS §2.5) | Display components built on s02-feed-ui; GLM wiring of `/feed` pending |
| 2 | Search | `/search` | S07 (index row only) | none | no | no | yes (keyword match posts/tools/members) | default empty state; grouped results; no recents/suggestions; no error UI | Subtitle is policy copy (CS §2.11); S07 will design it |
| **S04 — Composer** |||||||||
| 3 | Composer | `/new-post` | S04 (row) + S00 | v1 (`/new-post`) | no | no | yes (typed fields → real mutations; drafts localStorage) | 8 post types (6 in picker); TipTap lazy; floating bottom bar + top Publish (two affordances); out → auth gate; publish moment missing (S04) | Rebuild on TipTap ruling (CS §2.7); CR-005 server drafts |
| 4 | Drafts | `/drafts` | S04 (row) | v1 (`/drafts`) | no | no | partly (localStorage only, per-device) | empty state + "Write a post" CTA | CR-005 |
| **S03 — Post + Threads** |||||||||
| 5 | Discussion (post detail) | `/discussions/[slug]` | S03 (row) + S00 | v1 (`/discussions/[slug]`) | no | no | yes (canonical `postSeoMeta`; legacy fallback) | per-type bodies (review/compare/spark/debate/list/showcase/help/news/gigs); Verdict block; sort chips; collapsed replies; MAX layer empty state; leaks to remove (CS §2.6) | Reference impl — extend, don't fork |
| 6 | Showcase media viewer (overlay) | fullscreen Dialog in `ShowcaseBody` | S03 (row, showcase mechanics) | none | no | no | yes | fullscreen media lightbox; Esc/backdrop close | Full-screen overlay → counted |
| **S05 — Profile** |||||||||
| 7 | Profile (public) | `/users/[handle]` | S05 (row) | v1 (`/profile` — approximates) | no | no | partly (real user/completion; `avatarUrl` null, awards empty, no posts in projection) | own vs other; Overview/Metrics tabs; not-found | CR-003 avatars, CR-008 body of work + awards; Profile tab lands here after D-010 |
| 8 | Notifications | `/notifications` | S05 (row) | v1 (`/notifications`) | no | no | partly (real rows; no actor/object identity → "Someone", CR-004) | in only (out → sign-in card); unread tint; mark read; 7 types | The recognition surface (CS §2.10) |
| **S12 — Affiliate suite** |||||||||
| 9 | Storefront | `/s/[handle]` | S12 (row) | none | no | no | yes (storefronts seeded) | public creator page + product list | |
| 10 | Storefront product | `/s/[handle]/[product]` | S12 (row) | none | no | no | yes (product versions, validation) | product detail + CTA | |
| 11 | Affiliate redirect | `/go/[linkId]` | S12 (row) | none | no | no | yes (link resolution) | interstitial | Founder/legal-owned copy |
| 12 | Sell dashboard | `/sell` | S12 (row) | none | no | no | yes | pause + request-edit dialogs (variants); CAP-leak copy (CS §3) | Built in the 09-12 audit reconciliation |
| 13 | Seller application | `/sell/apply` | S12 (row) | none | no | no | yes (store requests) | form + gate | |
| **S01 — First visit & join** |||||||||
| 14 | Landing | `/landing` | S01 (row) | v1 (`/`) | no | no | partly (real signup-mode gate; static copy, no social proof; logged-in dead end) | out = in today; beta pill; footer legal links | D-009 open front door changes this |
| 15 | Sign in | `/signin` | S01 (row) | v2 (via auth modal) | no | no | yes (opens auth modal; admission-driven notice) | out (in → redirect to app) | "sign-ups closed" notice is readiness-driven (CS §2.2) |
| 16 | Setup / onboarding | `/setup` | S01 (row) | none | no | no | yes (interest tiles, consents, rules accept, optional SMS) | in only; inline spinner/error; empty tiles state | consent voice + `rules.v1` leak (CS §2.4); no avatar step (CR-003) |
| 17 | Waitlist | `/waitlist` | **none** (gap c) | none | no | no | yes (waitlist capture) | out; ops fallback only after D-009 | Not in any spec row |
| 18 | Auth modal (overlay) | `packages/auth-ui` via top-nav / layout / signin / composer / notifications | S01 (row — "auth modal skin") | **v2** (login-modal + signup-modal) | no | no | yes (password auth; OAuth providers intentionally unconfigured) | login/signup tabs; in/out triggers | Reference impl — extend, don't fork (CS §2.2) |
| **S06 — Discover & category** |||||||||
| 19 | Discover | `/discover` | S06 (row) | v1 (`/discover`) | no | no | yes (real categories) | type directory → `/category/[slug]`; empty state | "a menu, not discovery" (CS §2.12) |
| 20 | Category home | `/category/[slug]` | S00 §11 (approved) + S06 (row, upgrade) | none | no | no | **no on 011** (fabricated static seed, CS §2.13) → **yes on s00-t04** (live filtered feed) | per-type filtered feed; unknown slug 404; header from label map; empty → "No {type} posts yet" | S00-T04 @ `ada2e4a`, pending merge |
| **S08 — Settings** |||||||||
| 21 | Settings | `/settings/profile` (`/settings` redirects here) | S08 (row) | v1 (`/settings`) | no | no | yes (real mutations) | rules re-accept banner; per-field Save; erase rows (raw field names today); linked handles; consent/privacy blocks | iOS-style regrouping in S08 |
| **S09 — Leaderboard** |||||||||
| 22 | Leaderboard | `/leaderboard` | S00 §11 (approved) + S09 (row) | v1 (`/leaderboard`) | no | no | partly — fabricated multipliers on 011 (CS §2.14) removed on s00-t04; Overall real, category tabs Empty until CR-006 | tabs Overall/Commenter/Helper/Reviewer/Rising × windows 24H/7D/1M; "forming" floor (25) | S00-T04 @ `ada2e4a` |
| **S10 — Tools & reviews** |||||||||
| 23 | Tools registry | `/tools` | S10 (row) | none | no | no | yes (8 seeded tools) | list/grid | |
| 24 | Tool detail + rating | `/tools/[slug]` | S10 (row) | none | no | no | yes (detail + rating form, 9 dimensions) | withdraw-rating confirm dialog (variant); raw dimension keys today | Linked from Verdict block |
| **S11 — Resources** |||||||||
| 25 | Resources library | `/resources` | S11 (row) | none | no | no | yes (schema-backed; 0 rows in local seed) | empty state | Landing's primary CTA target |
| 26 | Resource viewer | `/resources/[slug]/view` | S11 (row) | none | no | no | yes (pdf-viewer exists) | per-format viewer | |
| **S13 — Content & static** |||||||||
| 27 | About | `/about` | S13 (row) | none | no | no | yes (LegalDocPage pattern) | prose | |
| 28 | Help | `/help` | S13 (row) | none | no | no | yes | prose | |
| 29 | AI disclosure | `/ai-disclosure` | S13 (row) | none | no | no | yes | prose | AI-label compliance surface |
| 30 | Editorial policy | `/editorial-policy` | S13 (row) | none | no | no | yes | prose | |
| 31 | How we review | `/how-we-review` | S13 (row) | none | no | no | yes | prose | |
| 32 | How we use your store data | `/how-we-use-your-store-data` | S13 (row) | none | no | no | yes | prose | |
| 33 | Privacy | `/privacy` | S13 (row) | none | no | no | partly — `unavailable_pending_legal` until `convex:seed-legal` runs | prose / pending state | Legal-owned copy |
| 34 | Terms | `/terms` | S13 (row) | none | no | no | partly (same) | prose / pending | Legal-owned copy |
| 35 | DMCA | `/dmca` | S13 (row) | none | no | no | partly (same) | prose / pending | Legal-owned copy |
| 36 | Repeat infringer | `/repeat-infringer` | S13 (row) | none | no | no | partly (same) | prose / pending | Legal-owned copy |
| 37 | Legal intake | `/legal/intake` | S13 (row) | none | no | no | yes (real form → `legalIntake`) | form states | |
| 38 | Appeal | `/appeal/[actionId]` | S13 (row) | none | no | no | yes (real appeal form) | per-action | |
| 39 | Contribute | `/contribute` | S13 (row) | none | no | no | yes (rights-basis upload flow) | form + acknowledge contract | |
| 40 | AI persona directory | `/personas` | S13 (row) | none | no | no | yes (real queries; 0 personas in local seed) | empty state; labels must stay | |
| 41 | AI persona detail | `/personas/[id]` | S13 (row) | none | no | no | yes (empty in seed) | not-found | |

### Deleted by s00-t04 (on 011, not counted in totals)

| Screen | Route | Status |
|---|---|---|
| Content hub | `/content` | deleted on `s00-t04-no-fabricated-data` @ `ada2e4a` (thin wrapper, CS §3); branch pending Grok review + merge to 011 |
| Spark hub | `/content/spark` | same |

### Redirects (not screens)

`/` → `/feed` (also in `next.config.mjs`); `/welcome` → `/feed` (retired); `/profile` → `/settings/profile` (D-010 will retarget to own `/users/[handle]`); `/settings` → `/settings/profile`.

---

## TABLE B — CONSOLE (admin, moderation, S14)

| # | Screen | Route or trigger | Spec | Design ref | Lab port | Tweaked | Wired to real data | Variants + states needed | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Admin landing | `/admin` | S14 (row — during beta) | none | no | no | yes (widget cards from CAP-392 catalog) | ⌘K entry | Port 3001; forum `/admin` redirects here |
| 2 | Alert home | `/admin/home` | S14 (row) | none | no | no | yes | alert feed | |
| 3 | Editorial pipeline | `/admin/editorial` | S14 (row) | none | no | no | yes | review queue + dialogs | |
| 4 | Curation | `/admin/curation` | S14 (row) | none | no | no | yes | queue | |
| 5 | Sources | `/admin/sources` | S14 (row) | none | no | no | yes | registry + dialogs | |
| 6 | Moderation queue | `/admin/moderation` | S14 (row) | none | no | no | yes | queue states | Trust & safety |
| 7 | Support | `/admin/support` | S14 (row) | none | no | no | yes | intervention inbox (F-38) | |
| 8 | Audit log | `/admin/audit` | S14 (row) | none | no | no | yes | log table | |
| 9 | Personas | `/admin/personas` | S14 (row) | none | no | no | yes (empty until personas seeded) | list | |
| 10 | Persona genome | `/admin/personas/genome` | S14 (row) | none | no | no | yes (empty in seed) | editor | |
| 11 | Persona queue | `/admin/personas/queue` | S14 (row) | none | no | no | yes (empty in seed) | queue | |
| 12 | Launch readiness | `/admin/readiness` | S14 (row) | none | no | no | yes | category checklist | **Controls the "sign-ups closed" state (D-009)** |
| 13 | System config | `/admin/config` | S14 (row) | none | no | no | yes | key registry + dialogs | |
| 14 | Roles | `/admin/roles` | S14 (row) | none | no | no | yes | assignments | |
| 15 | Rulebook | `/admin/rulebook` | S14 (row) | none | no | no | yes | versions + deploy dialog | `rulebook:deploySeed` |
| 16 | Analytics | `/admin/analytics` | S14 (row) | none | no | no | yes | A2 charts unspecified (flag) | |
| 17 | Reliability / jobs | `/admin/reliability` | S14 (row) | none | no | no | yes | job health | |
| 18 | Store | `/admin/store` | S14 (row) | none | no | no | yes | commerce queue | |
| 19 | Affiliate inventory | `/admin/affiliate-inventory` | S14 (row) | none | no | no | yes | inventory + dialogs | |
| 20 | Resources | `/admin/resources` | S14 (row) | none | no | no | yes | moderation queue | |
| 21 | UTM dictionary | `/admin/utm` | S14 (row) | none | no | no | yes | table | |
| 22 | SEO | `/admin/seo` | S14 (row) | none | no | no | yes | health table | |
| 23 | Wiki | `/admin/wiki` | S14 (row) | none | no | no | yes | article list | |
| 24 | Admin command palette (overlay) | ⌘K via `admin/layout.tsx` | S14 (row) | none | no | no | yes (nav-config sections) | fuzzy console search | Full-screen overlay → counted |

Admin app root `/` → `/admin` (redirect). Shared Convex backend; S14 = token/state-kit restyle only, "no new flows".

---

## Totals

| Measure | Count |
|---|---|
| **User-facing screens (Table A)** | **41** = 39 routes + 2 overlays (auth modal, showcase viewer) |
| **Console screens (Table B)** | **24** = 23 routes + 1 overlay (admin ⌘K palette) |
| **Total screens** | **65** |
| With a design ref — user-facing | **12 / 41** (v2: feed, auth modal, signin-via-modal = 3; v1: landing, discussions, new-post, drafts, users, notifications, discover, leaderboard, settings = 9) |
| With a design ref — console | **0 / 24** |
| With a lab port | **1 / 41** (feed — `origin/s02-feed-ui`@`f003876`; **no S01 lab port: `origin/s01-auth-ui` does not exist**) |
| Tweaked (live founder tweak) | **0** — S02 rulings of 2026-10-03 are recorded in the spec; the live tweak session hasn't happened |
| Wired to real data — user-facing | **32 yes / 9 partly / 0 no** (at s00-t04; at 011 it is 31/9/1 — `/category` was the fabricated "no") |
| Wired to real data — console | **24 yes** (several render empty until pipeline data/personas exist) |

Partly-wired user-facing: drafts (localStorage), users (no avatar/awards/posts), notifications ("Someone", CR-004), landing (static copy + logged-in dead end), leaderboard (Overall real; tabs Empty until CR-006), privacy/terms/dmca/repeat-infringer (until legal seed).

## GAPS (flagged, not fixed)

**(a) In a design ref but in no spec**
- Prototype v1 **`/campaigns`** — no CE route, no SPEC-INDEX row, mentioned nowhere.
- Prototype v1 **`/discussion/[id]`** (singular) — a second thread design alongside `/discussions/[slug]`; no distinct route/spec. Needs a ruling on which design S03 uses.

**(b) In a spec but no design ref** (SPEC-INDEX row exists; neither prototype has the screen)
- S06: category home (`/category/[slug]` upgrade beyond S00's filtered feed).
- S07: search (no `/search` in either prototype).
- S01: `/setup`, `/waitlist` (landing + auth modal do have refs).
- S10: `/tools`, `/tools/[slug]`. S11: `/resources`, `/resources/[slug]/view`. S12: all five routes. S13: all 15 routes + showcase viewer (row 6).
- S14: all console screens (by design — restyle-only on shared tokens).

**(c) A live route with no spec**
- **`/waitlist`** — not in any SPEC-INDEX row (S01 covers landing/signin/setup only); CURRENT-STATE calls it an ops fallback post-D-009.
- **`/content`, `/content/spark`** — live on 011 with no spec; **deleted on s00-t04** (merge pending), which resolves this.

**(d) A spec with no route**
- None — every route named in S00–S14 exists. But several **spec'd overlays have no live trigger yet**: avatar menu sheet (S00-T12), sheet primitive itself (S00-T08), type-picker sheet + publish moment (S04), rules re-accept sheet (S08). Share is deliberately the OS share sheet (`navigator.share`), not an in-app route.

## Dev-only (not counted)

- `/kit` — component showcase; S00-T15 will 404 it in prod (pending).
- `/lab`, `/lab/utilities` — S00 variant/utility canvas (on 011 and HEAD; dev guard pending S00-T15).
- `/lab/feed` — feed display port; **only on `origin/s02-feed-ui` @ `f003876`**.
- Forum command palette component — only reachable from `/kit` (not wired into the member shell; S00 §9 plans desktop lazy-load).
- Parked placeholder apps: `apps/seller` `/`, `apps/marketplace` `/`.

## Non-screen surfaces (not counted)

- Share previews / OG: `postSeoMeta` per post (+ `navigator.share`/clipboard at runtime).
- Notification copy: 17 schema types; actor/object context missing (CR-004).
- Emails: provider unwired (Bucket-1).
- Small centered dialogs (variants of their parent screen): discussion report modal, feed report-post dialog, gigs "Apply" dialog, tool rating withdraw confirm, sell pause confirm, sell request-edit form, notifications logged-out sign-in card.
- Inline reply composer (thread); feed widgets (What's Vibing, Podium); PWA app-feel (manifest/icons, S00-T06).
