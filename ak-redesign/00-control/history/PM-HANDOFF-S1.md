---
id: PM-HANDOFF
type: HANDOFF
author: Claude (PM / mentor), session 1
date: 2026-09-28
status: ACTIVE
---

# CEY Redesign — PM Handoff (session 1 → session 2)

**Read with:** `CEY-VISION.md` (product vision, founder-owned). Project files also hold the design system v2 and the logo.

## 1. Who I am in this project
- **Role:** PM + mentor to a first-time solo founder (Akilesh). The founder owns taste and vision; building and process are my scope.
- **Style the founder asked for:** direct, no yes-man. State facts, push back, keep him on rails. Token-efficient: do only what serves the goal.
- **Rule:** if GLM can do it, GLM does it (unlimited). The founder only does what needs a human (UI clicks, interactive logins, taste decisions).

## 2. The situation in one paragraph
CEY (Createconomy) MVP 1 was built from a very rigorous rules-only PRD (572 capabilities, 54 screens), verified "fully coded" by audits. The result works, but it isn't the experience the founder intended: the PRD had no experience layer, and it even fenced off components. We are now doing a **UI/UX redesign of everything user-facing**. That covers polish plus the functionality that supports it, and **no new features**. Admin is rewired after that. Audience: mobile-first creators coming from Reddit/X/Threads. The one feeling: **trust**. Standard: Apple-level detail, iOS philosophy, purposeful motion, one-thumb mobile, "make everyone feel special."

## 3. Toolchain (final)
| Tool | Model | Role | Cost |
|---|---|---|---|
| Claude Code (VS Code ext in Cursor) | Opus 5.5 via aggregator | Architect: specs, triage, fixes <20 lines | $40/5h, $264/wk cap, shared with Astra |
| Claude Code **cloud session** | Opus | One-time heavy reads (ground truth, S00 spec) | $100 credit, expires Nov 5 |
| zcode | GLM 5.3 (Max) | Builder + all mechanical/setup work | Unlimited |
| Cursor chat | Grok 4.7 | Code reviewer | Cursor Pro |
| Codex | Astra (GPT-6) | Milestone GATE: deep review + browser QA | Shares Opus cap; use rarely |
| Claude Pro (this chat) | — | PM, specs review, vision | — |
| Graphify 0.9.69 | — | Code+docs knowledge graph; hooks refresh on commit; MCP in zcode | Free (docs pass via GLM) |
| Hindsight | — | **Deferred.** Git markdown is the memory layer for now | — |

Also available: a "Reset for free" on the weekly Opus cap (expires Oct 22). Save it for a build weekend.

## 4. Locked decisions
- **Folder:** `ak-redesign/` (00-control, 01-vision, specs, templates).
- **Precedence:** ak-redesign wins on UI/UX. `docs/` PRD = reference, authoritative for backend contracts unless a DECISION overrides. Conflicts → DECISIONS "needs founder".
- **Backend change = change request** with founder approval before any spec.
- **Naming:** S00–S99 specs (S00 = foundation), tasks S01-T01, rounds -R2. Files `{ID}-{TYPE}.md`. Types: NOTES (founder), SPEC (Opus), BUILD (GLM), REVIEW (Grok), VERDICT (Opus), GATE (Astra). Header block on every file. Single writer per file; STATUS/DECISIONS are Opus-only. Commit `[S01-T01][BUILD][GLM] msg`, branch `s01-t01-name`. No model names in code.
- **Loop:** founder NOTES → Opus SPEC → founder approves (after my review) → GLM builds → Grok reviews → Opus verdict (fix itself if small, return if large, max 2 loops then escalate) → Astra GATE per screen → founder inspects.
- **Two lanes:** full lane (visual, new components, data); fast lane (copy/spacing/one-file, skips Grok).
- **Stay 2 specs ahead** of the build, not all 54. **No NOTES → no spec.**
- **Admin deferred** until member-facing screens are done.
- **Every spec states a benchmark** ("beats X at Y") and answers the 6 questions in CEY-VISION §6.
- **Cache rules:** stable AGENTS.md/CLAUDE.md, batch Opus sessions, no model/MCP switching mid-session, graph-first reads. Commit a fresh graph before every cloud session.

## 5. Proposed, needs the founder
- **D-005 Ship line:** S00–S05 done → private beta with 20 real users. (I pushed this hard. First-time founders die polishing.)
- **D-006:** replacement for the AGENTS.md §11 wiki/CHANGELOG-per-slice rule.
- **Brand name users see:** "CEY" or "Createconomy"? Decide in S00.
- **Likely change requests:** server drafts (CAP-531, drafts are localStorage today); podium rethink (currently client-side interim, 25-contributor threshold).

