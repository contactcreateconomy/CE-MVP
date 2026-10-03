---
id: DECISIONS
type: CONTROL
author-model: Opus
tool: Claude Code (cloud)
round: 1
status: LIVE (Opus-only writer)
date: 2026-09-29
---

# DECISIONS — the redesign's decision log

Opus is the only writer. Status per record: **LOCKED** (founder-approved) · **DECIDED** (founder said so) ·
**PROPOSED — needs founder** · **SUPERSEDED**. A proposed record binds nobody until the founder answers;
the answer is recorded here with a date. Newest records at the bottom; never renumber.

---

## D-001 — Folder, precedence, change requests · LOCKED (PM-HANDOFF-S1 §4, 2026-09-28)
- All redesign work lives in `ak-redesign/` (`00-control/`, `01-vision/`, `specs/`, `templates/`).
- **`ak-redesign/` wins on UI/UX.** `docs/` (the PRD) is reference and stays **authoritative for backend contracts** unless a DECISION here overrides it. Conflicts → a record here marked "needs founder". (Mirrored as AGENTS.md §0.)
- **A backend change is a change request** (`00-control/crs/CR-NNN-REQUEST.md`, flow in `TEAM-WORKFLOW.md`) approved by the founder **before** any spec depends on it.
- **Scope:** MVP 1 only — polish plus the functionality that supports the experience; **no new features** (VISION §4).

## D-002 — Naming, files, ownership · LOCKED (PM-HANDOFF-S1 §4)
- Specs `S00`–`S99` (S00 = foundation). Tasks `S01-T01`. Rounds `-R2`, `-R3`. Files `{ID}-{TYPE}.md`.
- Types and single writers: NOTES (founder) · SPEC (Opus) · BUILD (GLM) · REVIEW (Grok) · VERDICT (Opus) · GATE (Astra).
- Header block on every file: id / type / author-model / tool / round / status / date. Only the owner edits a file; others answer in their own file. STATUS.md and DECISIONS.md are Opus-only.
- Branch `s01-t01-short-name`; commit `[S01-T01][BUILD][GLM] msg`. **No model names in code or code comments.**
- Status flow: DRAFT → APPROVED → BUILDING → IN-REVIEW → RETURNED | ACCEPTED → DONE. (Details: `CONVENTIONS.md`.)

## D-003 — The build loop · LOCKED (PM-HANDOFF-S1 §4)
- Founder NOTES → Opus SPEC → PM review → founder approves → GLM builds → Grok reviews → Opus VERDICT (fix itself if < ~20 lines, return if large; max 2 loops, then escalate) → Astra GATE per screen → founder inspects.
- Two lanes: **full** (visual, new components, data) and **fast** (copy/spacing/one file; skips Grok).
- **Stay 2 specs ahead** of the build. **No NOTES → no spec.**
- **Amended by D-014 (2026-09-29):** visual specs (S01–S13) add an EXPLORE stage before the SPEC.
- **Amendment 2026-09-29 (PM, budget):** **Grok REVIEWs every full-lane task.** **Opus VERDICT is batched at checkpoints** named in each spec's task table (S00: after T03, T12, T18) instead of per task; the batched VERDICT covers every task since the last checkpoint. Tasks between checkpoints proceed on a Grok PASS. A Grok CHANGES-REQUESTED still blocks the next task. Fast-lane tasks are unchanged (skip Grok).

