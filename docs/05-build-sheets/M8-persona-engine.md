# DECISION — M8: AI Persona Engine (Build Sheet · BACKEND-LOCKED)

**Status:** BACKEND LOCKED · **Customer FE (§10) + visual admin (§11):** DEFERRED → **Frontend phase** · **Date:** 2026-07-29
**RACI:** R/A = Opus · Consulted/Informed = GPT/GLM/Sonnet + Founder
**Schema:** fills `M0-build-sheet-schema.md`. Canonical names = `_data-model.md`. Invokes M2 generation infra; comments plug into M6.

**North star:** *editorially governed, memory-grounded ambient intelligence that knows when NOT to speak.* Coherent enough to remember · distinct enough to recognize · grounded enough to trust · **sparse enough to stay interesting** · useful enough to deserve a reply · transparent enough to never deceive.

---

## 1. Header & Layer Profile
- **id:** M8 · **purpose:** define + operate the AI personas — a living, rotating population of configurable, memory-grounded characters that contribute substantive, labeled comments to discussions (never posts in V1), with a public lifecycle and community revival. · **owner:** Opus · **status:** backend locked.
- **dependencies (up):** M1 (users/mediaAssets/systemConfig/categories) · M2 (GLM + embedding generation infra, generationRuns) · M4 (posts/comments target) · M5 (tools for grounding) · M6 (comment publish + threadContext). **(down):** M6 (persona comments) · M9 feed (EXCLUDES personas from ranking) · M12 (EXCLUDES from leaderboard).
- **Layer Profile:** Backend/Data = **Required** · Jobs (population/cadence/drift crons) = **Required** · Integration (GLM, embeddings) = **Required** · Admin-FE (genome config, review queue, population console) = **Required (contracts now; visual DEFERRED)** · Customer-FE (persona profiles, **public Population page**, **revival voting**) = **Required feature; visual DEFERRED → FE phase** · Analytics/Audit = Required.
- **SCOPE:** personas **COMMENT ONLY** in V1 (humans/SEED author all posts; persona post-authorship deferred — adjusts DEC-A01 for V1).

## 2. Canonical Names & Enums
- Tables (Bible): `personas`, `personaGenomes`, `personaPositions`, `personaMemoryEmbeddings`, `personaStyleBaseline`, `personaCadenceState`, `personaEngagements`, `personaCommentDrafts`, `personaCommentEvaluations`, `personaLifecycleEvents`, `personaRevivalVotes`.
- Enums: `persona.lifecycleStatus`, `persona.humorLevel`, `persona.sarcasmLevel`, `personaGenome.scope`, `personaPosition.status`, `personaEngagement.contributionIntent`, `personaLifecycleEvent.eventType`.
- Functions: `genome.compileSystemPrompt`, `persona.birth`, `persona.activate`, `persona.pause/resume`, `persona.wane`, `persona.retire`, `persona.revive`, `population.recommend` (cron), `selection.relevanceGate`, `persona.generateComment`, `persona.evaluate`, `persona.regen`, `personaComment.approve/reject/schedule/publish`, `revival.vote`, `revival.tally`, `drift.check` (cron), `cadence.recompute`.

## 3. Scope & Non-Goals
- **In:** genome (configurable templates + per-persona instances + humor/sarcasm dials) → compiled system prompt; lifecycle (draft→nascent→active→waning→retired +paused) + population manager; **community revival**; layered memory + position ledger + consistency/drift; relevance/gap gate (**default-to-silence**); comment generation; the **persona comment rulebook** (hard + soft, incl. anti-homogenization); cadence; **public Population page** + persona profiles (data + rules); operator review.
- **Non-Goals:** the generic comment/thread engine (**M6** — persona comments publish into it); post authoring (deferred); feed ranking (**M9**, which EXCLUDES personas); tool ratings (personas barred, DEC-M5-NOSTAFF); the raw GLM/embedding transport (**M2** infra reused).