## 6. Status (as of handoff)
**Done**
- Graphify: 4,726 nodes / 10,641 edges / 321 communities, code + PRD docs. Hooks + merge driver active. Claude (strict), Cursor and Codex wired. Cache deny rules set. Graph files committed.
- `ak-redesign/` skeleton + CONVENTIONS.md, SETUP-REPORT (R1, R2), RAW-INVENTORY.md.
- `.kilo/` removed, graphify-out noise ignored. `convex/lib/events.ts:21` = parser limitation, not a bug. Typecheck green.
- Branch `011-Akilesh-Redesign` = redesign base (at 612cc3c, pushed).
- Vision captured → `CEY-VISION.md` (add to repo as `ak-redesign/01-vision/VISION.md`).

**In progress**
- The dev team delivered **local Convex** on branch `012-local-convex` (test account devtest@example.com, local only).
- **Founder action:** run `pnpm backend` interactively (Y, then "start fresh"), keep it open.
- **GLM round 3 prompt issued:** env + auth keys + seeds + demo seed + test account + real baselines (390 & 1440, logged in) + contact sheets + full gate + merge 012 → 011 + SETUP-REPORT-R3.
- **zcode MCP:** import `C:\Users\akile\graphify-mcp-import.json`. GLM proved the server works over stdio, but the import may not be done yet.

**Next, in order**
1. Founder sends **CONTACT-390.png, CONTACT-1440.png, SETUP-REPORT-R3.md** → I review how the product really looks.
2. **Opus cloud session: GROUND TRUTH** (prompt written in session 1; key parts below).
3. I review **PM-BRIEF, SPEC-INDEX, CURRENT-STATE** → founder approves the PR.
4. Founder writes **S00 NOTES** (mostly covered by the vision) and **S01 Composer NOTES** (ideas still pending, the main founder input).
5. Opus writes S00 + S01 specs → my review → approval → build loop begins.

## 7. Ground-truth Opus prompt (summary; re-issue in full when running)
- **Step 0:** install graphify in the cloud VM (the hooks need it; STOP if impossible). Branch `setup/ground-truth` from 011.
- **Step 1:** minimal rewrites of 7 agent files (AGENTS.md, CLAUDE.md, docs/AGENT-START-HERE.md, docs/AGENT-MEMORY.md [append-only], PROJECT-STATUS.md, README.md, apps/forum/README.md) + notes on 00-ROUTES / 00-TRANSITION. Add the precedence block, keep all backend/security guardrails, keep the graphify sections. Do NOT change §11; propose in DECISIONS.
- **Step 2:** CURRENT-STATE.md. Primary source = RAW-INVENTORY + baselines (judgment, not re-derivation). Shared foundation; 16 core routes deep; others shallow; admin one row each; top 10 gaps. Rule on: 18 zero-import components (post-card, thread-header, thread-sidebar, states/*), duplicate empty-state components, forum/admin token duplication (394 vars copied), the 774-LOC composer, the 779-LOC hero carousel. Backend items → proposed CRs.
- **Step 3:** STATUS, DECISIONS (D-001..D-006), SPEC-INDEX (S00 foundation first, journey order, ship line marked), 6 templates, ak-redesign/README.md, PM-BRIEF.md.
- **Step 4:** commits `[SETUP][GROUND-TRUTH][OPUS]`, PR into 011, don't merge.

## 8. Key facts from the inventory (for judging specs)
- Stack: Next 16.3.3, React 19.2.4, Tailwind v4 (CSS-first), 6 Radix primitives, motion 12, lucide, TipTap 3, zustand, Convex. **No rewrite needed.**
- Tokens: 394 vars in forum globals.css, duplicated in admin → make a single shared source in S00.
- Mobile/app-feel: **no manifest, SW, viewport export, icons, theme-color.** Tab bar + 2 safe-area uses exist. No sheet/drawer lib. → S00.
- States: 8/16 core routes have no error state; 3 render blank while loading; Skeleton exists but only /notifications uses it → state kit in S00.
- Composer: `new-post-composer.tsx` 774 LOC + typed-fields-panel 375; TipTap present → rebuild the experience on TipTap.
- The founder's "first idea" feed screenshot: a desktop 3-column dashboard with glow CTAs and "Createconomy" branding. My notes: design from 390px up; glow is close to the "RGB light" the founder hates; no feel-special moments yet.

## 9. Mentor watch-list
- **Scope:** "polish" vs "pivot". Anything needing backend = a visible CR, never silent.
- **Perfection trap:** hold the ship line.
- **Taste transfer:** push the founder for reference apps + benchmarks in every NOTES file.
- **Budget:** Opus reads reports, not code; GLM gathers facts; Astra only at gates.
- **Big-picture insight to protect:** the community is the evidence engine for the future **influence report card**. Specs should record the signals it will need.
