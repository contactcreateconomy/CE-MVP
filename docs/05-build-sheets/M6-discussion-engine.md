# DECISION — M6: Discussion Engine (Build Sheet · BACKEND-LOCKED)

**Status:** BACKEND LOCKED · **Customer FE (§10):** DEFERRED → **Frontend phase** (MIN/MAX UI, per-type bodies, **group-chat mobile UX**) · **Date:** 2026-07-29
**RACI:** R/A = Opus · Consulted/Informed = GPT/GLM/Sonnet + Founder
**Schema:** fills `M0-build-sheet-schema.md`. Canonical names = `_data-model.md`. Reference (non-binding): `THREAD_DISCUSSION_SYSTEM` MIN/MAX spec.

**North star:** MIN = a clean read; **MAX = a grounded, navigable *map* of the collective reasoning.** The moat is the packaging (the discussion map), not a cleverer algorithm. Honesty spine (grounding, no dark patterns, personas-excluded) inherited from M2/M3/M8.

---

## 1. Header & Layer Profile
- **id:** M6 · **purpose:** the shared comment/thread engine every post type uses — ranking, scale (10→1M) + realtime, the MAX intelligence layer, per-type plug-in surfaces, psychology hooks. · **owner:** Opus · **status:** backend locked.
- **dependencies (up):** M1 (users/systemConfig) · M4 (posts + per-type mechanic side tables via `threadContext`) · M2 (GLM/embedding infra for MAX) · M5 (tool facts for grounding) · M7 (trust tier for gating/weighting) · M8 (persona comments publish in). **(down):** M9 feed · M12 leaderboard (+ reading-based trust) · M13 moderation.
- **Layer Profile:** Backend/Data = **Required** · Jobs (rank-recompute, intelligence, decay crons) = **Required** · Integration (GLM/embeddings) = **Required** · Realtime = **Required** · Customer-FE (MIN/MAX, per-type bodies, group-chat mobile) = **DEFERRED → FE phase** · Analytics/Audit = Required.
- **Two most-visited surfaces:** feed (M9) + this thread page — nail both.

## 2. Canonical Names & Enums
- Tables (Bible): `comments`, `commentReactions`, `commentScores`, `commentSaves`, `commentContextSignals`, `threadReadStates`, `threadStats`, `commentRankSnapshots`, `threadPluginConfig`, `threadIntelligenceRuns`, `threadThemes`, `threadPositions`, `threadQuestions`, `userReadingProgress`.
- Enums: `comment.sortMode` (best·live·new·top·most_discussed·qa), `commentContextSignal.type`, `comment.authorIntent`, `threadQuestion.resolutionStatus`.
- Functions: `comments.create/edit/softDelete`, `comments.list` (paginated by sort), `comments.getThread` (+ threadContext overlay), `reactions.toggle`, `saves.toggle`, `context.signal`, `rank.recompute` (batched cron), `readState.mark`, `intelligence.refresh` (cron), `pluginRegistry.list/setEnabled`.

## 3. Scope & Non-Goals
- **In:** core comment CRUD + threading (one-reply-depth) + moderation + soft-delete; the **per-type thread-feature plug-in registry**; **ranking** (Best/Live/Most-Discussed/Q&A, no downvote); **scale + realtime** (precompute, cursor pagination, hot-window, decoupled recompute); the **MAX intelligence layer** (map artifacts, grounded); read-state/stats; psychology hooks; reaction **abstraction**.
- **Non-Goals:** the **Signal attribution/economy** (reaction vocabulary now RESOLVED + `rawEvents` capture ships; the attribution/Signal engine is DEFERRED, Phase 2+ — DEC-SIGNAL-*); per-type MECHANIC tables (M4 owns debateVotes/postHelps/postListItems — M6 renders via overlay); persona generation (M8); feed ranking (M9); Community Notes (Phase 2); all MIN/MAX **visual** UI (FE phase).

