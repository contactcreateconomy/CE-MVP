# DECISION — M3: Content Qualification Rulebook (Build Sheet · BACKEND-LOCKED)

**Status:** BACKEND LOCKED · **Frontend (§10 + visual §11):** DEFERRED → **Frontend phase** · **Date:** 2026-07-28
**RACI:** R/A = Opus · Consulted/Informed = GPT/GLM/Sonnet + Founder
**Schema:** fills `M0-build-sheet-schema.md`. Canonical names = `_data-model.md`. **Pairs with `M2-content-engine.md`** (M2 calls M3 at the gate).

---

## 1. Header & Layer Profile
- **id:** M3 · **purpose:** the quality gate that decides whether system-generated content qualifies to publish — deterministic **hard** rules (fail-closed, auto-reject) + **soft** scores (operator-facing, never gate), plus the **similarity + claim-traceability** engine. Config-driven + tunable. · **owner:** Opus · **status:** backend locked.
- **dependencies (up):** M1 (systemConfig, categories) · M2 (candidates, claims, embeddings) · M4 (post.type field contracts) · M5 (tools for category/entity). **(down):** M2 (consumes the verdict).
- **Layer Profile:** Backend/Data = **Required** · Integration (embeddings, moderation classifier) = **Required** · Admin-FE (rule config + evidence view) = **Required (contracts now; visual DEFERRED)** · Customer-FE = N-A · Analytics/Audit = Required.
- **SCOPE:** SYSTEM-generated content only. **User posts = industry guardrails only** (NSFW/illegal + profanity, on top of DEC-P02) — not this rulebook.

## 2. Canonical Names & Enums
- Tables (Bible): `qualificationRules`, `qualificationRuns`, `qualificationRuleResults`, `similarityChecks`, `contentEmbeddings`; reads `contentCandidates`, `sourceClaims`, `claimClusters`, `contentCandidateSources`, `sources`, `tools`, `categories`.
- Enums: `qualificationRule.ruleClass {hard|soft}`, `qualificationRuleResult.result {pass|fail|flag}`, `similarityChecks.checkType`.
- Functions: `qualify` (orchestrator), `rules.hard.*`, `rules.soft.*`, `similarity.check`, `traceability.check`, `rulebook.listRules`, `rulebook.setRuleConfig`, `rulebook.calibrate`.

## 3. Scope & Non-Goals
- **In:** the rule set (hard + soft) · the deterministic **dual-layer similarity gate** · the **claim-traceability** (anti-hallucination) check · the evaluation orchestrator producing `contentCandidates.evaluation` + immutable `qualificationRuns/RuleResults` · config-driven rule enable/threshold (`qualificationRules`) · calibration tooling.
- **Non-Goals:** ingestion/forge/persona/publish (**M2**); the post structures (**M4**); user-post moderation (**M13** industry guardrails); embeddings *generation* (M2 produces `contentEmbeddings`; M3 queries them).

## 4. Domain Context
- **Terminology:** *hard rule* = deterministic, fail-closed, auto-reject (no human needed); *soft rule* = scored signal, operator-facing, never auto-gates; *traceability* = every draft fact must map to a `sourceClaim`.
- **Actors:** automated = the `qualify` orchestrator (called by M2); operator = sees results in the editorial workspace; Administrator = tunes `qualificationRules` (enable + thresholds).
- **Invariants:**
  - INV-1 **The LLM never decides a hard gate.** Hard rules are deterministic (code + embedding distance + dedicated classifier); GLM self-critique is allowed ONLY for soft scores.
  - INV-2 A candidate with any hard `fail` cannot reach `approved` (M2 INV-2).
  - INV-3 Soft scores never change publication eligibility (advisory only).
  - INV-4 `quote` spans are exempt from PROSE-similarity ONLY via the **H-QUOTE** gate (caps + exact-span + attribution) — never a blanket bypass; excluded from H-TRACE (inherently from-source).
  - INV-5 Rule **logic lives in code**; `qualificationRules` only toggles enable + bounded thresholds (no executable logic in the DB).
  - INV-6 Every run writes an immutable `qualificationRun` + `qualificationRuleResults`; `contentCandidates.evaluation` is the latest snapshot projection.