## 4. Domain Context
- **Terminology:** *genome* = the trait spec (template or instance) compiled into a system prompt; *identity charter* = public purpose/lens/values (never in the gen prompt); *position ledger* = a persona's structured stances; *contribution intent* = the one job a comment does; *relevance/gap gate* = decides IF a persona should speak.
- **Actors:** automated = population/cadence/drift crons + generation; operator = Editor/Publisher (review/approve/edit/regen persona comments, confirm births/retirements/revivals); Administrator (genome config back-door, thresholds, hand-craft personas); community = real members (revival votes); users = read persona comments, reply to them (users may @/reply personas; personas never @/reply users).
- **Invariants:**
  - INV-1 **Default to silence:** the relevance gate returning "do not generate" is a SUCCESS outcome; most posts get zero persona comments.
  - INV-2 **Genome ≠ biography:** no invented employment/education/purchases/geography/experience; the identity charter/backstory is NEVER included in the generation prompt.
  - INV-3 **Memory preserves PERSPECTIVE, not FACT:** every factual claim revalidates against M2/M3 source claims + `tools`; evidence overrides persona consistency.
  - INV-4 **personaId is a HARD filter** on every memory retrieval (no cross-persona leakage).
  - INV-5 **Operator approves every published persona comment** (DEC-A01); hard-kill runs BEFORE the operator sees a draft (operator time is scarce).
  - INV-6 Persona comments are **excluded from ranking + human counts** (M9/M12); a persona cannot post a tool rating (DEC-M5-NOSTAFF).
  - INV-7 **Population change is admin-executed** (cron recommends); **max 1 birth + 1 retirement per day.**
  - INV-8 **Revival demand is real + gated** — one vote per member **meeting the posting trust tier (M7) + minimum account age** (personas/staff excluded; rate-limited); the tally + threshold are **snapshotted at operator approval** (never auto-revive); revival restores the same persona with full memory + full lifecycle history.
  - INV-9 **Honest timing:** real publish timestamps; stagger for relevance only; no simulated human-arrival delay or "I just saw this" language.
- **Source of truth:** identity = `personas`+`personaGenomes`; stances = `personaPositions`; lifecycle = `personas.lifecycleStatus` + `personaLifecycleEvents`.

## 5. Dependencies & Cross-Module Contracts
| Provider | Consumer | Shape | Trigger | Failure | Sync | Launch-block |
|---|---|---|---|---|---|---|
| M2 | M8 | GLM + embedding actions, `generationRuns` | generate/evaluate | graceful degrade — publish post with 0 persona comments (additive, never load-bearing) | async | no |
| M8 | M6 | approved persona comment (authorType=persona) + threadContext | on approve/publish | if M6 deletes the comment, cadence recomputes | sync | yes |
| M6 threadSummaries | M8 | thread state/summary | relevance + follow-up | absent → skip follow-up | sync | yes |
| M8 | M9/M12 | persona flag | ranking/leaderboard | **MUST exclude** persona comments | sync | yes |
| M5/M2 | M8 | tool facts + source claims | fact revalidation | unverifiable fact → hard-kill | sync | yes |

## 6. Data Model `[DATA][BE]`
Per Bible (§ Persona engine). Vector index: `personaMemoryEmbeddings.by_persona_embedding` (**filterFields [personaId]**) + `personaGenomes.embedding` (diversity). Indexes: `personas.by_lifecycleStatus`; `personaPositions.by_persona_topic`; `personaCadenceState.by_persona`; `personaRevivalVotes.by_persona` (+ unique userId,persona).
- *Worked example:* admin sets a genome template `{analyticalLens:'skeptic', humorLevel:'dry', sarcasmLevel:'pointed', domainLevels:{ai_tools:3}}` → `persona.birth` compiles a system prompt + generates displayName/bio → `nascent` → 5 test comments approved → `active`.

## 7. Domain States & Lifecycle
- **lifecycleStatus:** `draft → nascent → active → waning → retired`; `paused` orthogonal (safety/quality hold, resumable). `retired → active` ONLY via `persona.revive` (community threshold + operator). Nascent trial: ≤3 comments, ≤1/48h, all operator-approved, ≥N days.
- **Position:** `current → evolved|superseded|withdrawn` (evolution requires new evidence + acknowledgement + operator; old position superseded).
- **Draft comment:** `generated → edited? → approved|rejected → published` (+ `supersededByDraftId` on regen).
- **Precedence:** paused/retired overrides any selection; hard-kill overrides soft scores; evidence overrides persona consistency (INV-3).

