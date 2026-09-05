# DECISION — M2: Content Engine (Build Sheet · BACKEND-LOCKED)

**Status:** BACKEND LOCKED · **Frontend (§10 + visual §11):** DEFERRED → **Frontend phase** · **Date:** 2026-07-28
**RACI:** R/A = Opus · Consulted/Informed = GPT/GLM/Sonnet + Founder
**Schema:** fills `M0-build-sheet-schema.md`. Canonical names = `_data-model.md`. **Pairs with `M3-rulebook.md`** (M2 runs the pipeline; M3 evaluates each candidate at the gate).

---

## 1. Header & Layer Profile
- **id:** M2 · **purpose:** the system-generated content pipeline — ingest sources → extract atomic claims → cluster (multi-source) → forge original drafts → (M3 gate) → operator review → persona comments + affiliate + SEO/social derivatives → schedule/publish. Operator-in-the-loop; nothing auto-publishes. · **owner:** Opus · **status:** backend locked.
- **dependencies (up):** M1 (users/personas/mediaAssets/systemConfig/systemJobs) · M3 (rulebook evaluation) · M4 (post.type contracts, publish target) · M5 (tools for name-match) · M11 (affiliateLinks). **(down):** M4 posts + comments (persona) · M9 feed · M13 moderation.
- **Layer Profile:** Backend/Data = **Required** · Jobs (cron/webhook) = **Required** · Integration (GLM, embeddings, YouTube API, inbound email) = **Required** · Admin-FE (source console, editorial workspace) = **Required (contracts now; visual DEFERRED)** · Customer-FE = N-A (outputs are posts, owned by M4) · SEO = Required (derivatives) · Analytics/Audit = Required.
- **SCOPE:** SYSTEM-generated content only. **User-post qualification = industry guardrails only** (NSFW/illegal + profanity, on top of DEC-P02) — NOT this engine.

## 2. Canonical Names & Enums
- Tables (Bible): `sources`, `ingestionConfigs`, `sourceItems`, `contentExtractions`, `sourceClaims`, `claimClusters`, `contentCandidates`, `contentCandidateSources`, `generationRuns`, `contentEmbeddings`, `personaCommentDrafts`, `postSeoMeta`, `postSocialDerivatives`, `postAffiliateLinks`, `takedownRequests`. Evaluation tables (owned by M3): `qualificationRules/Runs/RuleResults`, `similarityChecks`.
- Enums (Bible): `ingestionConfig.method`, `sourceClaim.claimType`, `claimCluster.status`, `contentCandidate.status`, `takedownRequest.status`.
- Functions: `sources.register`, `ingest.pollRss`, `ingest.pollYouTube`, `ingest.inboundEmail`, `ingest.rawFetch`, `extract.run`, `claims.extract`, `cluster.build`, `forge.draft`, `candidate.regen`, `candidate.review`, `candidate.approve/reject`, `persona.generateComments`, `persona.regenComment`, `affiliate.inject/remove`, `seo.generate`, `social.generate`, `candidate.schedule`, `candidate.publish`, `takedown.intake`, `takedown.action`.

## 3. Scope & Non-Goals
- **In:** source registration + ingestion (RSS/YouTube API/newsletter/raw) · extraction · claim extraction · clustering · forge · persona-comment generation (drafts) · affiliate injection mechanics · SEO + social derivative generation · scheduling · transactional publish · takedown intake.
- **Non-Goals:** the qualification RULES + similarity/traceability math (**M3**); the post structures themselves (**M4**); the tool aggregate (**M5**); the affiliate commercial model (**M11** — M2 only references `affiliateLinks`); external social posting (**out of scope**, DEC-O07); reputation (Wave 4).

