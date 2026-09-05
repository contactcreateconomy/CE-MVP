# DECISION — M5: Tool Registry & Review Spine (Build Sheet · BACKEND-LOCKED)

**Status:** BACKEND LOCKED · **Frontend (§10 + visual §11):** DEFERRED → **Frontend round** · **Date:** 2026-07-28
**RACI:** R/A = Opus · Consulted/Informed = GPT/GLM/Sonnet + Founder
**Schema:** fills `M0-build-sheet-schema.md`. Canonical names = `_data-model.md`. Pairs with `M4-post-system.md` (tool-coupling contract).

---

## 1. Header & Layer Profile
- **id:** M5 · **purpose:** the tool registry (SaaS/AI tools) + the community rating spine — the "MouthShut for AI tools" honesty engine: user ratings form the aggregate; editorial verdicts stay separate. · **owner:** Opus · **status:** backend locked.
- **dependencies (up):** M1 users/mediaAssets/categories/tags · systemConfig. **(down):** M4 Review/Compare (consume `tools` + aggregate) · M11 Affiliate (tool ↔ affiliateLinks) · M9 Feed (tool pages).
- **Layer Profile:** Backend/Data = **Required** · Admin-FE (governance) = **Required (contracts now; visual DEFERRED)** · Customer-FE = **DEFERRED → Frontend round** · Integration = N-A · SEO = Required (tool pages indexable) · Analytics/Audit = Required.

## 2. Canonical Names & Enums
- Tables: `tools`, `toolRatings`, `toolTags` (Bible). Coupling read: `postReviews`, `postCompares` (owned by M4).
- `toolRating.dimension` = `ease_of_use · output_quality · reliability · value_for_money` (each 1–5 int or `not_applicable`).
- Functions: `tools.create`, `tools.update`, `tools.getProfile`, `tools.list`, `toolRatings.submit`, `toolRatings.update`, `toolRatings.moderate`, `tools.recomputeAggregate` (internal).

## 3. Scope & Non-Goals
- **In:** tool CRUD (operator-curated registry), tool categorization (categoryIds + toolTags), user rating submit/update (4 dims + overall, N/A support), the aggregate math, rating moderation, the tool profile read model (aggregate + editorial-verdict list, **segmented**).
- **Non-Goals:** Review/Compare **posts** (M4 owns `postReviews`/`postCompares`; M5 only provides the tool + aggregate they read); affiliate monetization (M11); user-submitted tools (operator-curated only in v1); a full review marketplace (CONSTRAINED skeleton).

## 4. Domain Context
- **Terminology:** *aggregate* = community score derived only from user `toolRatings`; *verdict* = editorial/persona opinion on `postReviews.verdictScore` (display-only, **never** in the aggregate); *dimension* = one of 4 rating axes.
- **Actors:** primary = verified member (submit/update own rating, 1/tool); operator = storeOperator/Editor (create/curate tools); moderator (moderate ratings); automated = none writes ratings.
- **Invariants:**
  - INV-1 `tools.ratingSum/ratingCount/dimensionSums/dimensionCounts` are derived ONLY from `status=active`, `moderationStatus=passed` user `toolRatings`.
  - INV-2 One active `toolRatings` per `(userId, toolId)`.
  - INV-3 `not_applicable` on a dimension increments **neither** its sum nor its count (so averages stay honest).
  - INV-4 Editorial/persona verdicts NEVER touch `tools` aggregate (they live on `postReviews`).
  - INV-5 A `toolRatings` write is accepted **only** from an authenticated human member holding **no** privileged role (editor/publisher/moderator/store_operator/support_operator/administrator) at write-time; personas cannot write (no userId). Staff opinions → `postReviews.verdictScore`, never the aggregate. Server-enforced (reject, not UI-hide).
- **Source of truth:** registry facts = `tools`; community score = derived on `tools` from `toolRatings`; editorial verdict = `postReviews`.

## 5. Dependencies & Cross-Module Contracts
| Provider | Consumer | Data shape | Trigger | Failure | Sync | Launch-block |
|---|---|---|---|---|---|---|
| M5 `tools`+aggregate | M4 Review/Compare | toolId, ratingSum/Count, dimensionSums/Counts | render | tool missing → M4 blocks Review / drops from Compare | sync | yes |
| M4 `postReviews.verdictScore` | M5 tool profile | verdictScore + byline (display-only) | render tool page | none → show "no editorial verdict yet" | sync | no |
| M11 affiliate | M5 tool | affiliateLinks by toolId | render CTA | none → no affiliate CTA | sync | no |