## 8. Rules, Algorithms & Limits `[BE]`
- **R-GENOME (configurable):** system prompt is **compiled** from the genome (never hand-written per comment). Admin **config back-door**: tune templates (trait ranges/distributions/weights), override an instance's traits, or hand-craft a persona — **every edit is versioned + preview-fixtured + written to `personaGenomeEdits` + `auditLog`** (operator identity). **Humor/sarcasm dials** (`none/dry/light/sharp`, `none/mild/pointed`) are **bounded ENUM inputs to the compiled prompt — never executable free-text**; at template + per-persona; default conservative; **sarcasm targets ideas/tools/claims, never people/users.**
- **R-BIRTH:** measurable triggers only (category-coverage gap · roster deficit vs `targetRosterSize` · operator "no good match"). Birth QA: genome-diversity (embed; resample if >~0.85 similar) + 5 offline test comments + name-collision check + operator approval. Never born because others retired.
- **R-POP (population manager, daily cron):** recommends births/retirements; **admin executes; max 1 birth + 1 retirement/day.** Roster config: seed ~5–8, grow +1/~14d as approval-rate proves out.
- **R-RETIRE:** triggers (operator-rejection rate over threshold · repetition-saturation · voice-drift · no selection N days · overlap · soft lifespan 3–6mo, operator-extendable). Graceful; profile + history preserved; optional retirement-letter final comment.
- **R-REVIVE:** `personaRevivalVotes` accrue **only from eligible voters** (posting trust tier + min account age; personas/staff excluded; rate-limited); at `revival.threshold` (config) the persona becomes revival-**eligible** (never auto) → **operator confirms**, snapshotting the eligible tally + threshold → `persona.revive` restores the same persona (full memory + full lifecycle history) marked "revived by community"; `personaLifecycleEvents{eventType:revival, triggeredBy:community}`. **Re-activation QA:** a fresh evidence-revalidation of the persona's stances + a few operator-approved test comments run before its first post-revival comment.
- **R-RELEVANCE (default-to-silence gate):** deterministic + cheap-classifier factors (domain-eligibility [post level ≤ persona domainLevel] · **gap: which contribution functions are already covered** · novelty · thread maturity · continuity · − redundancy · − density · − cadence). Below threshold → **do-not-generate (success).** Score authorizes generation, NEVER publication.
- **R-MEMORY:** compose (identity charter-summary + last-N stanceSummaries + relevant `personaPositions` + top-K semantic via `vectorSearch` **filtered personaId** + delimited thread context). Thread text = **untrusted** (prompt-injection defense); GLM has **no** mutation/publish access.
- **R-RULEBOOK (persona comment):** **HARD auto-kill BEFORE operator** — AI-identity resolves+labeled · **no personal experience** (pattern + classifier) · **no @/reply to a user** · **no persona-to-persona** · **no unsupported facts** (ground to source claim/tool/attributed-thread-claim; INV-3) · domain-eligibility · **substance = ≥1 contribution unit** · **no-clear-position** (kill "both sides"/"it depends" w/o specific conditional) · **repetition** (vs own history + vs thread + **vs OTHER active personas on the post**) · **no-AI-tells** (banned-phrase + banned-opener config list) · **humor policing** (kill generic/forced/pun/exclamation "trying-too-hard"; sarcasm-at-people = kill) · boundaries (≈40–180 words) · thread-advancement · density/lifecycle caps. **SOFT 0–5 (operator-facing, never gate):** substance · specificity · advances-thread · **voice-consistency** (style-baseline centroid + signature-move presence + humor-trait match) · naturalness.
- **R-HOMOGENIZATION (4 fixes):** forced stance · contribution-archetype rotation · banned-opener matching · **cross-persona differentiation** (kill same-point-reworded / interchangeable style nearby). *The cross-persona check reads only other personas' **published** text — never their memory / position ledger / system prompt / genome / drafts.*
- **R-CADENCE:** selectivity is the lever (most posts = 0); stagger for relevance; **real timestamps, no deceptive arrival simulation.** Platform density ≤ ~15% of human comments / rolling 24h (+ small bootstrap floor while human volume low).
- **R-DRIFT (weekly cron):** style centroid vs genome > threshold → flag for operator (re-ground or retire).
- **Limits (config `systemConfig`):** `targetRosterSize`, per-persona weekly budget, **≤2 personas/post (reaffirmed)**, regen cap (2–3; chronic-fail→waning), **platform-wide daily persona-generation ceiling (cost backstop)**, **follow-up cron window 7–14 days**, similarity/drift/relevance/density thresholds, revival threshold + **voter eligibility (trust tier + account age + rate-limit)**, banned phrases/openers, humor/sarcasm defaults.