## 4. Domain Context
- **Terminology:** *claim* = an atomic attributed fact (`sourceClaims`); *cluster* = claims grouped into one storyable topic across ≥2 **independent** domains; *candidate* = a draft in the pipeline; *derivative* = SEO/social output from a published post.
- **Actors:** automated = cron/webhook ingestion + GLM generation; operator = Editor/Publisher (review/edit/approve/schedule, inject affiliate, select personas); Moderator (takedown); Administrator (source policy, rule config via M3).
- **Invariants:**
  - INV-1 Forge input = `claimClusters.claimIds` only; a candidate always links its `contentCandidateSources` + `generationRuns.inputClaims` (provenance).
  - INV-2 A candidate may reach `approved` only if its latest M3 `qualificationRun.overallResult = pass` (no hard failure).
  - INV-3 Nothing publishes without an operator approval (DEC-O01/O02) — no auto-publish path exists.
  - INV-4 `postSocialDerivatives` never auto-post externally (export-only).
  - INV-5 Affiliate links never appear in `posts.body`/draft prose — only via `postAffiliateLinks` structured CTA.
  - INV-6 Persona comments are labeled AI, Publisher-approved, density-capped (≤2/post), and never claim personal experience.
- **Source of truth:** claims = `sourceClaims`; pipeline state = `contentCandidates.status`; provenance = `generationRuns` + `contentCandidateSources`.

## 5. Dependencies & Cross-Module Contracts
| Provider | Consumer | Shape | Trigger | Failure | Sync | Launch-block |
|---|---|---|---|---|---|---|
| M3 rulebook | M2 gate | `qualificationRun` {overallResult, ruleResults[]} | after forge / after edit | hard-fail → candidate not reviewable (auto-reject/regen) | sync | yes |
| GLM (action) | M2 claims/forge/persona | prompt in → structured out + generationRun | each generation | queue + operator hand-write (DEC-A09); max ~3 attempts/candidate | async | yes |
| Embedding model (action) | M3 similarity | vector | draft/claim | retry; block gate on failure (fail-closed) | async | yes |
| YouTube Data API | M2 ingest | metadata (+authorized captions) | poll | skip video; captions permission-dependent (OAuth) | async | no |
| Inbound email (webhook) | M2 newsletter | parsed HTML | on receipt | allowlist-only; drop non-allowlisted | async | no |
| M5 tools | M2 affiliate name-match | tool names/slugs | at inject | none → no affiliate | sync | no |
| M11 affiliateLinks | M2 injection | link + relationship status | at inject | expired → fallback/hide | sync | no |

## 6. Data Model `[DATA][BE]`
Per Bible. Key indexes: `sourceClaims.by_extraction`, `by_category`; `claimClusters.by_status`, `by_category_status`; `contentEmbeddings` **vectorIndex `by_embedding`** (dims per embedding model, `filterFields:[categoryId]`); `ingestionConfigs.by_method_nextPoll`; `contentCandidates.by_status`; `personaCommentDrafts.by_candidate`; `postSeoMeta.by_post`/`by_slug`; `postAffiliateLinks.by_post`/`by_post_tool`.
- *Worked example (cluster→candidate):* 3 `sourceClaims` from 2 domains → `claimClusters{status:'ready', sourceDomainCount:2}` → `forge.draft` → `contentCandidates{status:'drafting'→'review', claimClusterId, postType:'news'}` + `generationRuns{inputClaims:[…], promptVersion, model}`.

## 7. Domain States & Lifecycle
- **contentCandidate.status:** `submitted → extracting → drafting → review → approved → scheduled → published` (+ `rejected` terminal). Guards: `drafting→review` requires M3 pass (INV-2); `→approved` requires operator; `→published` transactional (§9).
- **claimCluster.status:** `pending → ready (≥2 independent domains) → drafted → exhausted`.
- **personaCommentDraft.status:** `generated → edited? → approved|rejected → published`.
- **postSocialDerivative.status:** `generated → edited? → exported`; → `stale` if the post materially changes after export.
- **takedownRequest.status:** `received → acknowledged → actioned|rejected → resolved`.