## 6. Data Model `[DATA][BE]`
- **tools** — `name`, `slug` (unique), `logoAssetId?: v.id('mediaAssets')`, `categoryIds: v.array(v.id('categories'))`, `pricing: v.string()`, `officialUrl: v.string()` *(platform field, not user body)*, `status: v.union('active','draft','archived')`, `ratingSum: v.number()`, `ratingCount: v.number()`, `dimensionSums: v.object({ ease_of_use, output_quality, reliability, value_for_money })` (numbers), `dimensionCounts: v.object({ …same keys })` (numbers). Index `by_slug`, `by_status`.
- **toolRatings** — `toolId`, `userId`, `overallScore: v.number()` (1–5), `dimensionScores: v.object({ ease_of_use: v.union(v.number(),v.literal('not_applicable')), output_quality: …, reliability: …, value_for_money: … })`, `reviewText: v.optional(v.string())`, `status: v.union('active','withdrawn')`, `moderationStatus: v.union('pending','passed','held','removed')`, `createdAt`, `updatedAt`. Unique `(userId, toolId)` active. Index `by_tool`, `by_user_tool`, `by_tool_moderation`.
- **toolTags** — `toolId`, `tagId`, `createdAt` (Bible join; the ONLY tag relationship).
- *Worked example:* `tools{name:'Cursor', slug:'cursor', pricing:'Free + Pro', ratingSum:180, ratingCount:42, dimensionSums:{ease_of_use:190,output_quality:198,reliability:171,value_for_money:160}, dimensionCounts:{ease_of_use:42,output_quality:42,reliability:41,value_for_money:38}}` → overall 4.29; value_for_money avg = 160/38 (4 users marked N/A).

## 7. Domain States & Lifecycle
- **tools:** `draft → active → archived` (operator).
- **toolRatings.moderationStatus:** `pending → passed | held | removed`; only `passed` feeds the aggregate. `status`: `active → withdrawn` (user removes own; decrements aggregate).
- **Precedence:** a `held`/`removed`/`withdrawn` rating is excluded from aggregate regardless of score.

## 8. Rules, Algorithms & Limits `[BE]`
- **R-AGG** (aggregate maintenance): TRIGGER rating passes moderation / is updated / withdrawn → ACTION recompute deltas on `tools` in the same mutation: `ratingSum += Δoverall`, `ratingCount += Δcount`; per dimension `dimensionSums[d] += Δ`, `dimensionCounts[d] += Δcount` (skip `not_applicable`) → PRECEDENCE only `passed`+`active` ratings counted → EDGE moderation reversal (held→passed or passed→removed) applies the corresponding delta; `tools.recomputeAggregate` (internal) can rebuild from scratch as a repair job. **Every transition (submit/edit/reject/remove/restore/withdraw) applies the prior→new eligible delta atomically in one mutation; recompute = repair-only.**
- **R-STAFF** (aggregate integrity): TRIGGER `toolRatings.submit`/`update` → CONDITION actor is a persona OR holds any privileged role (editor/publisher/moderator/store_operator/support_operator/administrator) → ACTION **server-reject** → FEEDBACK 403, errorCode `RATING_STAFF_FORBIDDEN`, userMessage "Staff opinions publish as an Editorial Verdict, not a community rating." → PRECEDENCE checked before R-AGG (nothing enters the aggregate) → EDGE a human cannot post community ratings while holding a privileged role (house speaks via editorial verdict).
- **R-ONE** (one per user/tool): `toolRatings.submit` rejects if an active rating exists → direct to `toolRatings.update`.
- **R-DAY1** (eligibility): verified member may rate from day 1 (no trust tier); moderated post-hoc (fail-open display, moderate reactively) — abuse low; `held` pulls it from the aggregate.
- **R-VERDICT** (separation): tool profile read returns `aggregate` (from `tools`) and `editorialVerdicts` (from `postReviews` by toolId) as **two labeled segments**; the aggregate computation must never include `verdictScore`.
- **Limits:** overall + each dimension 1–5 integer (no half); `reviewText` ≤2000 chars; one rating per user/tool.

## 9. Backend Operations `[BE]`
- `tools.create` / `tools.update` **(mutation, operator)** — registry curation; slug uniqueness; writes `auditLog`.
- `tools.getProfile` **(query)** — returns `{tool, aggregate:{overall, dimensions:{avg,count per dim}}, editorialVerdicts:[{postId,verdictScore,byline}], ratingsPage}`; **segmented** per R-VERDICT; honest zero-state when `ratingCount=0`.
- `tools.list` **(query)** — paginated/filterable (category, tag, search) for the directory.
- `toolRatings.submit` **(mutation)** — R-STAFF, R-ONE, R-DAY1; `moderationStatus='passed'` on submit (reactive moderation) unless auto-flag; runs R-AGG.
- `toolRatings.update` **(mutation)** — edits own rating; R-AGG delta.
- `toolRatings.moderate` **(mutation, moderator)** — hold/remove/restore; R-AGG delta; `auditLog`.
- `tools.recomputeAggregate` **(internal mutation)** — repair/reconciliation job.
- No `action` (no external calls).

