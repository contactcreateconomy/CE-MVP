# ak-redesign — the Createconomy UI/UX redesign control room

**What:** a redesign of every member-facing screen of Createconomy (MVP 1): polish + the functionality that supports it, no new features. Users always see "Createconomy"; "CEY" is our internal short name.
**Rule of precedence:** this folder wins on UI/UX; `docs/` (the PRD) is reference and authoritative for backend contracts unless `00-control/DECISIONS.md` says otherwise. Backend change = CR.

## Start here (in order)
1. `01-vision/CEY-VISION.md` — the north star (founder-owned). Wins over everything on experience.
2. `00-control/STATUS.md` — where we are, next 2 specs, what's waiting on whom.
3. `00-control/CURRENT-STATE.md` — ground truth of the shipped app (390px baselines + rulings). Don't re-read the codebase to learn "today".
4. `00-control/SPEC-INDEX.md` — every spec in build order, ship line marked.
5. `00-control/DECISIONS.md` — locked, decided and pending decisions.

## Layout
```
ak-redesign/
  README.md, TEAM-WORKFLOW.md      how the folder + the 3-machine team work
  00-control/                      LIVE docs: STATUS, DECISIONS, SPEC-INDEX, CURRENT-STATE, PM-BRIEF,
                                   CONVENTIONS, OPUS-HANDOFF-GT · crs/ (change requests) · session-log/ · baselines/
    history/                       completed records (setup reports, reviews, raw inventory, PM handoff) — read-only
    _archive/                      superseded material — never read as current state
  01-vision/                       founder vision
  specs/                           S##-NOTES / -SPEC / -T##-BUILD / -REVIEW / -VERDICT / S##-GATE
  templates/                       NOTES, SPEC, BUILD, REVIEW, VERDICT, GATE
```
**Live vs history vs archive:** `00-control/` top level is current and maintained. `history/` is finished work kept for evidence (cite it, don't update it). `_archive/` was replaced by something newer — ignore it.

## The loop (D-003)
Founder NOTES → Opus SPEC → PM review → founder approves → GLM BUILD → Grok REVIEW → Opus VERDICT → Astra GATE → founder inspects. Copy the matching file from `templates/`. Conventions (IDs, headers, single writer, commits): `00-control/CONVENTIONS.md`.

## Graph first
Find code with `uvx --from graphifyy graphify explain "<SymbolName>"` (precise) before opening files; natural-language `graphify query` is noisy.