## 8. Rules, Algorithms & Limits `[BE]`
- **R-CLUSTER:** open a candidate only when a cluster has ≥2 claims from ≥2 **independent** domains (syndication detection: two extractions with very high mutual Jaccard = one origin). Single-source allowed only for first-party (announcement/docs/release-notes) with operator ack.
- **R-FORGE:** GLM synthesizes from `claimClusters.claimIds`; prompt forbids reusing source wording and instructs reorganized framing; records `generationRuns.inputClaims`. **Every factual assertion emits explicit `sourceClaimId[]` citations → `draftClaimRefs`** (grounded citation; M3 H-TRACE validates). Never emit URLs (DEC-M4-URL).
- **R-GATE:** after forge AND after any material operator edit call M3 `qualify(candidate)`; hard fail → **auto-reject (terminal for the revision — claims/evidence/results/reason preserved, never deleted)** or return to `drafting` for regen; soft flags attach for the operator. **Re-run URL + similarity hard checks at the publish mutation** (operator edits can reintroduce URLs/copy). (See M3.)
- **R-PERSONA:** generate 0–2 persona comments **post-approval**, category-matched, distinct personas, ≤~150 words, no personal experience (pattern-check backstop), regen = new `generationRuns` (prior retained); density cap **≤2 enforced at publish mutation** (non-overridable); staggered publish timestamps; publishes into `comments` (authorType=persona) via M4/M6.
- **R-AFFILIATE:** operator-only, post-approval; eligible only if the tool is **already name-matched in the draft** AND has an active `affiliateRelationship`; cap ≤2/post + ≤1/tool enforced in mutation; stored in `postAffiliateLinks` (structured CTA, `rel="sponsored nofollow noopener"`); **never in prose**; affiliate-fit (M3 soft) never affects publication.
- **R-SEO:** generate from the FINAL approved revision; self-canonical; structured data templated per `post.type`; **`AggregateRating` schema uses ONLY community `tools.ratingSum/ratingCount`, never an editorial verdict** (DEC-M2-SCHEMA).
- **R-SOCIAL:** derivatives are export-only; `social.export` records who/when; no external API post exists.
- **R-COST:** per-source + global ingest budgets; hash dedup (no GLM on unchanged); draft only after cheap deterministic pre-checks; embeddings cached by `textHash`; max ~3 GLM attempts/candidate (config).
- **R-SSRF (ingestion fetch safety):** all server-side fetches (raw/RSS/API) run through an isolated egress-controlled fetcher — normalize URL, HTTPS-only, resolve DNS + **reject private/reserved/link-local/loopback/cloud-metadata IPs**, revalidate the resolved IP on **every redirect hop**, cap redirects + response size, block credentials + nonstandard ports. Validated at source registration AND at each fetch.
- **R-LIMIT (fan-out/cost ceilings):** hard config ceilings on source-item fan-out, extraction bytes, claims/extraction, candidate sources, GLM attempts/candidate, embedding comparisons, redirects, **candidates/source/day**, **regen/candidate**; every retry uses an **idempotency key** + terminal failure state (no unbounded loops).
- **Limits (config `systemConfig`):** poll intervals (RSS ~6h, YouTube daily), rate-limit (raw ~1 req/5–10s/domain), freshness window (~7d), GLM attempt cap, persona cap (2), affiliate caps (2 / 1-per-tool).

## 9. Backend Operations `[BE]`
- Ingestion (**scheduled `action`s + cron**): `ingest.pollRss`, `ingest.pollYouTube`, `ingest.rawFetch` (robots-gated **+ R-SSRF egress-controlled fetch**), `ingest.inboundEmail` (webhook `httpAction` — **SPF/DKIM/DMARC-verified + allowlisted senders**) → create `sourceItems` + `contentExtractions` (hash dedup, idempotent).
- `claims.extract` **(action, GLM)** → `sourceClaims`. `cluster.build` **(mutation/query)** → `claimClusters`.
- `forge.draft` **(action, GLM)** → `contentCandidates.draft` + `generationRuns` + **`draftClaimRefs` (per-assertion `sourceClaimId[]` citations)**; then triggers M3 `qualify`.
- `candidate.regen` **(action)** · `candidate.review/approve/reject` **(mutation, operator)**.
- `persona.generateComments` / `persona.regenComment` **(action, GLM)** → `personaCommentDrafts`.
- `affiliate.inject/remove` **(mutation, operator)** — R-AFFILIATE.
- `seo.generate` / `social.generate` **(action, GLM)** → `postSeoMeta` / `postSocialDerivatives`.
- `candidate.schedule` **(mutation)**; `candidate.publish` **(mutation, transactional, idempotent** via idempotency key — safe against double-submit**)** → **re-runs URL + similarity hard checks**, then creates `posts` (authorType=editorial/persona per DEC-A01) + `postRevisions` + `postSources` + links `postSeoMeta` + `postAffiliateLinks` + publishes approved persona `comments` (staggered) + indexes body embedding.
- `takedown.intake` **(httpAction/mutation)** · `takedown.action` **(mutation, moderator)** — block source, re-evaluate linked candidates/posts (keep if ≥2 other independent sources, else archive), `auditLog`.
- **Env vars:** `GLM_API_KEY`, `EMBEDDING_API_KEY`, `YOUTUBE_API_KEY`, inbound-email secret. **Cron:** per-method ingest polls; scheduled publish; embedding backfill.