## D-004 — Spec quality bar, admin, budget · LOCKED (PM-HANDOFF-S1 §4)
- Every spec states a **benchmark** ("beats X at Y") and answers the **6 questions** in VISION §6 (trust, feel special, purposeful motion, one thumb, benchmark, scope).
- **Admin is deferred** until member-facing screens are done (it only inherits S00's shared tokens meanwhile).
- Cache/budget rules: AGENTS.md and CLAUDE.md stay stable; batch Opus sessions; no model/MCP switching mid-session; graph-first reads (`graphify explain "<Symbol>"`); commit a fresh graph before every cloud session.

## D-005 — Beta line · DECIDED by founder (revised, 2026-09-29)
- **No beta before the experience is complete.** Beta line = **S00–S13 (every member-facing spec) DONE + the security gate passed.** No prototype ever goes to users.
- **S14 admin restyle** is built during beta.
- **Scope is frozen:** SPEC-INDEX may gain a spec only by dropping another of similar size (founder call, recorded here).
- Beta evidence is replaced by a **mandatory gate item in every spec: a side-by-side at 390 against the spec's benchmark app** (GATE template).
- "Ship line" is renamed **"beta line"** everywhere.
- Supersedes the 2026-09-29 proposal "S00–S05 → private beta with 20 creators".

## D-006 — Replace AGENTS.md §11 (wiki + CHANGELOG per slice) · LOCKED (2026-09-29)
- Redesign work: done = STATUS.md row updated by Opus at VERDICT/GATE + **one CHANGELOG line per accepted spec**. Backend work: CHANGELOG per change. Founder-facing items → DECISIONS "needs founder".
- The GitHub wiki is a **read-only archive** of the PRD build.
- **Executed 2026-09-29:** AGENTS.md §11 rewritten, CLAUDE.md "Definition of done" updated, `.github/workflows/wiki-tracker-sync.yml` reduced to the CHANGELOG reminder only (wiki-append job removed).

## D-007 — Style source and the glow/glass rule · DECIDED by founder (revised, 2026-09-29)
- **`docs/04-design-system/STYLE-KIT.md` is the canonical token/style source**; S00 turns it into **one shared stylesheet** for `apps/forum` and `apps/admin`. New tokens are added in STYLE-KIT by a spec, never minted in a component. The original DS v2 is historical, not a source.
- **Glow AND glass stay.** Founder's rule: **"a blink with a reason."** Guardrails (PM, binding):
  1. **Glow** only on brand and interactive moments: primary CTA, Create, focus, active states, celebrations.
  2. **Pulse** only for live states (something is happening *now*).
  3. **Glass** subtle (Threads-level) on **chrome only**: top bar, tab bar, sheets, modals. Heavy frosted only by explicit spec exception. **Max 2 stacked glass layers.** **Solid fallback** when `backdrop-filter` is unsupported or `prefers-reduced-transparency: reduce`.
  4. **`prefers-reduced-motion` removes all glow motion** (static glow may remain; pulses/animations stop).
  5. Guardrails ship as **tokens + utilities** (S00), not ad-hoc CSS.
- Per-token ruling: CURRENT-STATE §7 (rewritten to "keep with guardrail / remove").

## D-008 — Product name users see · DECIDED by founder (2026-09-28)
- Users see **Createconomy** — the domain — in all UI and marketing.
- **CEY** is the internal short name only (docs, code comments, team talk). Never shown as the product name in UI. (Current UI complies.)

## D-009 — Sign-up: open, no gates at launch · DECIDED by founder: option B (2026-09-29)
- Sign-up is **open**. The **"closed" state is never the front door** — it may exist as an ops fallback, never as the first thing a visitor sees.
- Legal review and readiness predicates (`launchReadinessResults`, Readiness Cat-8) are a **launch checklist**, not UI.
- **CR-009:** the local seed marks readiness `ready` (and `signup.mode=open`) so dev machines and baselines show the open flow.
- S01 = an open, frictionless front door positioned as an **AI-influenced discussion platform, with AI personas visible as the hook**.

## D-010 — Profile tab goes to the creator's own profile · LOCKED (2026-09-29)
Tab "Profile" → `/users/[own handle]` (public profile with "Edit profile" + settings entry); `/profile` redirects there; `/settings` keeps redirecting to `/settings/profile`. Amends 00-ROUTES (only `/profile`'s redirect target changes). Built in S00 (shell).

## D-011 — Copy rule COPY-1 · LOCKED (2026-09-29)
No user-visible string contains a capability/decision/phase/wave/module ID, a version tag (`v1`, `rules.v1`), a table/field/enum name, an infra/vendor name (Convex, OAuth), or an explanation of what isn't built. Enum and field values render only through label maps. Unbuilt things are hidden, never described. Enforced by a source-scan test in `apps/forum` (S00). Legal/founder-owned copy keeps its words but not IDs.

## D-012 — No fabricated data on any user-visible surface · LOCKED (2026-09-29)
- Every number, name, badge, rank and post a user sees comes from real data. No static seeds, no client-invented scores, no placeholder people. If the data doesn't exist, the surface shows an honest designed state (never a spec note — D-011).
- Moved into **S00**: `/category/[slug]` becomes a filtered live feed (`feed.list` `typeFilter`); the leaderboard's invented per-category scores are removed. S06 and S09 build on that.

## D-013 — Both themes ship · LOCKED (2026-09-29)
Dark (default) and light both ship, polished. Every spec's acceptance and gate checks **both themes at 390**. Tokens are defined for both; no component may be dark-only.

## D-014 — The taste loop for visual specs · LOCKED (2026-09-29; amends D-003)
The founder decides taste live in the browser, screen by screen. For **visual specs (S01–S13)**:
1. **EXPLORE:** founder live session on a `lab/<spec>` branch, app running (phone over LAN + desktop at 390), GLM iterating blocks with hot reload; optional A/B/C variants on a dev-only `/lab` route; optional Mobbin / Claude Design references. GLM writes `<ID>-NOTES.md` from the session; the founder approves it. Explore code is throwaway unless the spec says "reuse".
2. **LOCK:** Opus writes the SPEC from the NOTES + the explored result.
3. **BUILD → REVIEW → VERDICT → GATE** as in D-003.
**S00 is foundation** (mostly architecture): it skips EXPLORE and goes NOTES → SPEC. The `/lab` route must be dev-only (never reachable in production builds) — S00 provides it.

## D-015 — S00 approved; founder answers to S00-SPEC §13 · DECIDED by founder (2026-09-29)
- **S00-SPEC APPROVED.**
- **Q1** Search tab → `/search`; Discover reachable from it. **Yes.**
- **Q2** Theme switch at 390 lives in the avatar menu (sheet); full appearance settings in S08. **Yes.**
- **Q3** No service worker before beta; offline handled by the state kit. **Yes.**
- **Q4** Generated logomark app icon until a designed icon is supplied. **Yes.**

## D-016 — Taste-critical UI is built by Opus as display components · DECIDED by founder (2026-10-03; amends D-014 for S02 onward)
- Opus builds taste-critical UI as **display components** (props in, UI out, no data fetching), faithful to founder-approved references, on S00 tokens/utilities, with a dev-only `/lab/<screen>` from fixtures.
- **GLM** wires data, states and tests; **Grok** reviews both; the **founder tweaks live** after wiring.
- Branch handoff: once Opus reports a UI branch done, the founder owns it; Opus pushes again only when asked (and pulls first).

## D-017 — New spec order; S02 feed rulings · DECIDED by founder (2026-10-03)
- Order: **S02 Feed+Search → S04 Composer → S03 Post+Threads → S05 Profile → S12 Affiliate**. S01 front door later.
- S02's NOTES are the founder's prototype (`specs/S02-refs/prototype/`). Only the feed is ported in S02.
- Hero: **desktop (lg+) keeps the carousel; mobile starts with the feed.** (Supersedes SPEC-INDEX's "small Top this week rail" for S02.)
- Categories/post types: the product's current set is final; the prototype's 9 categories are ignored.
- Prototype numbers are placeholders. Every production number comes from real rows (AI personas create real activity). **D-012 stands.**