- **Source of truth:** rule verdicts = `qualificationRuns/RuleResults`; thresholds/enable = `qualificationRules`.

## 5. Dependencies & Cross-Module Contracts
| Provider | Consumer | Shape | Trigger | Failure | Sync | Launch-block |
|---|---|---|---|---|---|---|
| M2 | M3 `qualify` | candidateId + revision | after forge / edit | — | sync | yes |
| M3 | M2 | `{overallResult, ruleResults[]}` + snapshot on candidate | on completion | fail-closed (no pass on error) | sync | yes |
| `contentEmbeddings` (M2) | M3 similarity/traceability | vectors via `ctx.vectorSearch` | during `qualify` | embedding missing → fail-closed | async (action) | yes |
| Moderation classifier | M3 safety hard rule | safe/unsafe | during `qualify` | unavailable → hold (fail-closed) | async | yes |

## 6. Data Model `[DATA][BE]`
Per Bible. `qualificationRules` (ruleKey unique, ruleClass, severity, enabled, thresholdConfig bounded, applicablePostTypes[]); `qualificationRuns` (immutable, by_candidate); `qualificationRuleResults` (by_run, evidence); `similarityChecks` (by_candidate, checkType, score, threshold, result, matched text). Uses `contentEmbeddings` **vectorIndex** for semantic checks.
- *Worked example:* `qualify(candidateA)` → `qualificationRuns{overallResult:'fail'}` + results: `{H-SIM: fail, score 0.31, threshold 0.28, matchedText…}`, `{S-DISC: flag, score 2.0}` → snapshot on `contentCandidates.evaluation`.

## 7. Domain States & Lifecycle
- **Evaluation result:** `overallResult ∈ {pass | fail}` (fail = ≥1 hard fail). Soft flags do not affect `overallResult`. Re-run on every material candidate edit (new `candidateRevision`).
- **Rule state:** `qualificationRules.enabled` true/false; `thresholdConfig` within bounded ranges (validated on `setRuleConfig`).

## 8. Rules, Algorithms & Limits `[BE]`
**HARD (deterministic, fail-closed, auto-reject; each emits a `qualificationRuleResult`):**
- **H-SRC** blocked/unauthorized source (any `contentCandidateSources.sources.trustLevel = blocked`, or disallowed ingest method, or active takedown).
- **H-SUF** source sufficiency: < 2 **independent** domains (syndication-collapsed) unless first-party + operator ack.
- **H-TRACE** grounded claim traceability *(anti-hallucination)*: the forge emits, per factual assertion, explicit `sourceClaimId[]` references (`draftClaimRefs`); vector search only **RETRIEVES** candidate claims — it is **NOT proof of support**. HARD FAIL if any factual assertion lacks a cited claim; **numbers/dates/quotes/named-entities are exact-validated** against the cited claim; **operator confirms entailment** at approval (fail-closed until confirmed). Opinion/analysis exempt. *(Fixes "semantically-near ≠ entailed" — a negated/number-altered sentence cannot pass.)*
- **H-QUOTE** quotation gate *(non-bypassable)*: a `claimType=quote` span is exempt from PROSE-similarity ONLY after passing — each quote ≤ maxQuoteWords, ≤ maxQuotesPerPost, total quoted ≤ maxQuotedBodyPct (config; calibrate), AND exact evidence-span equality + attribution present. **Anything exceeding any cap or failing verification is NOT exempt — it re-enters H-SIM as ordinary text** (and hard-fails if over threshold). *(Closes the quote-tag bypass.)*
- **H-SIM** similarity gate (dual-layer, deterministic):
  - *surface* — n-gram exact-run + 5-word-shingle **Jaccard** + **LCS** vs each `sourceClaim.sourceQuote` and recent published posts (per-paragraph + whole-doc);
  - *semantic* — `ctx.vectorSearch` cosine vs published posts (same category).
  - Thresholds from `qualificationRules.thresholdConfig` (seeded defaults; **calibrated on first ~100**). Quotes handled by **H-QUOTE** (not blanket-excluded). Every comparison → `similarityChecks`.