## 10. Customer Frontend `[FE]` — **DEFERRED → Frontend round**
Pages this module governs (FE-round inventory): **Tool profile page** (segmented aggregate + 4-dim breakdown + editorial-verdict strip + reviews list + Compare CTA + affiliate CTA slot), **Tool browse/directory** (search/filter grid), **Rating flow** (submit/edit: overall + 4 dims + N/A toggles + optional text). Interaction contracts, zero-states, responsive & a11y = produced in the Frontend round to the design system + Apple-grade standard.

## 11. Admin & Governance `[ADMIN]`
- **Governance contracts (LOCKED):** tool CRUD (operator; audited); rating moderation (moderator: hold/remove/restore → R-AGG delta + audit). 
- **Config:** none new (uses global moderation config). 
- **Visual admin (tool table, rating-moderation queue):** DEFERRED → Frontend round; **registers to M15 Admin console.**

## 12. RBAC
| Action | visitor | member | operator | moderator | administrator |
|---|---|---|---|---|---|
| browse tools / view aggregate | ✓ | ✓ | ✓ | ✓ | ✓ |
| submit/update own **community** rating | ✗ | ✓ (verified, non-staff) | ✗ (staff → verdict) | ✗ (staff → verdict) | ✗ (staff → verdict) |
| create/edit tool | ✗ | ✗ | ✓ | ✗ | ✓ |
| moderate rating | ✗ | ✗ | ✗ | ✓ | ✓ |

## 13. Integrations
N-A (no external calls). Affiliate links attach via M11.

## 14. Analytics, Audit & Observability
- Events: `tool_viewed`, `tool_rating_submitted{overall}`, `tool_rating_updated`, `tool_rating_moderated{action}`, `compare_cta_clicked`.
- Audit: tool CRUD, rating moderation → `auditLog`.
- Monitoring: aggregate drift check (periodic `recomputeAggregate` vs stored) — alert on mismatch.

## 15. Content & Copy Contract
- Provisional (FE round): zero-rating state ("No community ratings yet — be the first to rate"), N/A helper ("Mark N/A if a dimension doesn't apply, e.g. price for a free tool"), segment labels "Community Score" vs "Editorial Verdict".
- **R4:** "Editorial Verdict" / "Community Score" labels are **fixed** (honesty-critical, per DEC-S21 spirit) — do not reword.

## 16. Edge Cases & Failure Recovery
- All 4 dims `not_applicable` → overall still required; dimension averages show "—".
- Concurrent rating submit (double) → unique rejects second; UI routes to update.
- Aggregate drift (crash mid-delta) → `recomputeAggregate` repair; drift alert.
- Tool archived with existing ratings → aggregate frozen; profile shows "archived" banner.

## 17. NFR / Security / Privacy / SEO
- Security: rating writes authz-checked; `officialUrl` is an operator/platform field (not user body) — not subject to R-URL but validated as URL.
- SEO: tool profile SSR + indexable (`status=active`); archived/draft `noindex`.
- Integrity: aggregate is the trust core — never blended with editorial (INV-4); reactive moderation keeps it clean.

## 18. Fixtures, Tests & Acceptance Criteria
- Fixtures: a tool with mixed ratings incl. some `not_applicable`; a tool with 0 ratings (zero-state); a tool with an editorial verdict (postReviews) AND community ratings (to prove segmentation).
- Tests: submit rating updates aggregate correctly (incl. N/A skipped); update/withdraw applies deltas; moderation hold removes from aggregate; one-per-user enforced; `getProfile` never blends verdict into aggregate; recompute matches incremental.
- **AC:**
  - G tool with ratingCount 41, value_for_money marked N/A by 4 users · W `tools.getProfile` · T value_for_money average = sum/(count) using dimensionCounts (excludes the 4), overall uses all 41.
  - G an editorial Review with verdictScore 4 AND 10 community ratings avg 3.1 · W profile renders · T two separate labeled segments; aggregate = 3.1 (verdict excluded).
  - G a member with an existing rating · W they `toolRatings.submit` again · T rejected; routed to update.
  - G a user who holds an operator/editor/admin role · W they call `toolRatings.submit` · T server-rejected `RATING_STAFF_FORBIDDEN`; aggregate unchanged.

## 19. Release, Migration & Rollback
- Flag: `toolRatings` write can be disabled independently (keep browse). Seed: launch tool set (operator-curated).
- Migration: add `dimensionSums/dimensionCounts` to `tools` (pre-launch, no data). 
- Rollback: Vercel + Convex; disabling ratings preserves registry + browse.

## 20. Global Projections & Open Decisions
- **Projects to:** global data model (`tools` aggregate fields, `toolRatings`), RBAC (§12), Admin console (M15: tool table + rating-moderation queue), analytics, audit.
- **Open (DEC):** `DEC-M5-ASSESS` (future) — generalize editorial verdict into a `postToolAssessments` entity if non-Review types need to assess tools (GPT's idea); v1 uses `postReviews.verdictScore`. User-submitted tools = deferred (operator-curated v1).
