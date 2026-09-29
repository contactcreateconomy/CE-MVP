---
id: S##
type: GATE
author-model: Astra
tool: Codex
round: 1
status: DRAFT
date: YYYY-MM-DD
---

# S## — milestone gate

**Scope:** all tasks of S## ACCEPTED. **Build:** commit … on `<branch>`.

## Result: PASS | FAIL

## Mandatory: benchmark side-by-side (D-005)
Screenshot pairs at 390: **this screen vs the spec's benchmark app doing the same job**, dark and light.
Store under `specs/S##-evidence/benchmark/`. Verdict per pair: beats / matches / loses — and why. Any "loses" on the benchmark claim = FAIL.

## Browser QA (390 + 1440 · logged in + out · **dark AND light at 390** — D-013)
| Check | 390 | 1440 | Notes |
|---|---|---|---|
| Six questions (VISION §6) hold in the real UI | | | |
| Benchmark claim holds | | | |
| All states render (loading/empty/error) | | | |
| One-thumb core action | | | |
| No copy leaks / raw keys (D-011) | | | |
| No fabricated data — every number/name/badge is real (D-012) | | | |
| Glow/glass follow D-007 guardrails (reason for every blink; ≤2 glass layers; solid fallback) | | | |
| Dark theme polished | | | |
| Light theme polished | | | |
| Performance budget (S00 §perf) holds | | | |
| Motion purposeful, reduced-motion respected | | | |

## Deep review findings (blocking first)

## For the founder's inspection
Screenshots: … · What to try: …