- **H-DUP** cross-post duplicate (semantic + surface over dup threshold vs recent window).
- **H-CAT** off-category: no locked category (of 5) above confidence threshold AND no operator category override.
- **H-SAFE** NSFW/illegal via **dedicated moderation classifier** (not GLM self-check).
- **H-TYPE** post-type contract: required M4 fields present per `post.type` (News→source block; Review→tool+verdict; Compare→2–4 tools; Debate→proposition; List→items; Showcase→metadata).
- **H-DISC** AI-disclosure/provenance present (byline/label + `generationRuns` recorded).
- **H-AFF** affiliate separation: no affiliate URL in prose (structured CTA only).
- **H-EXP** persona-experience fabrication: pattern check ("I used/tried…", first-person experience by non-user author) ⇒ fail/flag for mandatory review.

**SOFT (scored 0–5 with evidence, operator-facing, NEVER gate):**
- **S-DISC** discussion-starter (multi-dim GLM: provocation/tension + relevance + specificity + invitation/question; must surface Position A + Position B; Debate ⇒ a real two-sided disagreement).
- **S-VAL** quality/value (audience named · specific problem · synthesis beyond recitation · actionable · limitation noted).
- **S-SEO** SEO completeness (deterministic checklist: title/meta length, keyword placement, headings, internal-link suggestions).
- **S-READ** readability (Flesch formula — pure function).
- **S-AFF** affiliate-fit (entity name-match; only 3–5 eligible for a placement; **never affects publication**).

- **Orchestration:** `qualify` runs hard rules first (short-circuit to `fail` on any hard fail, but still record all for evidence where cheap), then soft scores; writes `qualificationRun` + results + snapshot. **Config-driven:** only `enabled` rules run; thresholds from `thresholdConfig`.
- **Limits:** thresholds bounded ranges (validated); rule logic versioned (`ruleVersion`); calibration set ~20–100 candidates.

## 9. Backend Operations `[BE]`
- `qualify(candidateId, revision)` **(action)** — orchestrator; calls hard + soft rules; writes `qualificationRuns/RuleResults` + `contentCandidates.evaluation`; returns verdict to M2. Fail-closed on any dependency error.
- `similarity.check` **(action)** — dual-layer; writes `similarityChecks`.
- `traceability.check` **(action)** — draft-claim extraction (GLM) + embedding match vs `sourceClaims`.
- `rules.hard.*` / `rules.soft.*` **(internal functions)** — typed implementations.
- `rulebook.listRules` **(query)** · `rulebook.setRuleConfig` **(mutation, admin)** — enable/threshold within bounds; `auditLog`.
- `rulebook.calibrate` **(internal)** — replays a labeled set to surface threshold drift.
- **Env:** `EMBEDDING_API_KEY`, moderation-classifier key. No auto-publish.

## 10. Customer Frontend `[FE]` — N-A.

## 11. Admin & Governance `[ADMIN]`
- **Governance (LOCKED):** rule config (Administrator): enable/disable a rule + tune `thresholdConfig` within bounded ranges; audited. Operators SEE `qualificationRuleResults` + `similarityChecks` evidence in the editorial workspace (M2).
- **Config registry:** `qualificationRules` (per-rule enabled + thresholdConfig + applicablePostTypes); similarity/traceability/category thresholds; calibration set.
- **Visual admin:** DEFERRED → Frontend phase; registers to M15.

## 12. RBAC
| Action | Editor/Publisher | Moderator | Administrator |
|---|---|---|---|
| view rule results/evidence | ✓ | ✓ | ✓ |
| enable/disable rule · tune thresholds | ✗ | ✗ | ✓ |
| run/re-run qualify | ✓ (via workspace) | ✗ | ✓ |