## 4. Domain Context
- **Terminology:** *thread* = a post's comments; *plug-in* = a post type's extra thread features (overlay), never core-schema change; *hot-window* = the bounded live slice; *discussion map* = the MAX intelligence artifacts; *reactions* = `valuable` (single positive numerator) + save + hidden `negative` (+ optional private reason) + context signal + optional intent (RESOLVED, Reactions & Signal round).
- **Actors:** member (comment immediately after auto-mod, react, save, mark-context, resolve own Help); operator/moderator (moderate, plugin config); automated (rank recompute, intelligence, decay); personas (M8 — comment, excluded from ranking/counts).
- **Invariants:**
  - INV-1 One reply depth (post→comment→one reply; reply-to-reply stays L2 + @mention; no L3). `depth ∈ {0,1}`.
  - INV-2 **No user URLs** in comments (server-rejected, DEC-M4-URL).
  - INV-3 **No downvote**; disagreement is a stance/context signal, never suppresses a comment's score.
  - INV-4 **Scores are projections** of authoritative events (`commentReactions`/replies/`commentSaves`/context); same-mutation deltas + idempotency + reconciliation; read = index scan (never compute at read).
  - INV-5 **Realtime = hot-window only**; visible order is **snapshot-stable** (never reorder/insert while reading → "N new" indicator).
  - INV-6 **Personas excluded** from ranking inputs, human counts, and MAX themes/common-ground/participant-counts (may appear only in a labeled AI slot).
  - INV-7 MAX artifacts are **entailment-grounded by an independent pass** (every claim stores spans + {supported|contradicted|insufficient}; any contradicted/insufficient discards the whole artifact revision) + **labeled** "AI-assisted discussion map"; never "consensus".
  - INV-8 A plug-in may NEVER redefine depth/authorship/moderation/URL/persona/pagination.
- **Source of truth:** comments/reactions/saves/context = authoritative; scores/stats/intelligence = rebuildable projections.

## 5. Dependencies & Cross-Module Contracts
| Provider | Consumer | Shape | Trigger | Failure | Sync | Launch-block |
|---|---|---|---|---|---|---|
| M4 mechanic tables | M6 | `threadContext` overlay (debate tally, accepted answer, list-item votes) | render thread | absent → plain thread | sync | yes |
| M8 | M6 | persona comment (excluded from rank/counts) | on approve | — | sync | yes |
| M2 GLM/embeddings | M6 MAX | summary/themes/positions | intelligence cron | degrade → no map, comments unaffected | async | no |
| M7 trustTier | M6 | tier for gating/weighting | comment/react | default low weight | sync | yes |
| M6 | M9/M12 | engagement signals / counts (**exclude personas**) | ranking/leaderboard | — | sync | yes |
| M6 `userReadingProgress` | M7/M12 | reading-based trust | ongoing | — | async | no |
| M6 comment-delete | M4 | clear `postHelps.acceptedCommentId` | on delete | — | sync | yes (DEC-M4-HARDEN) |

## 6. Data Model `[DATA][BE]`
Per Bible (§ Discussion engine). Key indexes: `comments.by_post_created`, `by_post_parent`; `commentScores.by_post_best/by_post_live/by_post_mostDiscussed` (index range scan for sort); `commentSaves.by_user_comment`; `threadReadStates.by_user_post`; `threadStats.by_post`; `threadPluginConfig.by_type`; intelligence tables `by_post`.
- *Worked example:* a Debate post → `threadPluginConfig{postType:'debate', overlayComponent:'stanceMap', pinnedSlotBehavior:'separate-panel'}`; comments ranked by Best (Bayesian positive-score); MAX renders `threadPositions` common-ground across ≥2 stance clusters.

## 7. Domain States & Lifecycle
- **Comment:** `active → edited? → soft-deleted (tombstone, replies preserved)`; moderationStatus (auto-mod immediate for members; held/rejected fail-closed).
- **Rank score:** recomputed on interaction (decoupled/batched under load) + scheduled decay for Live.
- **Thread intelligence:** `pending → run → published (grounded) | discarded (ungrounded → keep last valid)`; incremental by revision.
- **Question:** `open → answered → resolved` (Help uses `postHelps.acceptedCommentId` as authoritative).