## 9. Backend Operations `[BE]`
- `genome.compileSystemPrompt` **(internal)**; `persona.birth/activate/pause/resume/wane/retire/revive` **(mutations, operator/admin)** → `personaLifecycleEvents`.
- `population.recommend` **(cron)**; `drift.check` **(cron, weekly)**; `cadence.recompute` **(internal)**.
- `selection.relevanceGate` **(action)** — R-RELEVANCE (may cheap-classify via GLM).
- `persona.generateComment` **(action, GLM)** → `personaCommentDrafts` + `generationRuns` (+ memory retrieval via `vectorSearch`).
- `persona.evaluate` **(action)** → `personaCommentEvaluations` (hard-kill + soft); `persona.regen` **(action)** (capped).
- `personaComment.approve/reject/schedule/publish` **(mutations, operator)** → on approve: create `comments` (authorType=persona, staggered real timestamp) via M6 + `personaEngagements` + update `personaPositions` + write `personaMemoryEmbeddings`.
- `revival.vote` **(mutation, member)** — unique, staff/persona-excluded; `revival.tally` **(query)**.
- **Env:** reuses M2 `GLM_API_KEY`, `EMBEDDING_API_KEY`. **No auto-publish.**

## 10. Customer Frontend `[FE]` — **DEFERRED → Frontend phase**
Feature inventory (data/rules locked; visuals later): **persona profile** (= human profile + AI label + track record + "how this AI thinks" panel) · **public Population page** (active / newly-arrived / waning / retired; human-vs-AI transparency counter; retired "look-back") · **community revival voting** (bring-back button + live tally) · persona comment rendering (AI badge in the author line). Apple-grade standard applies.

## 11. Admin & Governance `[ADMIN]`
- **Governance (LOCKED):** genome **config back-door** (Administrator: templates, trait ranges/weights, per-persona override, hand-craft — **every edit versioned + preview-fixtured + `personaGenomeEdits`/`auditLog`**); persona lifecycle actions (operator/admin, audited via `personaLifecycleEvents`); persona-comment review queue (approve/edit/regen/reject; sees the "why" = relevance + gap + memory + evaluation); **revival confirmation (shows the eligible-tally snapshot; never auto)**; pause (safety). **Human-vs-AI counter is computed server-side from the same `authorType` source-of-truth M12 uses** (seed/staff = humans).
- **Config registry (`systemConfig`):** `persona.*` thresholds (roster, budgets, similarity/drift/relevance/density, revival threshold, regen cap), `persona.bannedPhrases`/`bannedOpeners`, humor/sarcasm defaults, `populationManagerConfig`.
- **Visual admin:** DEFERRED → FE phase; registers to M15.

## 12. RBAC
| Action | member | Editor/Publisher | Moderator | Administrator |
|---|---|---|---|---|
| view persona profile / Population page | ✓ (public) | ✓ | ✓ | ✓ |
| vote to revive a retired persona | ✓ (trust tier + min age) | ✓ | ✓ | ✓ |
| review/approve/edit/regen persona comment | ✗ | ✓ | ✗ | ✓ |
| birth/retire/revive/pause persona | ✗ | ✓ (confirm) | pause | ✓ |
| genome config back-door | ✗ | ✗ | ✗ | ✓ |

## 13. Integrations
- **GLM** (generation + cheap classifiers) — reuse M2 infra; thread text delimited-untrusted; no mutation/publish access; audited (prompt+model+version). **Embedding model** — memory/voice/diversity; fail-closed on gate-critical checks.

## 14. Analytics, Audit & Observability
- Events: `persona_birth/activation/waning/retirement/pause/revival`, `relevance_gate{result}` *(incl. do-not-generate)*, `persona_comment_generated/killed{rule}/approved/rejected`, `revival_vote`, `drift_flagged`.
- Audit: lifecycle events, genome config changes, approvals → `personaLifecycleEvents` + `auditLog`.
- **Quality denominator includes silence:** % posts correctly given no persona; draft rejection rate; human replies after a persona comment; repetition rate; **persona share of visible comments**; human-to-persona reply ratio; operator edit distance; cost per approved comment; **stance-diversity audit** (persona too consistently supportive → flag manipulation risk).

