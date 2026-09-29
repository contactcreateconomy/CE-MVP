---
id: S##-T##
type: REVIEW
author-model: Grok
tool: Cursor
round: 1
status: DRAFT
date: YYYY-MM-DD
---

# S##-T## — code review

**Build:** `specs/S##-T##-BUILD.md` · **Diff:** `<base>..<head>`

## Verdict: PASS | PASS WITH NITS | CHANGES REQUESTED

## Findings (most severe first)
| # | Severity (blocker/major/minor/nit) | File:line | Finding | Suggested fix |
|---|---|---|---|---|

## Checked
- [ ] matches spec §4–§7 (no extra surfaces, no missing states)
- [ ] tokens only from STYLE-KIT (no raw hex/px where a token exists)
- [ ] COPY-1: no IDs / enum keys / infra names in user-visible strings
- [ ] a11y: focus-visible, labels, reduced motion respected
- [ ] no backend (`convex/`) edits without an ACCEPTED CR
- [ ] tests added/updated where behaviour changed