## 8. Rules, Algorithms & Limits `[BE]`
- **R-RANK:** precomputed `bestScore` = a **Bayesian confidence-damped positive score** — a lower bound on the positive signal, damped toward the **category-scoped mean positive-rate** (fallback global) + small-sample penalty + distinct-human corroboration + trust-weighting + integrity exclusions. **NOT Wilson**; **exactly ONE reaction type is the positive numerator**; **context/curation NEVER lowers Best**; a true impression-based positive-rate = **deferred Phase-2 upgrade**. `liveScore` = **engagement × HN-gravity time-decay** (`eng/(ageHours+2)^~1.5` + bounded new-comment exploration); `mostDiscussedScore` = **volume × balance**. Q&A = accepted pinned + Best. Read = index scan; **never compute at read**. (Prior strength/source + weights = config.)
- **R-RECOMPUTE (viral-load fix):** reactions/replies recorded instantly (append) + comment flagged in an **indexed dirty-score queue**; a **~3s batch cron** claims **bounded, leased batches** (never a global scan), **clears the flag BEFORE reading counters/writing scores** (a concurrent event re-flags for the next cycle), and is **idempotent against overlapping runs** (last-processed marker) — recomputes ≤1 mutation/comment/interval; eventually consistent (≤3s lag). Shard hot post-level counters.
- **R-ELIGIBILITY (anti-gaming):** one reaction per (user, comment, type); **exclude self/staff/persona**; **new/low-trust-tier reactions weighted-down or delayed** (reuse `trustTier`); reaction-velocity anomaly detection; vote-ring reversal. (Seed of the future Vote Quality Layer.)
- **R-REALTIME (hot-window):** subscribe ONLY to the visible page + expanded reply groups + counters + new-comment count. **Bounds (config, R1):** ≤100 live top-level, ≤5 expanded groups, ≤50 replies/group, 30-min sub refresh; deeper = static paginated snapshot; **no reorder while reading** → "N new".
- **R-PAGINATE:** cursor-based only (never offset); **freeze `rankVersion` per pagination session** (score changes between requests can't omit/duplicate comments); top-level 30/page (cap 50); replies 3 visible / expand 20; virtualize >150 nodes. **Deep-link** to a comment outside the window = a **targeted fetch that expands that branch outside the cap** (isolated focused view + "view in full thread"), never a broken scroll.
- **R-MAX (intelligence):** artifacts summary/themes/positions/**common-ground+divergence**/Q&A/evidence/nav; **incremental + async, never per-comment, never blocks MIN**; triggers (first ~10–20 human comments; +20 or 6h; operator; skip persona/reaction-only). **ENTAILMENT-grounded by an INDEPENDENT pass (NOT the generator self-attesting):** each claim stores supporting **spans** + an **entailment verdict {supported|contradicted|insufficient}** (validate comment existence + **human authorship** + moderation state + span accuracy + **semantic direction**); **any `contradicted`/`insufficient` discards the whole artifact revision**, last valid kept. **Persona-exclusion enforced at INPUT** (a separate **human-only** generation pass for themes/positions/common-ground/counts). **Common-ground/divergence stays silent unless ≥2 genuine stance clusters exist** (independent of the comment-count trigger). Labeled "AI-assisted discussion map"; never "consensus". Reuses M2 GLM/embeddings.
- **R-URL:** comments obey DEC-M4-URL (server-reject).
- **R-GATE:** commenting available immediately after auto-mod (DEC-P17); thread CREATION is M7-gated.
- **R-REACTIONS (RESOLVED — Reactions & Signal round):** `valuable` = the **single** positive quality signal (the only Best numerator) + `commentSaves` (private, weak) + `commentContextSignals` (routes to review, no rank cut) + optional `authorIntent` + a blunt **`negative`** reaction that is **hidden-result** (no public count, no author notification, **NEVER lowers Best**; feeds signal/moderation only) with an **optional PRIVATE reason** {disagree|not_useful|needs_evidence|off_topic} resolving **post-type-aware** meaning (Help = quality · Debate = stance · others = private value). `needs_evidence`→context signal; `off_topic`→moderation. **`disagree`-in-Debate is permanently barred from any quality term.** Reaction weight = `signalReputation`+legitimacy, **never Recognition**. Loop-closure: Debate shows a **thread-level** "% disagree" aggregate (per-comment counts stay hidden); Help shows a subtle "community has concerns" marker past a threshold. NOT "likes"; forward-compatible with the deferred Signal economy. (Foundation: `rawEvents` + `outcomeDefinitions` — DEC-RAWEVENTS / DEC-SIGNAL-*; the reaction toggle + its `rawEvents` append occur in the **same mutation** — atomic, never fire-and-forget.)
- **Limits (config):** Bayesian prior strength (+ **category-vs-global prior source**), gravity, decay, hot-window bounds, intelligence thresholds, reaction rate-limits, context-signal thresholds.

## 9. Backend Operations `[BE]`
- `comments.create` **(mutation)** — R-URL, R-GATE, one-reply-depth; sets depth + threadRootCommentId; same-mutation increment parent replyCount + threadStats + dirty-flag.
- `comments.edit` **(mutation)** (edited marker) · `comments.softDelete` **(mutation)** (tombstone; **clears `postHelps.acceptedCommentId` in the SAME transaction if applicable** — DEC-M4-HARDEN).
- `comments.list` **(query)** — paginated by `sortMode` (index range scan + cursor).
- `comments.getThread` **(query)** — page + `threadContext` overlay (M4) + intelligence refs (MAX).
- `reactions.toggle` / `saves.toggle` / `context.signal` **(mutations)** — append + dirty-flag (R-RECOMPUTE, R-ELIGIBILITY).
- `rank.recompute` **(internal cron ~3s)** — batch dirty comments; `rank.decay` **(cron)** for Live.
- `readState.mark` **(mutation)** — jump-to-unread + `userReadingProgress`.
- `intelligence.refresh` **(action cron)** — R-MAX (GLM + embeddings + grounding validate) → `threadIntelligenceRuns/Themes/Positions/Questions`.
- `pluginRegistry.list` **(query)** / `pluginRegistry.setEnabled` **(mutation, admin)**.
- **Env:** reuses M2 GLM/EMBEDDING keys. **Crons:** rank recompute, decay, intelligence.

## 10. Customer Frontend `[FE]` — **DEFERRED → Frontend phase**
Feature inventory (data/rules locked; visuals later): **MIN/MAX toggle** (one canonical URL) · per-type **thread bodies** (Help≈SO, Debate=position map, List=item-attached, etc.) · **the discussion map** (flagship) · sort selector · reaction UI (`valuable` + hidden `negative` + save + optional private reason) · jump-to-unread / "new since you left" / "N new comments" · **liveness** ("who's here / typing", real only) · **group-chat mobile UX** (thread feels like a group chat — match consumer behavior; no backend change) · virtualization. Apple-grade + human-psychology + progressive-disclosure standards apply.

## 11. Admin & Governance `[ADMIN]`
- **Governance (LOCKED):** plug-in registry enable/config (admin; audited); comment moderation (moderator; tombstone; held/rejected); context-signal review; intelligence forced-refresh.
- **Config registry:** `comment.*` (**Bayesian prior strength + category-vs-global prior source**, gravity, decay, hot-window bounds, intelligence thresholds, reaction rate-limits, context thresholds); **`threadPluginConfig` = predefined TYPED keys + bounded values only** (no arbitrary JSON / component names / query ids / executable; the plug-in interface exposes **NO hook** into depth/authorship/moderation/URL/persona/pagination).
- **Visual admin:** DEFERRED → FE phase; registers to M15.

## 12. RBAC
| Action | visitor | member | moderator | admin |
|---|---|---|---|---|
| read thread / MIN+MAX | ✓ | ✓ | ✓ | ✓ |
| comment / react / save / context-signal | ✗ | ✓ (after auto-mod) | ✓ | ✓ |
| resolve/accept (own Help) | ✗ | ✓ (own) | force | ✓ |
| moderate comment | ✗ | ✗ | ✓ | ✓ |
| plug-in registry config | ✗ | ✗ | ✗ | ✓ |

## 13. Integrations
- **GLM + embeddings** (MAX intelligence) — reuse M2 infra; grounded + labeled; degrade gracefully (no map, comments unaffected). No external calls otherwise.

## 14. Analytics, Audit & Observability
- Events: `comment_created`, `reaction_toggled{type}`, `save_toggled`, `context_signalled{type}`, `rank_recomputed{batch}`, `intelligence_refreshed{result}`, `intelligence_discarded_ungrounded`, `readstate_marked`.
- Audit: plug-in config, moderation → `auditLog`.
- Monitoring: rank-recompute lag, hot-window subscription counts, intelligence grounding-failure rate, gaming/velocity anomalies, persona-vs-human comment ratio (excl. from rank).

## 15. Content & Copy Contract
- **R4 (fixed):** "AI-assisted discussion map" label + grounding disclosure; ranking explainer copy (transparency = trust); tombstone "[removed by author]". Provisional (FE phase): MIN/MAX/panels/liveness copy.

## 16. Edge Cases & Failure Recovery
- Viral reaction storm → decoupled batch recompute (R-RECOMPUTE); user sees their reaction instantly.
- GLM/embeddings down → no MAX map; MIN unaffected (additive).
- Ungrounded intelligence → discard whole artifact, keep last valid, log for operator.
- Root deletion → tombstone, replies remain; deep-link = direct lookup + window.
- Realtime while reading → never reorder; "N new" only.
- Comment = a Help accepted answer, deleted → clears `postHelps.acceptedCommentId` (DEC-M4-HARDEN).

## 17. NFR / Security / Privacy / SEO
- Scale: compute-at-write; index-scan reads; cursor pagination; bounded hot-window (concrete numeric bounds, R1); virtualization.
- Security: no user URLs; reaction eligibility + velocity detection; intelligence entailment-verified (no fabrication); personas excluded from human signals. **Liveness = aggregate only** ("N viewing") — never named viewers, exact reading position, IP-derived presence, or persona-as-human.
- SEO: one canonical URL (`?view=min|max` not indexed separately); comments SSR-renderable; noindex held/deleted.
- Psychology: no dark patterns — no loss-framed streaks, no false urgency, no fake scarcity, no persona-counted-as-human; public ranking explainer.

## 18. Fixtures, Tests & Acceptance Criteria
- Fixtures: a thread with mixed human + persona comments; a Debate with stance split (common-ground); a Help with accepted answer; a 10k-comment thread (pagination/virtualization); a viral comment (storm); a plug-in registry per type.
- Tests: one-reply-depth enforced; no-URL reject; Best index-scan (no read-time compute); Live decay; no-downvote; reaction eligibility (self/staff/persona/new-account excluded); hot-window bounds; **no reorder while reading**; recompute batched under storm; MAX discard on contradicted/insufficient entailment (independent pass); personas excluded from rank/counts/common-ground; comment-delete clears accepted answer.
- **AC:**
  - G a 500-reactions/60s viral comment · W reactions land · T each is recorded instantly; scores recompute in ≤~3s batches (no timeouts).
  - G a MAX claim that cites a real comment but REVERSES its meaning · W the independent entailment pass runs · T verdict = contradicted → the whole artifact revision is discarded; last valid kept.
  - G a persona comment with many reactions · W ranking + human counts compute · T persona contributes 0 to rank + counts + common-ground.
  - G a user reading page 1 while new comments arrive · W they arrive · T order is stable; a "N new comments" control appears; nothing reorders.
  - G a fresh/low-trust account mass-reacting · W ranking computes · T those reactions are weighted-down/delayed/excluded.

## 19. Release, Migration & Rollback
- Flags (DEC-L06): `discussionEngine` (core), `maxIntelligence`, `liveness`, per-type plug-ins. MAX is additive — disable leaves MIN intact.
- Migration: seed `threadPluginConfig` per type + `systemConfig` M6 params + `outcomeDefinitions` (versioned outcome basket) + reaction config (`valuable`/`negative`/reasons); **`rawEvents` capture live from day one**.
- Rollback: disable MAX/liveness via config; comments/ranking unaffected.

## 20. Global Projections & Open Decisions
- **Projects to:** global data model (M6 tables), RBAC (§12), Admin console (M15: plugin config, moderation, context review, intelligence), analytics, audit, config; **reading-based trust → M7/M12**; **M9/M12 exclude personas** (contract).
- **Resolved / Deferred (DEC):** `DEC-M6-REACTIONS` **RESOLVED** (Reactions & Signal round → DEC-RXN-* / DEC-SIGNAL-* / DEC-RAWEVENTS; `valuable` + hidden `negative` + save + intent). The **attribution/Signal engine** + `DEC-SIGNALS` = **DEFERRED** (Phase 2+; `rawEvents` capture ships now). Community Notes = Phase 2. Bayesian prior / gravity / thresholds = config, calibrated. MAX-first-for-new-visitors = FE-phase A/B.