## 10. Customer Frontend `[FE]` — N-A (outputs are M4 posts). Admin surfaces below.

## 11. Admin & Governance `[ADMIN]`
- **Governance contracts (LOCKED):**
  - **Source console** (Admin/Publisher): register/edit sources + `ingestionConfigs` (method, cadence, rights basis, robots status); audited.
  - **Editorial workspace** (Editor/Publisher): review candidate with draft + claim evidence + `similarityChecks` + `qualificationRuleResults` + source conflicts; edit / regen / approve / reject / schedule; inject affiliate; select + regen + edit persona comments.
  - **Takedown queue** (Moderator): intake → action; re-evaluation of linked content.
- **Config registry (`systemConfig`):** ingest budgets, poll intervals, rate limits, GLM attempt cap, freshness window, persona cap, affiliate caps, embedding dims/model, allowlists (newsletter senders). (Rule thresholds live in M3 `qualificationRules`.)
- **Visual admin layout:** DEFERRED → Frontend phase; **registers to M15 Admin console.**

## 12. RBAC
| Action | member | Editor | Publisher | Moderator | Admin |
|---|---|---|---|---|---|
| register/edit source | ✗ | ✗ | ✓ | ✗ | ✓ |
| review/edit/regen candidate | ✗ | ✓ | ✓ | ✗ | ✓ |
| approve/schedule/publish | ✗ | ✗ | ✓ | ✗ | ✓ |
| inject affiliate | ✗ | ✓ | ✓ | ✗ | ✓ |
| select/edit persona comments | ✗ | ✓ | ✓ | ✗ | ✓ |
| takedown action | ✗ | ✗ | ✗ | ✓ | ✓ |

## 13. Integrations
- **GLM** (claims/forge/persona/SEO/social) — action; timeout + retry; queue + operator hand-write fallback (DEC-A09); record prompt+model+version (DEC-A12); only public source text + prompts, no user PII (DEC-A11).
- **Embedding model** — action; fail-closed (block gate on failure).
- **YouTube Data API v3** — metadata cheap; captions require OAuth/permission (NOT an open transcript API); no page scraping.
- **Egress fetch service** — all raw/RSS/API fetches via an SSRF-safe, egress-controlled fetcher (R-SSRF): IP validation, HTTPS-only, redirect revalidation, size/hop caps.
- **Inbound email** (Resend/Postmark/CF Email Workers) — **SPF/DKIM/DMARC-verified** + authenticated webhook + allowlisted senders; strip tracking pixels; reject attachments.

## 14. Analytics, Audit & Observability
- Events (server): `source_registered`, `item_ingested{method}`, `claims_extracted{count}`, `cluster_ready`, `candidate_forged`, `candidate_gated{result}`, `candidate_approved/rejected`, `persona_comment_generated/regen`, `affiliate_injected`, `derivative_generated`, `candidate_published`, `takedown_received/actioned`.
- Audit (`auditLog`): source policy changes, approvals, affiliate injections, takedowns, publishes.
- Monitoring: ingest success/failure per source, GLM cost/attempts per candidate, gate reject rate, source-diversity (domain concentration), embedding failures.

## 15. Content & Copy Contract
- **R4 (no-invent):** AI-disclosure/byline (DEC-A01), persona AI label, affiliate disclosure (DEC-S21), `/how-we-use-ai` page copy = **fixed**; coding agent must not reword.
- Provisional (FE phase): workspace labels, operator prompts, source-console copy.

