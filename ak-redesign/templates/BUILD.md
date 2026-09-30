---
id: S##-T##
type: BUILD
author-model: GLM
tool: zcode
round: 1
status: DRAFT
date: YYYY-MM-DD
---

# S##-T## — <task> — build report

**Spec:** `specs/S##-SPEC.md` §7 row S##-T##. **Branch:** `s##-t##-short-name`. **Commits:** …

## What changed
| File | Change | LOC ± |
|---|---|---|

## Deviations from the spec (and why) — "none" if none

## Evidence
- Screenshots (390 in/out, 1440 in): paths under `specs/S##-evidence/`
- Gate: typecheck ✅/❌ · lint ✅/❌ · forum tests N/N · convex tests N/N (if touched) · cap-coverage N/572
- Acceptance checklist copied from the spec with ✅/❌ per line — **self-check is not acceptance**.
- **Every automated check proves it can fail (S00-CP1 rule).** For each test/script/assertion you add or rely on
  for acceptance, paste two runs: (1) **RED** — on a deliberately broken version (revert the fix, inject the
  violation, or point it at the old tree), the check fails with the expected message; (2) **GREEN** — on the
  real tree it passes. Say exactly how you broke it. Probe more than one shape of the violation when the
  check is a pattern/regex (e.g. same line vs. next line, other prefixes). A check with no RED run is
  treated as missing. Checks that can only pass (e.g. asserting `none` when the property is already `none`)
  must be paired with a check of the normal state.

## Open issues / questions for Opus
