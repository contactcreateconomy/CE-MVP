---
id: STATUS
type: CONTROL
author-model: Opus
tool: Claude Code (cloud)
round: 2
status: LIVE (Opus-only writer)
date: 2026-09-30
---

# STATUS — where the redesign stands

## Now
- Ground truth + founder decisions merged into `011-Akilesh-Redesign` (PR #13).
- **S00 Foundation:** building. **T01–T03 DONE — checkpoint 1 ACCEPTED** (`specs/S00-CP1-VERDICT.md`, 2026-09-30): single token source, new tokens + STYLE-KIT, glow/glass/safe-area utilities, dev-only `/lab`. Opus fixed the T01 token guard (it missed most namespaces). **Next: S00-T04** (no fabricated data). Next VERDICT after T12.
- **New rule from CP1:** every acceptance check must show a RED run on a broken version (templates BUILD/REVIEW/SPEC).
- **Verdict cadence (D-003 amendment):** Grok reviews every full-lane task; Opus VERDICT batched after T03, T12, T18.

## Next 2 specs (stay-2-ahead)
1. **S00 — Foundation** → T04…T18 (VERDICT checkpoints: T03 ✓ / T12 / T18).
2. **S01 — First visit & join** → needs an **EXPLORE** session first (D-014; `lab/s01` branch, founder live) → S01-NOTES → SPEC.

## Beta line (D-005)
S00–S13 DONE + security gate (SEC) PASS → users. S14 admin during beta. Scope frozen.

## Waiting on the founder
| Item | Blocks |
|---|---|
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
| S00 Foundation | BUILDING — T01–T03 ACCEPTED (CP1); T04 next |
| S01–S13 | not started (each needs EXPLORE) |
| SEC security gate | not started |
| — **beta line** — | |
| S14 Admin restyle | during beta |
