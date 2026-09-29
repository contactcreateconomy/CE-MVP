---
id: STATUS
type: CONTROL
author-model: Opus
tool: Claude Code (cloud)
round: 2
status: LIVE (Opus-only writer)
date: 2026-09-29
---

# STATUS — where the redesign stands

## Now
- Ground truth done and founder decisions recorded (D-005..D-014, 2026-09-29) on `013-opus-ground-truth` (PR #13 → `011-Akilesh-Redesign`, unmerged).
- **S00 Foundation:** NOTES final; **SPEC DRAFT** (`specs/S00-SPEC.md`, 18 tasks) → PM review → founder approval (answer §13 Q1–Q4).
- Product code changed by the redesign so far: none. (Repo-process files changed for D-006: AGENTS.md §11, CLAUDE.md, `wiki-tracker-sync.yml`.)

## Next 2 specs (stay-2-ahead)
1. **S00 — Foundation** → PM review → founder approval → build (tasks S00-T01…).
2. **S01 — First visit & join** → needs an **EXPLORE** session first (D-014; `lab/s01` branch, founder live) → S01-NOTES → SPEC.

## Beta line (D-005)
S00–S13 DONE + security gate (SEC) PASS → users. S14 admin during beta. Scope frozen.

## Waiting on the founder
| Item | Blocks |
|---|---|
| Approve S00-SPEC (after PM review) | S00 build |
| S01 EXPLORE session (book time; app running, phone on LAN) | S01 |

## Waiting on the dev (CRs)
| CR | Status | Blocks |
|---|---|---|
| CR-001 demoSeed guard | OPEN | SEC gate |
| CR-002 cron `.withIndex` | OPEN | report-card signals |
| CR-003 avatars | OPEN | S01 (optional), S02–S05, S08 |
| CR-004 notification context | OPEN | S05 |
| CR-005 server drafts | OPEN | S04 (can start on localStorage) |
| CR-006 podium | OPEN | S09 |
| CR-007 follows/streaks | **REJECTED** for MVP 1 | — |
| CR-008 profile body of work | OPEN | S05 |
| CR-009 local seed: readiness ready + open sign-up | OPEN | S01 baselines, S00 baseline recapture |

## Spec board
| Spec | Status |
|---|---|
| S00 Foundation | SPEC DRAFT — awaiting PM review |
| S01–S13 | not started (each needs EXPLORE) |
| SEC security gate | not started |
| — **beta line** — | |
| S14 Admin restyle | during beta |