## 16. Edge Cases & Failure Recovery
- GLM failure mid-forge → candidate stays `drafting`, error surfaced, no partial publish; retry ≤ cap then operator hand-write.
- Embedding failure → gate is fail-closed (candidate cannot pass) until resolved.
- Source removed (takedown) after publish → keep post if ≥2 other independent sources remain (drop the source from `postSources`); else archive + operator review.
- Duplicate source item (hash) → skipped idempotently.
- **Auto-reject is terminal for the revision, not deletion** — claims, extraction evidence, `qualificationRuleResults`, and rejection reason are preserved (legal audit); operator can create a new revision.
- Persona **density decrement counts only publicly-visible** persona comments, recalculated transactionally on removal/restoration (no slot drift).
- Persona regen failure → keep previous comment, show error, never blank.
- Derivative post-export, post changes materially → mark `stale`.

## 17. NFR / Security / Privacy / SEO
- Security: ingestion respects robots/ToS + rate limits; **never bypass paywalls/auth/bot controls / rotate proxies**; inbound email SPF/DKIM-verified + allowlisted + sanitized. **SSRF-safe fetch (R-SSRF):** HTTPS-only, resolve + reject private/link-local/loopback/metadata IPs, revalidate every redirect hop, cap size/hops, isolated egress. **OG/media imagery is platform-generated or operator-uploaded — NOT source-scraped** (own rights basis).
- Legal: per-source **rights basis**; robots ≠ license; **AI synthesis ≠ automatic fair use** — takedown/correction path (DEC-P16); legal review for systematic ingestion.
- Privacy: only public source text + prompts to GLM; no user PII (DEC-A11).
- SEO: derivatives from final revision; self-canonical; **schema rating integrity (DEC-M2-SCHEMA)**; no fake dates/expertise/FAQ/keyword-stuffing.

## 18. Fixtures, Tests & Acceptance Criteria
- Fixtures: an RSS source + a YouTube source + a newsletter source; extractions → claims → a 2-domain cluster → a forged candidate; a candidate that hard-fails the gate; an approved candidate with 2 persona drafts + 1 affiliate injection + SEO meta.
- Tests: ingest dedup (hash) · claims extraction shape · cluster requires ≥2 independent domains · forge records inputClaims · gate hard-fail blocks review · persona cap enforced at publish · affiliate cap (2 / 1-per-tool) + name-match required · no-URL in draft · transactional publish creates all linked rows · takedown re-evaluation logic · social derivative never auto-posts.
- **AC:**
  - G a cluster with claims from a single domain · W `cluster.build` · T status stays `pending` (no candidate) until a 2nd independent domain.
  - G an approved candidate with 2 persona drafts · W operator adds a 3rd · T publish mutation rejects (cap 2).
  - G a forged draft containing a verbatim source paragraph · W gate runs · T hard-fail (similarity), not reviewable.
  - G a Review post with a community aggregate + an editorial verdict · W `seo.generate` · T `AggregateRating` schema uses the community aggregate only.

## 19. Release, Migration & Rollback
- Flags (DEC-L06): `contentEngine`, `personas`, ingestion-per-source, affiliate-injection — independently disable-able.
- Migration: seed `qualificationRules` (M3) + `systemConfig` budgets; no production content pre-launch.
- Rollback: Vercel + Convex; disabling the engine leaves published posts intact.

## 20. Global Projections & Open Decisions
- **Projects to:** global data model (pipeline tables), RBAC (§12), Admin console (M15: source console + editorial workspace + takedown queue), analytics, audit, config.
- **Open (DEC):** `DEC-M2-SCHEMA` (schema-rating integrity) recorded in `_index`; embedding model + dims = CONSTRAINED (confirm at build); similarity thresholds = M3 config (calibrate first ~100); `/how-we-use-ai` disclosure page = required pre-launch.
- **Cross-module contract (confluence):** persona-authored comments MUST be **excluded from all engagement/ranking signals** (M9 feed, M12 leaderboard) — no astroturfing leak. Confluence-added: `draftClaimRefs` grounded citation (DEC-M2-GROUND), quotation gate (DEC-M2-QUOTE), SSRF-safe egress (DEC-M2-SSRF).
