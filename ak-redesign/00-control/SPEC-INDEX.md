---
id: SPEC-INDEX
type: CONTROL
author-model: Opus
tool: Claude Code (cloud)
round: 1
status: DRAFT (awaiting PM review + founder approval)
date: 2026-09-29
---

# SPEC-INDEX — every redesign spec, in build order

S00 first, then the member journey. Each row: scope (one line), benchmark ("beats X at Y"), depends on, CRs it waits on.
A spec is written only after its founder NOTES exist (D-003). Evidence for every row: `CURRENT-STATE.md` (§ numbers given).
"Ship line" = D-005 (proposed): S00–S05 done → private beta, 20 creators.

| ID | Spec | Scope (one line) | Benchmark | Depends on | Waits on CR |
|---|---|---|---|---|---|
| **S00** | **Foundation** | Single token source for forum+admin (STYLE-KIT, glow demoted); state kit (Skeleton/Empty/Error/Offline); app-feel (manifest, icons, apple-touch-icon, `viewport` export, theme-color, safe areas, standalone); sheet/drawer primitive; mobile shell (top bar without theme toggle/dup "+", tab bar with visible Create, Profile→own profile); copy rules COPY-1 + leak cleanup + label maps + relative dates; motion principles; hide `/kit`; delete dead components (CS §5). | Beats **Threads web** at "feels installed": home-screen icon, no browser chrome, no blank screens. | D-007, D-010, D-011 | — |
| **S01** | **First visit & join** | `/landing`, `/signin` gate + auth modal skin, `/waitlist`, `/setup` as a warm welcome (interests, name, avatar when CR-003 lands). Logged-in landing → feed. | Beats **Threads' signup** at time-to-first-feed and at telling a visitor *why* to stay (real creators, real posts). | S00, **D-009** | CR-003 (avatar step; optional) |
| **S02** | **Feed** | `/feed`: extract `FeedCard` as the one card (title clamp, avatar, relative time, type chip label, overflow menu for Why/Hide/Mute/Report + undo toast), replace the 779-LOC hero with a small "Top this week" rail, sort control, loading/empty/error. Desktop follows 390. | Beats **Reddit mobile web** at scan speed per card and **X** at showing why a post is worth opening. | S00 | CR-003 (avatars; falls back to initials) |
| **S03** | **Discussion — read & comment** | `/discussions/[slug]` (extend reference impl): header with author identity, Verdict block without leaks, thread with visible depth, comment row = 2 actions + overflow, bottom-anchored reply composer, a designed "your comment is live / valued" moment. | Beats **Reddit threads** at following a conversation one-handed, and at structured judgement (the Verdict block). | S00, S02 (card/identity pieces) | CR-003 |
| **S04** | **Composer** | `/new-post` + `/drafts`: rebuild on TipTap — type picker as step-1 sheet, title/body in TipTap, typed fields as blocks (keep backend keys), image, single bottom-reachable Publish, **publish moment** (confirmation + where it will appear). Drafts page folds into the composer. | Beats **Threads composer** at structured posts (reviews/compares) without feeling like a form; beats **X** at the publish moment. | S00, founder composer NOTES | CR-005 (server drafts — can ship on localStorage first) |
| **S05** | **Creator home & recognition** | `/users/[handle]` as the creator's home (identity, body of work, awards shelf, edit entry), Profile tab target (D-010), `/notifications` as the recognition feed (actor, avatar, object, human copy per type, grouped, tappable). | Beats **X profile** at showing a creator's best work first; beats **Threads activity** at making appreciation feel personal. | S00, S02 (card), D-010 | **CR-003, CR-004, CR-008** |
| — | **SHIP LINE (D-005)** | Private beta — 20 real creators | | | |
| S06 | Discover & category | `/discover` becomes real discovery (active types, people, tools); `/category/[slug]` = filtered live feed (`feed.list` `typeFilter`) — **removes the fabricated static page** (move the removal into S02 if beta can't wait). | Beats **Reddit's subreddit list** at showing where the life is. | S02 | — |
| S07 | Search | `/search`: suggestions/recents empty state, grouped results (posts/tools/people), keyboard-first on mobile. | Beats **Threads search** at finding people + tools, not only posts. | S00, S02 | — |
| S08 | Settings | `/settings/profile`: iOS-style grouped sections, one save model, display name + avatar + theme + notification prefs, human labels for consent/erase, rules re-accept as a sheet. | Beats **X settings** at clarity (every row says what it does in plain words). | S00, S05 | CR-003 |
| S09 | Leaderboard | `/leaderboard`: remove fabricated per-category scores; honest real podium or a "rising creators" surface below the floor. | Beats **Product Hunt leaderboards** at feeling earned, not gamed. | S05 | CR-006 |
| S10 | Tools & reviews | `/tools`, `/tools/[slug]`, rating form (label maps, Verdict consistency). | Beats **G2 / Product Hunt tool pages** at trust (real reviewers, visible evidence). | S03 | — |
| S11 | Resources | `/resources`, `/resources/[slug]/view` (landing's primary CTA target). | Beats **Gumroad discover** at free-resource findability. | S00 | — |
| S12 | Affiliate suite | `/s/[handle]`, `/s/[handle]/[product]`, `/go/[linkId]`, `/sell`, `/sell/apply` (MVP-1 affiliate: "everything Carrd charges for, free"). | Beats **Carrd + Linktree** at a free, trustworthy creator storefront. | S00, S05 | TBD after NOTES |
| S13 | Content & static pages | `/about`, `/help`, policy pages, legal prose template, `/contribute`, `/personas*`, `/appeal`, `/legal/intake`. | Beats **Substack's policy pages** at readability. | S00 | — |
| S14 | Admin restyle | `apps/admin` on the shared tokens + state kit; no new flows. | Beats nothing — "boring, fast, consistent". | S00 + all member specs done (D-004) | — |

## Journey check (why this order)
first visit (S01) → sign-up (S01) → feed (S02) → read (S03) → comment (S03) → post (S04) → profile + notifications (S05) → discover/search (S06–S07) → settings (S08) → recognition leaderboards (S09) → ecosystem surfaces (S10–S12).

## Rules for every spec in this index
- Answers the 6 VISION §6 questions and states its benchmark (template: `templates/SPEC.md`).
- Cites `CURRENT-STATE.md` for "today", never re-derives it from code.
- Any backend need → a CR row here + `crs/` file before the spec is APPROVED.
- Records the future **influence report-card signals** its screen produces (VISION §7 open question) — list them, don't build scoring.