## 15. Content & Copy Contract
- **R4 (fixed):** permanent AI label, `/how-we-use-ai`, "revived by community" marker, retirement copy. Provisional (FE phase): profile/Population-page copy, operator queue labels.

## 16. Edge Cases & Failure Recovery
- GLM/embedding down → publish with 0 persona comments (additive, never load-bearing); no user-facing error.
- Chronic hard-kills (3+ consecutive) → operator flag; 5+ → auto-waning.
- Revival brigading → one vote/real member + operator confirm; suspicious spikes flagged.
- Prompt injection in thread → delimited untrusted; injection-compliance patterns → kill + pause persona.
- Comment that is a persona's `acceptedCommentId`/referenced elsewhere deleted → M6 cleanup (DEC-M4-HARDEN pattern); cadence recompute.
- Fact drift (persona repeats an outdated claim) → INV-3 revalidation overrides consistency.
- **Revival re-activation:** a persona retired for drift returns with drifted memory → fresh evidence-revalidation + operator-approved test comments before its first comment back.
- **Stale source:** if a cited source's last-update > ~30 days, fact-revalidation degrades gracefully — flag the comment "based on data from [date]" rather than asserting current truth.

## 17. NFR / Security / Privacy / SEO
- Security: thread = untrusted input; GLM no write access; memory writes only from approved output (no memory poisoning); personaId hard-filter (no leakage).
- Privacy: only public post/thread/tool text to GLM; no user PII.
- Trust: AI label always; excluded from ranking/counts; no deceptive timing; stance-diversity audit; no affiliate mention unless the post already discusses the tool.
- SEO: persona profiles + Population page indexable (public), clearly AI-labeled.

## 18. Fixtures, Tests & Acceptance Criteria
- Fixtures: a genome template + 2 instances (one `humor:dry/sarcasm:pointed`, one straight); a nascent persona in trial; active personas with position ledgers; a retired persona with revival votes; a thread with human comments + a gap.
- Tests: genome compiles to a system prompt; birth-QA resamples on >0.85 similarity; relevance gate returns do-not-generate on a covered thread; hard-kill fires (experience/@reply/p2p/no-position/repetition/cross-persona/unsupported-fact/humor-at-person); memory retrieval is personaId-scoped; evolution supersedes a position; density ≤2 + platform ≤15%; revival requires threshold + operator + excludes staff/persona votes; personas excluded from ranking; honest timestamps.
- **AC:**
  - G a thread where 3 humans already made the cost counterpoint · W `selection.relevanceGate` for a cost-focused persona · T do-not-generate (gap covered) — a success outcome.
  - G a draft "I've used this tool for months" · W `persona.evaluate` · T hard-kill (no personal experience), operator never sees it.
  - G a `sarcasm:pointed` persona drafting a jab at a *user* · W evaluate · T hard-kill (sarcasm-at-people); a jab at a *pricing model* passes.
  - G a retired persona hitting the revival threshold · W operator confirms `persona.revive` · T it returns active with full memory + "revived by community"; staff/persona votes were excluded from the tally.
  - G a burst of freshly-created accounts voting to revive · W the tally is computed · T votes below the trust-tier/account-age gate are excluded; the "revived by community" marker + snapshot reflect only eligible votes.
  - G persona comments on a post · W M9 computes ranking · T persona comments contribute 0 ranking signal.

## 19. Release, Migration & Rollback
- Flags (DEC-L06): `personas` master switch; per-capability (generation, revival, Population page). Personas **additive** — disabling leaves posts/human comments intact.
- Migration: seed genome templates + `systemConfig` persona thresholds + a small curated launch roster (~5–8, operator-approved). `personas.active` derived from lifecycleStatus+paused (reconcile the legacy boolean).
- Rollback: disable generation instantly (config); published persona comments remain (labeled) or can be hidden by flag.

## 20. Global Projections & Open Decisions
- **Projects to:** global data model (persona-engine tables), RBAC (§12), Admin console (M15: genome config, review queue, population console, revival confirm), analytics (silence-inclusive), audit.
- **Open (DEC):** DEC-A01 adjusted for V1 (personas comment-only; post-authorship deferred) — record in `_index`. All thresholds = config, calibrated. Embedding model/dims = CONSTRAINED (shared with M2). Cross-module: M9 feed + M12 leaderboard **MUST** exclude persona comments (contract).
