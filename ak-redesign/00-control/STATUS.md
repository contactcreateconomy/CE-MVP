---
id: STATUS
type: CONTROL
author-model: Opus
tool: Claude Code (cloud)
round: 1
status: LIVE (Opus-only writer)
date: 2026-09-29
---

# STATUS — where the redesign stands

## Now
- **Phase:** ground truth done (branch `013-opus-ground-truth`, PR → `011-Akilesh-Redesign`). **No spec written yet.**
- **Ground truth:** `CURRENT-STATE.md` · plan: `SPEC-INDEX.md` · decisions: `DECISIONS.md` · CRs: `crs/`.
- **Product code changed by the redesign so far:** none.

## Next 2 specs (stay-2-ahead)
1. **S00 — Foundation** (tokens single-source, state kit, app-feel, sheet primitive, copy rules + leak cleanup, motion principles, shell/tab bar). Needs: founder **S00-NOTES** (vision covers most of it) + answers to D-007, D-010, D-011.
2. **S01 — First visit & join** (landing, sign-in gate, setup). Needs: founder **S01-NOTES** + **D-009** answer.

Note: PM-HANDOFF §6 planned "S01 Composer". SPEC-INDEX puts the composer at **S04** (journey order) — the front door must be fixed before beta; if the founder prefers the composer second, swap S01↔S04 (no dependency blocks it besides S00).

## Waiting on the founder
| Item | Blocks |
|---|---|
| D-005 ship line (S00–S05 → 20-creator private beta) | planning horizon |
| D-006 replace AGENTS.md §11 | definition of done for redesign tasks |
| D-007 STYLE-KIT canonical + glow demotion | S00 |
| D-009 sign-ups closed: A / B / C | S01 |
| D-010 Profile tab → own profile | S00 shell, S05 |
| CR-007 follows/streaks: MVP 1 or not | nothing in the ship line |
| S00-NOTES, S01-NOTES | S00, S01 |

## Waiting on the dev (CRs, all OPEN)
CR-001 demoSeed guard · CR-002 cron `.withIndex` · CR-003 avatars · CR-004 notification context · CR-005 server drafts · CR-006 podium · CR-007 follows/streaks (scope) · CR-008 profile body of work.
Ship-line critical: **CR-003, CR-004, CR-008** (S03/S05 need them).

## Spec board
| Spec | Status |
|---|---|
| S00 Foundation | not started (needs NOTES) |
| S01 First visit & join | not started |
| S02 Feed | not started |
| S03 Discussion (read + comment) | not started |
| S04 Composer | not started |
| S05 Profile & notifications | not started |
| — **ship line (D-005)** — | |
| S06+ | see SPEC-INDEX |
