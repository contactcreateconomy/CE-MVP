---
id: S##
type: SPEC
author-model: Opus
tool: Claude Code
round: 1
status: DRAFT
date: YYYY-MM-DD
---

# S## — <name> — spec

**Built from:** `S##-NOTES.md` (founder) · `00-control/CURRENT-STATE.md` §… · VISION.
**Lane:** full | fast. **Routes/components touched:** …

## 0. Benchmark
**Beats <app> at <specific thing>**, measured by <how the founder/Astra can check it at 390px>.

## 1. The six questions (VISION §6) — all mandatory
| # | Question | Answer for this spec |
|---|---|---|
| 1 | **Trust** — does this screen increase trust at first glance? How? | |
| 2 | **Feel special** — where exactly does the creator feel appreciated? | |
| 3 | **Purposeful motion** — list every animation and what it does for the user (guide / confirm / delight). No decoration. | |
| 4 | **One thumb** — is the core action reachable one-handed at 390px? Where is it? | |
| 5 | **Benchmark** — which app does this beat, on what? (= §0) | |
| 6 | **Scope** — MVP-1 polish or a new feature? New features are out (D-001). | |

## 2. Today (from CURRENT-STATE — cite, don't re-derive)

## 3. Target experience (390px first; desktop follows)
Walk the user through it in order. Every state: default · loading · empty · error · (offline).

## 4. Components
| Component | New / extend / delete | File | Tokens used (STYLE-KIT §) |
|---|---|---|---|

## 5. Copy
Every user-visible string, verbatim, with its key. Passes COPY-1 (D-011). Founder/legal-owned strings marked.

## 6. Data
Queries/mutations used (existing only). Anything missing → CR-### (must exist before APPROVED).
Report-card signals this screen produces (list only).

## 7. Tasks for the builder
| Task | Scope | Files | Done when |
|---|---|---|---|
| S##-T01 | | | |

## 8. Acceptance (Astra/founder check at 390 + 1440, logged in/out)
- [ ] …
- [ ] typecheck · lint · `pnpm test:run` green; no new copy-leak hits.

## 9. Out of scope