## 13. Integrations
- **Embedding model** (via `ctx.vectorSearch` on `contentEmbeddings`) — similarity + traceability; fail-closed.
- **Dedicated moderation classifier** — H-SAFE; fail-closed (hold on unavailability).
- No GLM in the hard path (soft scores only).

## 14. Analytics, Audit & Observability
- Events: `qualify_run{overallResult}`, `hard_fail{ruleKey}`, `soft_flag{ruleKey,score}`, `similarity_check{checkType,score,result}`, `rule_config_changed{ruleKey}`.
- Audit: `rulebook.setRuleConfig` → `auditLog`.
- Monitoring: hard-fail-rate by rule, false-positive review (for calibration), similarity score distribution, embedding/classifier availability.

## 15. Content & Copy Contract
- **R4:** rejection/failure reason codes + AI-disclosure requirement copy = fixed. Operator-facing flag explanations provisional (FE phase).

## 16. Edge Cases & Failure Recovery
- Embedding/classifier unavailable → **fail-closed** (candidate cannot pass) until restored.
- All soft scores low but hard rules pass → publishable (operator judgment) — soft never gates.
- Threshold set out of bounds → `setRuleConfig` rejects.
- Draft claim genuinely from a source not yet embedded → traceability may false-fail → operator can add a `sourceClaim` + re-run (recovery path).
- Quote wrongly untagged → would trip H-SIM; operator tags `claimType=quote` + re-runs.

## 17. NFR / Security / Privacy / SEO
- Integrity: deterministic hard gate is the trust core (INV-1); thresholds bounded + audited; every verdict evidenced + immutable.
- Privacy: only candidate + source text to embedding/classifier; no user PII.
- Performance: hard rules short-circuit; vector search filtered by category (bounded fan-out).

## 18. Fixtures, Tests & Acceptance Criteria
- Fixtures: candidates that trip each hard rule (blocked source, <2 domains, verbatim copy, untraceable claim, off-category, NSFW, missing type field, affiliate-in-prose, fabricated experience); candidates with varying soft scores.
- Tests: each hard rule fails-closed + records evidence · soft scores never change `overallResult` · quote excluded from H-SIM · traceability uses embedding distance (not GLM verdict) · thresholds read from config · out-of-bounds config rejected · immutable run written each time.
- **AC:**
  - G a draft with a fact not present in any `sourceClaim` · W `qualify` · T H-TRACE fails (embedding distance > threshold); candidate not reviewable.
  - G all soft scores = 1 but all hard rules pass · W `qualify` · T `overallResult = pass` (soft never gates).
  - G admin sets a similarity threshold outside the allowed range · W `setRuleConfig` · T rejected.
  - G an editorial verdict of 4.5 on a Review · W SEO schema generation (M2) · T aggregate-rating schema ignores it (DEC-M2-SCHEMA) — cross-checked here as a rule contract.
  - G a draft sentence "Tool X costs $200" while the cited claim says "$20" · W `qualify` · T H-TRACE hard-fails (exact number validation), regardless of embedding closeness.
  - G a draft where 60% of the body is tagged `quote` · W `qualify` · T H-QUOTE re-enters the excess into H-SIM (cap exceeded) → hard fail.

## 19. Release, Migration & Rollback
- Flag: `rulebook` (M2 gate can run in "advisory-only" mode behind a flag for initial calibration, then switch hard rules on) — **default: hard rules ON** for launch.
- Migration: seed `qualificationRules` (defaults + bounded ranges); calibrate on first ~100.
- Rollback: disabling a single rule = config action (audited); no data loss.

## 20. Global Projections & Open Decisions
- **Projects to:** global data model (rulebook tables), RBAC (§12), Admin console (M15: rule config + evidence), analytics, audit, config.
- **Open (DEC):** similarity/traceability/category thresholds = seeded defaults **calibrated on first ~100** (DEFERRED-tune); embedding model + dims = CONSTRAINED (confirm at build); advisory-vs-hard launch mode = default hard-on.
