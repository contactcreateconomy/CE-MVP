---
id: SPEC-INDEX
type: CONTROL
author-model: Opus
tool: Claude Code (cloud)
round: 2
status: LIVE (founder decisions 2026-09-29 applied)
date: 2026-09-29
---

# SPEC-INDEX — every redesign spec, in build order

S00 first, then the member journey. **Build order (D-017, 2026-10-03): S02 Feed+Search → S04 Composer → S03 Post+Threads → S05 Profile → S12 Affiliate; S01 later.** UI is built per D-016 (Opus display components → GLM wiring → Grok review → founder live tweak). Each row: scope (one line), benchmark ("beats X at Y"), depends on, CRs it waits on.
Evidence for every row: `CURRENT-STATE.md`. **Scope is frozen (D-005):** a spec is added only by dropping another.

**Loop per spec:** S00 = NOTES → SPEC (foundation, no EXPLORE). **S01–S13 = EXPLORE (founder live on `lab/<spec>`) → NOTES → SPEC → BUILD → REVIEW → VERDICT → GATE** (D-014).
**Every GATE (D-005, D-013):** side-by-side at 390 vs the benchmark app · dark **and** light at 390 · no fabricated data (D-012) · COPY-1 (D-011).

| ID | Spec | Scope (one line) | Benchmark | Depends on | Waits on CR |
|---|---|---|---|---|---|
| **S00** | **Foundation** | Single token source (forum+admin) with glow/glass guardrails as tokens+utilities, both themes; state kit on all 16 core routes; app-feel (manifest, icons, viewport, theme-color, safe areas, standalone); sheet primitive; shell (top bar, tab bar, Profile → own profile); COPY-1 + leak cleanup + label maps + relative dates + source-scan test; **no fabricated data** (`/category/[slug]` → live filtered feed, leaderboard invented scores removed); motion principles; performance budget; hide `/kit`; dev-only `/lab`; delete dead components. | Beats **Threads web** at feeling installed (icon, no browser chrome, no blank screens) and **X web** at first-load speed on a mid-range phone. | D-007, D-010, D-011, D-012, D-013 (all decided) | — (CR-009 helps baselines) |
| **S01** | **First visit & join** | `/landing`, `/signin` + auth modal skin, `/setup` as a warm welcome. **Open, frictionless front door** (D-009) positioned as an **AI-influenced discussion platform — AI personas visible as the hook** (labelled, per AI disclosure). Logged-in landing → feed. | Beats **Threads' signup** at time-to-first-feed and at showing *why* to stay (live discussions with visible AI personas). | S00 | CR-009 (baselines); CR-003 (avatar step, optional) |
| **S02** | **Feed** | `/feed`: `FeedCard` as the one card (clamp, avatar, relative time, label map, overflow for Why/Hide/Mute/Report + undo toast); desktop keeps the hero carousel, mobile starts with the feed (D-017); prototype port as display components (`specs/S02-SPEC.md`); sort control; states. Desktop follows 390. | Beats **Reddit mobile web** at scan speed per card and **X** at showing why a post is worth opening. | S00 | CR-003 (initials fallback), CR-010 (card/chrome payloads), CR-006 (podium windows) |
| **S03** | **Discussion — read & comment** | `/discussions/[slug]` (extend reference impl): author identity, Verdict block without leaks, visible thread depth, comment row = 2 actions + overflow, bottom-anchored reply, the "your comment is live / valued" moment; AI persona comments clearly labelled. | Beats **Reddit threads** at following a conversation one-handed and at structured judgement (Verdict block). | S00, S02 | CR-003 |
| **S04** | **Composer** | `/new-post` + `/drafts` on TipTap: type picker sheet, typed fields as blocks (backend keys kept), one bottom-reachable Publish, the **publish moment** (celebration glow allowed — D-007). | Beats **Threads composer** at structured posts without a form feel; beats **X** at the publish moment. | S00 | CR-005 (can start on localStorage) |
| **S05** | **Creator home & recognition** | `/users/[handle]` as home (identity, body of work, awards, edit entry); `/notifications` as the recognition feed (actor, avatar, object, human copy, grouping, tappable). | Beats **X profile** at best-work-first; beats **Threads activity** at personal appreciation. | S00, S02 | **CR-003, CR-004, CR-008** |
| S06 | Discover & category | `/discover` as real discovery (active types, people, tools, AI personas); `/category/[slug]` upgraded from S00's plain filtered feed to a designed category home. | Beats **Reddit's community list** at showing where the life is. | S00 (live category), S02 | — |
| S07 | Search | Suggestions/recents empty state; grouped results (posts / tools / people). | Beats **Threads search** at finding people + tools. | S00, S02 | — |
| S08 | Settings | iOS-style grouped sections, one save model, display name + avatar + theme + notification prefs, human consent/erase labels, rules re-accept as a sheet. | Beats **X settings** at plain-words clarity. | S00, S05 | CR-003 |
| S09 | Leaderboard | Real podium (S00 already removed invented scores) or an honest "rising creators" surface below the floor. | Beats **Product Hunt leaderboards** at feeling earned. | S00, S05 | CR-006 |
| S10 | Tools & reviews | `/tools`, `/tools/[slug]`, rating form (label maps, Verdict consistency). | Beats **G2 / Product Hunt tool pages** at trust. | S03 | — |
| S11 | Resources | `/resources`, `/resources/[slug]/view` (landing's primary CTA target). | Beats **Gumroad discover** at free-resource findability. | S00 | — |
| S12 | Affiliate suite | `/s/[handle]`, `/s/[handle]/[product]`, `/go/[linkId]`, `/sell`, `/sell/apply`. | Beats **Carrd + Linktree** at a free, trustworthy creator storefront. | S00, S05 | TBD after NOTES |
| S13 | Content & static pages | `/about`, `/help`, policy pages, legal prose template, `/contribute`, `/personas*`, `/appeal`, `/legal/intake`. | Beats **Substack's policy pages** at readability. | S00 | — |
| **SEC** | **Security gate** (Astra) | Auth + session handling, admission (open sign-up abuse: rate limits, bot/spam), rate limits on every public mutation, secrets (none in client bundle/repo), seed guards (CR-001, CR-009 never on prod), CSP + security headers. PASS required. | — | S00–S13 DONE | CR-001 |
| — | **BETA LINE (D-005)** | S00–S13 DONE + SEC PASS → users | | | |
| S14 | Admin restyle | `apps/admin` on shared tokens + state kit; no new flows. Built **during beta**. | "Boring, fast, consistent." | S00 | — |

Rejected for MVP 1: follows / streaks (CR-007, 2026-09-29).

## Journey check (why this order)
first visit (S01) → sign-up (S01) → feed (S02) → read (S03) → comment (S03) → post (S04) → profile + notifications (S05) → discover/search (S06–S07) → settings (S08) → leaderboard (S09) → ecosystem surfaces (S10–S13) → security gate → beta.
Founder priority "premium from day one" = S02 feed, S03 discussion, S04 publishing — they get the deepest EXPLORE sessions.

## Rules for every spec in this index
- Answers the 6 VISION §6 questions and states its benchmark (template: `templates/SPEC.md`).
- Cites `CURRENT-STATE.md` for "today", never re-derives it from code.
- Any backend need → a CR row here + `crs/` file before the spec is APPROVED.
- Records the future **influence report-card signals** its screen produces (list only, no scoring).
