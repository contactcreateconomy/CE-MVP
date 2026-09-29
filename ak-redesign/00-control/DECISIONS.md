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

## D-004 — Spec quality bar, admin, budget · LOCKED (PM-HANDOFF-S1 §4)
- Every spec states a **benchmark** ("beats X at Y") and answers the **6 questions** in VISION §6 (trust, feel special, purposeful motion, one thumb, benchmark, scope).
- **Admin is deferred** until member-facing screens are done (it only inherits S00's shared tokens meanwhile).
- Cache/budget rules: AGENTS.md and CLAUDE.md stay stable; batch Opus sessions; no model/MCP switching mid-session; graph-first reads (`graphify explain "<Symbol>"`); commit a fresh graph before every cloud session.

## D-005 — Ship line · PROPOSED — needs founder
**Proposal:** when **S00–S05 are DONE** (see SPEC-INDEX), open a **private beta with 20 real creators**. Nothing after S05 blocks the beta; later specs are built with beta feedback.
**Why:** first-time founders die polishing. S00–S05 cover the whole core loop (arrive → join → read → comment → post → be recognised). Everything else is better designed with 20 real users' evidence.
**Needs:** founder yes/no + who the 20 are. Depends on D-009 (the gate must let them in).

## D-006 — Replace AGENTS.md §11 (wiki + CHANGELOG per slice) · PROPOSED — needs founder
**Today:** §11 makes a GitHub-wiki update (4 pages) + CHANGELOG entry part of done for every PRD slice; `wiki-tracker-sync.yml` nags when CHANGELOG isn't touched.
**Problem:** the redesign's tracker is `ak-redesign/00-control/STATUS.md` (in-repo, one writer). The wiki is a second repo needing separate auth that cloud/agent sessions often lack — §11 says "STOP" then, which would block every redesign task.
**Proposal:**
1. For redesign work (`ak-redesign/` specs and their builds), **definition of done = STATUS.md row updated by Opus at VERDICT + one CHANGELOG line per accepted spec** (not per task). No wiki update required.
2. The wiki becomes a **read-only archive** of the PRD build (Phases 1–7); the Founder Review Queue moves to DECISIONS.md ("needs founder" records).
3. Backend work by the dev keeps CHANGELOG-per-change; wiki optional.
4. When approved: Opus edits AGENTS.md §11 and CLAUDE.md "Definition of done" in one commit, and `wiki-tracker-sync.yml` is relaxed to CHANGELOG only.
**Until approved:** §11 is unchanged; redesign sessions note in their handoff when the wiki was not updated.

## D-007 — Style source of truth · PROPOSED — needs founder
- **`docs/04-design-system/STYLE-KIT.md` is the canonical token/style source**, and in S00 its tokens become a **single shared stylesheet** consumed by both `apps/forum` and `apps/admin` (today two 1,073-line copies differing by one line).
- **VISION wins on aesthetic direction where they conflict.** First application: the "Electric glow" system is demoted to **focus ring + progress track only**; all other glow uses are removed (per-token table in CURRENT-STATE §7). S00 edits STYLE-KIT to say so.
- New tokens the redesign needs (sheet, safe-area, theme-color, state kit) are added **by S00, in STYLE-KIT**, never minted in a component.
- The original design system v2 (`CREATECONOMY_DESIGN_SYSTEM.md`) is **historical, not a source**. "RECONCILIATION-NOTE" does not exist in this repo; STYLE-KIT's §2 header is the record.

## D-008 — Product name users see · DECIDED by founder (2026-09-28)
- Users see **Createconomy** — the domain — in all UI and marketing.
- **CEY** is the internal short name only (like "FB" for Facebook): docs, code comments, team talk. Never shown as the product name in UI. (Current UI complies — no "CEY" string found.)

## D-009 — The "sign-ups closed" state · PROPOSED — needs founder
**Fact:** `convex/admission.ts` `effectiveSignupMode` is fail-closed — with no `launchReadinessResults` row marked `ready`, sign-up mode is `"closed"` whatever `signup.mode` says. The PRD gates `signup.mode=open` on lawyer review + Readiness Cat-8. So "closed" is a **readiness default**, visible today as the first message on `/signin` and every auth-gated page, next to a landing page that says "PUBLIC BETA".
**Founder must choose:**
- **A. Invite-only beta (recommended with D-005):** mode `waitlist`; logged-out visitors see "Createconomy is in private beta — join the waitlist" with an email field; invited creators get in. Copy and placement designed in S01.
- **B. Open:** complete the readiness predicates (admin `/admin/readiness`) and set `signup.mode=open`. Needs the legal pre-launch gates first.
- **C. Keep closed:** then remove "PUBLIC BETA" from landing and design an honest "coming soon" front door.
Either way the notice must not be the first thing on every gated page — gated pages show *what's behind the door* and one clear action.

## D-010 — Profile tab goes to the creator's own profile · PROPOSED — needs founder
**Today:** tab "Profile" → `/profile` → 307 → `/settings/profile` (a form). 00-ROUTES made that redirect canonical.
**Proposal:** tab "Profile" → `/users/[own handle]` (the public profile, with "Edit profile" and a settings entry); `/profile` redirects there; `/settings` keeps redirecting to `/settings/profile`. No route is added or renamed — only `/profile`'s redirect target changes — but it amends 00-ROUTES, so it needs a record.
**Why:** VISION "feel special" — the creator's home should be their body of work, not a settings form.

## D-011 — Copy rule COPY-1 · PROPOSED (Opus; confirm in S00 approval)
No user-visible string contains a capability/decision/phase/wave/module ID, a version tag (`v1`, `rules.v1`), a table/field/enum name, an infra/vendor name (Convex, OAuth), or an explanation of what isn't built. Enum and field values render only through label maps. Unbuilt things are hidden, never described. Enforced by a source-scan test in `apps/forum`. Legal/founder-owned copy keeps its words but not IDs. (Audit: CURRENT-STATE §6.)
