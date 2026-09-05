# SLICE CATALOG — BUILD PHASE 4: CONTENT CORE

**Date:** 2026-08-29 · **Phase order source:** AUDIT-FINAL.md Part D (corrected build order)
**Basis:** `CAPABILITY-REGISTER-MERGED.md` (569 rows) · `_data-model.md` · Wave 2/3/4 contracts (compose, post-detail, tool-directory, tool-profile, rulebook, sources, editorial, affiliate-inventory) · AUDIT-FINAL Part D
**Sizing-rule addendum applied:** every cited bullet checked for ellipsis/`{…}`/"see X" incompleteness. **Zero true ellipsis cases this phase** — both initial catches resolved on closer inspection as the lower-risk "sheet also happens to have it" class, not P1-01b-class discovery-cost multipliers: (1) the M4 bullets (`posts` l.76 + all 8 extensions l.86–97) are complete inline field lists; the `type (post.type enum)` reference resolves in the same file's Core-enums block (l.351), same discipline as any enum reference. (2) all cited M2/M3 entities (l.147–168) are complete inline bullets — the contract "fields in play" lists are render projections of complete bible definitions, not the source of truth. The one genuine cross-reference found: `postAffiliateLinks.labelType` → `banner.labelType` (l.168 → l.384) — same-file, two lines apart, a normal enum reference, not a risk flag. P4-01 and P4-08 are true "transcription only, low risk" slices; ≤2 days holds without qualification.
**Tagging (this firing and the 2026-08-29 SF-02 addendum):**
- **`[BIBLE-FIX — apply now]`** — a `_data-model.md` edit this slice’s own description requires. Apply in the same session. Do **not** park it as “described in the catalog.”
- **`[CODE — Phase 5 build]`** — anything requiring actual files. Describe fully. **Do not create the file in this catalog session.**
**Phase boundary:** the content pipeline (posts, tools, rulebook+qualify, ingestion→forge→editorial, affiliate chain) **plus `/p/[slug]` Post Detail** (SF-02, 2026-08-29 — P4-13/14/15). The moderation STUB (CAP-321–328 subset) is pulled forward here so posting gates work; the full M13 console is Phase 7. Personas/discussion/M7-full are Phase 5 — **P5-01/02/03 enrich this screen; they now depend on P4-13.** Feed is Phase 6 (consumes CAP-091).

---

## SLICE-P4-01 — M4 post spine schema (posts + 8 extension tables + postTypeConfig + postRevisions + postTags)
- **CAP-IDs covered:** substrate for CAP-086/088/104/105/530/531/532/534 — schema only
- **Source contract(s):** `contracts/wave-2/CONTRACT-2-compose-FINAL.md` (§2 Entities, §3 B typed-form fields)
- **Depends on:** SLICE-P1-01a (users/roles), SLICE-P1-02 pattern (schema+back-fill discipline)
- **Scope:** Define `posts` + the 8 extension tables (`postNews` excluded from member writes but schema-defined for M2 injection; `postLaunchPads`/`postGigs` defined, locked at runtime), `postTypeConfig`, `postRevisions`, `postTags`, `tags`. Bible bullets are self-sufficient: `posts` (l.76) and all 8 extensions (l.86–97) are complete inline field lists — no ellipsis, no discovery-cost multiplier. `type (post.type enum)` resolves in the Core-enums block (l.351). No sheet cross-reference required.
- **Files touched (expected):** `convex/schema.ts` (M4 region); `_data-model.md` (enum block + revision log)
- **Acceptance criteria:** CAP-086 Notes (quoted): "inserts posts + matching extension row transactionally (1:1)" — schema enforces the 1:1 (extension carries unique post FK). The 7 member-composable types (quoted): `review · compare · help · spark · debate · list · showcase`; news excluded from composer Writes (W2-E1), locked types hidden (CAP-104). `postReviews` carries NO member-writable `verdictScore` path (W2-E4: computed same-transaction / editorial CAP-535 — schema field exists but is not member-settable; enforced in P4-02's mutation, representable here). `postTags` join only — no `tagIds[]` anywhere (quoted: "canonical tag relations use `postTags` join only").
- **Size check:** ≤2 days — ~11 tables but pure transcription; one bible enum-copy block.

## SLICE-P4-02 — posts.create / posts.update + R-URL + draft save (+ My Drafts)
- **CAP-IDs covered:** CAP-086, CAP-087, CAP-088, CAP-012, CAP-531, CAP-532 · CAP-105 *(added 2026-09-04 — orphan disposition: composer's postTypeConfig.list read that hides locked types)*
- **Source contract(s):** `contracts/wave-2/CONTRACT-2-compose-FINAL.md` (§1–§4)
- **Depends on:** SLICE-P4-01 (schema), SLICE-P2-03 (assertCustomerCapability — capability key `create_post`), SLICE-P1-09 (rate limit 402 pattern **including CAP-013 media.upload**)
- **Scope:** Implement the transactional create/update mutations with the full gate chain (R-TYP, R-URL, R-GATE, INV-2), the verdictScore auto-compute (average of per-dimension scores, `value_for_money` excluded when `not_applicable`), draft save (same `lifecycleStatus=draft` field, three entry triggers — CAP-531's own note), and the My Drafts filtered list. Composer UI: type-select + 7 typed forms; `/compose/[type]` param validation fenced as open (contract OQ6). **CAP-012 `generateUploadUrl`:** capabilityMutation; flag+MIME+size bounds from `configKeyRegistry`; writes `mediaAssets`. **CAP-013** (5/1h per user) wraps it via P1-09 — do not invent a second limiter. P4-12 **consumes** this helper for affiliate logos; do not fork.
- **Files touched (expected):** `convex/posts.ts` (create/update/draft); `app/compose/` routes
- **Acceptance criteria:** CAP-086 Notes (quoted): "Auth required; runs R-TYP, R-URL, R-GATE, INV-2; inserts posts + matching extension row transactionally (1:1)." CAP-087 Notes (quoted): "`authorType='user'` AND body matches https?://, www., bare domain.tld, or obfuscation … AND field ≠ postShowcases.projectUrl → reject 422 `POST_URL_NOT_ALLOWED`. Runs before persistence + before moderation." CAP-012 Notes (quoted): "capabilityMutation; flag+MIME+size bounds checked." CAP-531 Notes (quoted): "there is one draft state with three possible entry triggers, not three parallel draft systems." verdictScore per W2-E4 (quoted): "auto-computed same-transaction as the average of submitted per-dimension scores (excluding value_for_money when not_applicable)". My Drafts filters `lifecycleStatus=draft` AND `authorUserId=self` (CAP-532, field corrected `ownerId`→`authorUserId`). Eligibility-incomplete → preserve draft + return missing decisions (CAP-140 integration point; the M7 eligibility machine itself is Phase 5 — this slice asserts the CAP-393 guard with the guard's no-eligibility-data fail posture per SLICE-P2-03, and wires the extension point).
- **Size check:** ≤2 days — two mutations + one list query + composer forms; the tag picker (CAP-530/534) is deliberately P4-03, keeping this slice at the core create path.

## SLICE-P4-03 — Tags: taxonomy exposure + member tag set/edit
- **CAP-IDs covered:** CAP-530, CAP-534
- **Source contract(s):** `contracts/wave-2/CONTRACT-2-compose-FINAL.md` (§2 Tags, §4 Action 7)
- **Depends on:** SLICE-P4-01 (postTags/tags schema), SLICE-P4-02 (compose/edit surface to embed the picker in)
- **Scope:** Implement the controlled taxonomy read (CAP-534) and the member tag set/edit mutation (CAP-530) constrained to taxonomy entries — select-from-list picker in compose/edit, prefill on edit. Admin-side taxonomy editing rides the register's Admin-Config flag ("YES — taxonomy entries editable by admin") — console wiring lands with Phase 3's typed-config pattern via a config-registry key; no new screen this phase.
- **Files touched (expected):** `convex/tags.ts`; composer tag-picker component
- **Acceptance criteria:** CAP-530 Notes (quoted): "Tags via `postTags` join only, no `tagIds[]` … selection is constrained to the controlled `tags` taxonomy exposed by CAP-534 — select-from-list, not free text." CAP-534 Notes (quoted): "`tags` is the data-model Bible name (`tags` — controlled taxonomy: slug, name, tagType, color, sortOrder, status)." Free-text tag submission rejected server-side (taxonomy constraint is server-enforced, not UI-only).
- **Size check:** ≤2 days comfortably — one read, one join-write, one picker.

## SLICE-P4-04 — Tools: registry backend + /tools + /tools/[slug]
- **CAP-IDs covered:** CAP-108, CAP-109, CAP-110, CAP-111, CAP-118 (+ CAP-119 archive handling in `tools.update`)
- **Source contract(s):** `contracts/wave-2/CONTRACT-2-tool-directory-FINAL.md` · `contracts/wave-2/CONTRACT-2-tool-profile-FINAL.md`
- **Depends on:** SLICE-P4-01 (categories/tags from P1-08 seed), SLICE-P1-05 (getFlag for CAP-468-gated indexability), SLICE-P2-03 (customer guard for rating surfaces — ratings themselves are P4-05)
- **Scope:** Define `tools`/`toolTags`/`toolRatings` schema; implement `tools.create`/`tools.update` (Editor), the directory query (paginated, filterable by category/tag/search), the profile query with its two labeled segments (aggregate vs editorialVerdicts, honest zero-state), SSR render with FATAL-M17-01 posture. Ratings submit/update/withdraw are P4-05 — this slice ships the profile with zero-state aggregates.
- **Files touched (expected):** `convex/schema.ts` (M5 region); `convex/tools.ts`; `app/tools/` routes
- **Acceptance criteria:** CAP-110 Notes (quoted): "Returns {tool, aggregate, editorialVerdicts, ratingsPage}; TWO labeled segments — aggregate (from tools) vs editorialVerdicts; honest zero-state when ratingCount=0" and editorialVerdicts read from "tools editorialVerdict* fields (CAP-535's write target)". CAP-111 FATAL note (quoted): "/tools directory indexability unspecified = noindex by default (fail-closed pattern) until an explicit capability states otherwise." CAP-118 FATAL note (quoted): "Indexability gated behind CAP-468 … Page ships noindex in Wave 2, flips to indexable only when CAP-468 ships in Wave 7 — same-wave pairing required by FATAL-M17-01, never separated." CAP-119 (quoted): "Aggregate frozen; profile shows 'archived' banner."
- **Size check:** ≤2 days — two mutations, two queries, two screens with SSR + noindex posture. Flag if tool-profile's rating segment templating creeps (it must render zero-state only this slice).

## SLICE-P4-05 — Tool ratings: submit/update/withdraw + R-AGG + recompute + auto-flag case write
- **CAP-IDs covered:** CAP-112, CAP-113, CAP-117, CAP-115, CAP-116, CAP-533, CAP-535
- **Source contract(s):** `contracts/wave-2/CONTRACT-2-tool-profile-FINAL.md` (rating form + aggregate invariants)
- **Depends on:** SLICE-P4-04 (tools + toolRatings schema + profile surface), SLICE-P1-03 (moderationCases schema — CAP-533's target), SLICE-P2-03 (customer guard)
- **Scope:** Implement `toolRatings.submit` with the full rule set (R-STAFF persona/privileged rejection 403 `RATING_STAFF_FORBIDDEN`, R-ONE, R-DAY1, N/A semantics), same-mutation aggregate deltas (R-AGG), edit with prior→new eligible delta, withdraw with decrement, the internal recompute job + drift alert, CAP-533's System auto-flag (threshold-breach → moderationCases target=toolRatings row), and CAP-535's curated editorial verdict write (Editor actor, tools.editorialVerdict* fields).
- **Files touched (expected):** `convex/toolRatings.ts`; drift-monitor internal job
- **Acceptance criteria:** CAP-112 Notes (quoted): "R-STAFF rejects personas + any privileged role (server-side, 403 `RATING_STAFF_FORBIDDEN`); R-ONE rejects if active exists; moderationStatus=passed on submit (reactive) unless auto-flag; R-AGG delta applied same mutation; N/A increments neither sum nor count." CAP-113 (quoted): "Prior→new eligible delta applied atomically." CAP-533 (quoted): "System flags on threshold breach (velocity/outlier pattern), `moderationCases` targeting the `toolRatings` row … exact formula deliberately unspecified" — formula is a config-driven threshold, not invented; stop and report if the config key set proves under-specified. CAP-114's aggregate-exclusion rule binds the recompute (quoted): "held/removed/withdrawn excluded from aggregate regardless of score."
- **Size check:** ≤2 days — three member mutations + one internal job + one editorial write; the R-AGG delta discipline is the precision item and is one tested code path.

## SLICE-P4-06 — M3 rulebook schema + CAP-536 seed + /admin/rulebook editor
- **CAP-IDs covered:** CAP-084, CAP-085, CAP-536, CAP-537
- **Source contract(s):** `contracts/wave-3/CONTRACT-3-rulebook-FINAL.md` (§1–§6)
- **Depends on:** SLICE-P3-01 (shell entry), SLICE-P3-04 (A1 rule list), SLICE-P1-05 (configKeyRegistry as authoritative bounds owner), SLICE-P1-06 (audit writer), SLICE-P1-08 (deploy-seed pattern)
- **Scope:** Define `qualificationRules`, `qualificationRuns`, `qualificationRuleResults` (with the live/replay `source` discriminator), `calibrationExamples`. Implement CAP-536's deploy seeder (all 7 tunable rows, baked defaults, once). Build the console: list, enable/tune via `rulebook.setRuleConfig` (bounds validated against `configKeyRegistry` — E1), calibration-set curation (CAP-537), calibrate replay trigger. H-TYPE's editor is the per-type required-field list editor (structural, E2), NOT a numeric slider.
- **Files touched (expected):** `convex/schema.ts` (M3 region); `convex/rulebook.ts`; seeder; `/admin/rulebook` page
- **Acceptance criteria:** CAP-536 Notes (quoted): "Without this, /admin/rulebook renders empty at first launch. Runs once at deploy/migration, not user-triggered." CAP-084 E1 (quoted): "bounded-range validated **against `configKeyRegistry`** … out-of-bounds → reject; audited." CAP-085 E4 (quoted): calibrate writes "`qualificationRuleResults` with **`source=replay`** — segregated from CAP-083's immutable `source=live` stream by the source discriminator." CAP-537 (quoted): "add/edit `calibrationExamples` … distinct action from triggering calibrate." H-TYPE E2 (quoted): "a **per-type required-field list editor**, not a numeric slider." Sealed-keys zero-intersection verified (contract §1: this screen's Writes never touch systemConfig/configKeyRegistry).
- **Size check:** ≤2 days — schema + seeder + list/edit + two calibration actions. The replay execution itself is P4-07 (needs the qualify orchestrator); this slice's calibrate trigger wires the admin action to the internal function stub interface.

## SLICE-P4-07 — M3 qualify orchestrator + live/replay split (two distinct write paths)
- **CAP-IDs covered:** CAP-064, CAP-083, CAP-085 (replay path), CAP-068, CAP-070, CAP-071, CAP-072, CAP-074 (the five H-rule evaluators) · CAP-065, CAP-066, CAP-067, CAP-069, CAP-073, CAP-075, CAP-076, CAP-077, CAP-078, CAP-079, CAP-080, CAP-081, CAP-082 *(added 2026-09-04 — orphan disposition: ALL M3 hard-rule qualify checks [H-SRC, H-SUF, H-TRACE, H-SIM, H-SAFE, H-DISC, H-AFF, H-EXP] and all five soft scores [S-DISC, S-VAL, S-SEO, S-READ, S-AFF] run inside this orchestrator — FINAL-HOLISTIC-AUDIT noted P4-07 omitted 13 M3 rule IDs; they are now owned here)*
- **Source contract(s):** `contracts/wave-3/CONTRACT-3-rulebook-FINAL.md` (§2 entities table, §4 Action 3)
- **Depends on:** SLICE-P4-06 (rules + registry bounds + calibrationExamples), SLICE-P4-01 (postTypeConfig reads for H-TYPE), vector index on contentEmbeddings (defined in this slice's schema work — embeddings writer is P4-09)
- **Scope:** Implement `qualify` as the orchestrator with the **live/replay split as two distinct write paths sharing the table's schema** — LIVE path (CAP-064→CAP-083): called synchronously from forge completion, writes immutable `qualificationRuns` + `qualificationRuleResults` (`source=live`) + the `contentCandidates.evaluation` snapshot; REPLAY path (CAP-085): admin-triggered, replays calibrationExamples against candidate rule configs, writes `source=replay` rows — never touching live rows' immutability. Implement the five H-rule evaluators as typed code reading thresholds from `qualificationRules`: H-QUOTE caps, H-SIM (vectorSearch cosine), H-DUP (semantic+surface), H-CAT (category confidence), H-TYPE (per-type structural contract, 8/8 mapped per E2).
- **Files touched (expected):** `convex/qualify/` (orchestrator + evaluators + replay)
- **Acceptance criteria:** CAP-064 Notes (quoted): "runs hard then soft; fail-closed on any dependency error; immutable run + results written." CAP-083 E4 (quoted): "`source=live` rows (real qualification runs) are permanently immutable. This does not restrict `source=replay` rows, which are CAP-085's calibration domain." CAP-085 E4 (quoted): "Actor remains System (the replay execution), triggered by an admin action — this is intentional, not a mismatch: admin initiates, system executes and writes." H-TYPE mapping (quoted): "News→source; Review→tool+verdict; Compare→2–4 tools; Debate→proposition; List→items; Showcase→metadata … Help→problemStatement; Spark→statement (≤280 chars)." A replay run can never mutate or delete a live row (segregation enforced at the write-path level, not by convention).
- **Size check:** ≤2 days, full — five evaluators + orchestrator + replay is the biggest single slice in this phase. The split keeps it coherent (shared schema, two paths, one immutability rule). If H-SIM's vectorSearch wiring proves >0.5 day beyond estimate, split evaluators (H-QUOTE/DUP/CAT/TYPE) from vector work (H-SIM) — flagged, not pre-split.

## SLICE-P4-08 — Ingestion: sources console + pollers + claims.extract + cluster.build
- **CAP-IDs covered:** CAP-031, CAP-538, CAP-032, CAP-033, CAP-034, CAP-035, CAP-036, CAP-037 · CAP-061, CAP-062, CAP-063 *(added 2026-09-04 — orphan disposition: ingest fetch/extraction/fan-out cost budgets + ceilings enforced at this slice's pollers)*
- **Source contract(s):** `contracts/wave-4/CONTRACT-4-sources-FINAL.md` (§1–§4) · register CAP-036/037 rows
- **Depends on:** SLICE-P3-01/04 (shell + A1), SLICE-P1-10 (safeFetch for R-SSRF + polls), SLICE-P1-04 (jobCatalog registration for crons), SLICE-P1-06 (audit)
- **Scope:** Define `sources`/`ingestionConfigs`/`sourceItems`/`contentExtractions`/`sourceClaims`/`claimClusters`/`contentCandidateSources` schema. All cited entities are complete inline bible bullets (l.147–158) — confirmed complete, not merely contract-rendered; `qualificationRules`/`Runs`/`RuleResults`/`calibrationExamples` likewise (l.160–163, consumed by P4-06/07). The single cross-reference `postAffiliateLinks.labelType` → `banner.labelType` (l.168 → l.384) is a normal same-file enum reference, not a risk flag. Build `/admin/sources` (list via CAP-538, register/edit via CAP-031 with R-SSRF ingress validation, minimal block/unblock toggle — trustLevel incl. `blocked`). Implement the four pollers as registered crons (rss/youtube/rawFetch/newsletter-inbound), `claims.extract` (GLM action, per-source + global budget per R-COST), `cluster.build` (≥2 claims from ≥2 independent domains; syndication detection). CAP-031's mutation name is register-unnamed (contract OQ1) — named `source.upsert` in-slice, flagged.
- **Files touched (expected):** `convex/schema.ts` (M2 region); `convex/sources.ts`; `convex/ingest/` (pollers + extract + cluster); `/admin/sources` page
- **Scope fence:** `robotsStatus`/`rightsBasis` value sets are undefined (contract OQ5/OQ6) — stored as free-form enums with the fields present, values seeded conservatively; stop-and-report if a poller's behavior depends on an undefined value's semantics.
- **Acceptance criteria:** CAP-031 R-SSRF (quoted via contract §3): "HTTPS-only; reject private/reserved/link-local/loopback/cloud-metadata IPs; revalidate IP each redirect hop; cap redirects + size; block creds + nonstandard ports." CAP-538 (quoted): "the table-load query … without it the console has nothing to render." CAP-037 Notes (quoted): "Requires ≥2 claims from ≥2 INDEPENDENT domains (syndication detection); single-source only first-party + operator ack." CAP-036 (quoted): "Per-source + global budget enforced (R-COST)." Block/unblock per E2 (quoted): "minimal block/unblock toggle now — CAP-031 writes `sources.trustLevel` including `blocked`"; the CAP-059 legal-takedown wiring stays Phase 7.
- **Size check:** ≤2 days, borderline — schema (7 tables) + console + 4 pollers + 2 GLM actions. If the pollers' per-method wiring creeps, split console+schema (this slice) from pollers (follow-on); flagged with the split line drawn at "console renders + one poller (rss) live" = shippable.
- **FATAL-adjacent flag:** R-SSRF is the security boundary on all ingestion. Acceptance quotes it exactly; any poller accepting a URL not passing P1-10's safeFetch is a blocker, not a refactor.

## SLICE-P4-09 — Forge: forge.draft + grounded citations + editorial review workspace (CAP-041/542/543 core)

> **UNBLOCKED 2026-09-04 — DECISIONS-LOCKED #10:** A10 interaction contract approved — two-pane layout (draft left, source evidence right, click-a-claim syncs highlighting), Approve disabled until every claim checked once, mobile = Draft/Evidence tabs. Acceptance criteria updated accordingly; the screen-sheet NEEDS HUMAN REVIEW flag for A10 is retired.
- **CAP-IDs covered:** CAP-038, CAP-039, CAP-040, CAP-041, CAP-542, CAP-543, CAP-045
- **Source contract(s):** `contracts/wave-4/CONTRACT-4-editorial-FINAL.md` (§1–§4 — the B3a top-5 precision contract)
- **Depends on:** SLICE-P4-08 (clusters exist), SLICE-P4-07 (qualify — CAP-040 calls it synchronously), SLICE-P3-05 (A12 queue board), SLICE-P3-06 (datetime picker for P4-11 scheduling; not this slice)
- **Scope:** Implement `forge.draft` (GLM action on ready cluster; prompt forbids source-wording reuse; records inputClaims; never emits URLs), `draftClaimRefs` per-assertion citation mapping (CAP-039). Build the editorial workspace: queue on A12, evidence review panes (draft + claims + similarity + rule results + source conflicts), CAP-542 per-claim confirm/reject, CAP-543 manual draft edit with the **full reset rule** (material commit → CAP-045 re-qualify → ALL `draftClaimRefs.operatorConfirmed=false`). The A10 evidence/diff panel is this slice's known archetype gap — v1 = synchronized three-pane layout composed from §11 primitives, flagged not invented.
- **Files touched (expected):** `convex/forge.ts`; `convex/editorial/` (review workspace mutations); `/admin/editorial` page
- **Acceptance criteria:** CAP-038 Notes (quoted): "Synthesizes from claimClusters.claimIds; prompt forbids source wording reuse; records inputClaims; never emits URLs." CAP-039 (quoted): "every factual assertion → sourceClaimId[]; M3 H-TRACE validates." CAP-043 gating (quoted): "**Must not be possible while any `draftClaimRef` on the candidate has `operatorConfirmed=false` or unset** (server-enforced; UI disable is not sufficient)." CAP-543 reset (quoted): "resets ALL `draftClaimRefs.operatorConfirmed` on this candidate to `false` … Prior confirmations do not survive the edit." CAP-045 (quoted): "Re-calls M3 `qualify` after any material edit … triggered by CAP-543." Editor attempting Publisher actions rejected server-side (§1: "must be unavailable / server-rejected unless the Editor also holds Publisher authority").
- **Size check:** ≤2 days, borderline-flagged — this is the fail-closed entailment loop the user's scrutiny point #2 names. Kept coherent by excluding approve/reject/schedule (P4-10) and inject/publish (P4-11/12). If evidence-pane synchronization proves heavy, the A10 v1 degrades to tabbed panes (no data-model change), keeping the fail-closed chain intact.
- **FATAL-adjacent flag:** the entailment loop (042/543→045→542→043) is the integrity spine. Its acceptance criteria are all direct quotes; any relaxation (e.g., partial reset) is a blocker.

## SLICE-P4-10 — Editorial decisions: approve / reject / schedule + persona-comment regen
- **CAP-IDs covered:** CAP-042, CAP-043, CAP-044, CAP-048, CAP-054
- **Source contract(s):** `contracts/wave-4/CONTRACT-4-editorial-FINAL.md` (§4 Actions rows 1/5/6/7/12; States C/D)
- **Depends on:** SLICE-P4-09 (workspace + CAP-542 state to gate on), SLICE-P3-06 (datetime picker), SLICE-P1-06 (audit; note CAP-054 writes no auditLog — register-verbatim, flagged OQ2)
- **Scope:** Implement Publisher `candidate.approve` (gated CAP-040 + CAP-041 + CAP-542, fail-closed on any unconfirmed ref), `candidate.reject` (terminal-for-revision, `rejectionReason` required, records preserved), `candidate.schedule` (fire-time; no auditLog per register — flagged), Editor `candidate.regen` (GLM ≤3 attempts, generationRuns retained), `persona.regenComment` (failure keeps previous, never blank; priors via supersededByDraftId). Persona approve/reject/schedule (CAP-173/174/175) explicitly NOT here — Phase 5 (E4 resolution).
- **Files touched (expected):** `convex/editorial/decisions.ts`; workspace action surfaces
- **Acceptance criteria:** CAP-043 gate (quoted): "M3 latest run pass + operator approval (INV-2, no auto-publish)." CAP-044 (quoted): "`rejectionReason` is the retained legal-audit record (non-deletable). `auditLog.reasonCode`/`justification` is a separate generic trail — not a duplicate, not a substitute." CAP-042 (quoted): "GLM ≤3 attempts/candidate" + exhausted state (affordance disabled). CAP-048 (quoted): "failure keeps previous, never blank." CAP-054 flag (quoted): "no auditLog write in register (Open Questions)" — shipped register-faithful; do not silently add the audit write.
- **Size check:** ≤2 days — four decisions + one regen over P4-09's workspace; each is a thin mutation with audit + state rules already quoted.

## SLICE-P4-11 — Publish: candidate.publish + URL/similarity re-run + persona density + social derivatives
- **CAP-IDs covered:** CAP-046, CAP-055, CAP-052, CAP-053, CAP-056, CAP-057 · CAP-047, CAP-051 *(added 2026-09-04 — orphan disposition: post-approval persona.generateComments fan-out + seo.generate on FINAL approved revision — both fire at publish)*
- **Source contract(s):** `contracts/wave-4/CONTRACT-4-editorial-FINAL.md` (§4 Actions rows 10/11; States F/G)
- **Depends on:** SLICE-P4-10 (scheduled candidates exist), SLICE-P4-02 (posts.create's transactional pattern reused for the publish txn), SLICE-P4-04 (contentEmbeddings writer — posts + embedding index)
- **Scope:** Implement time-fired `candidate.publish` (transactional, idempotent: posts + postRevisions + postSources + persona comments (staggered, real timestamps) + contentEmbeddings + status flip), the publish-time re-run of URL + similarity HARD checks (CAP-046 — edits can reintroduce URLs/copy), persona density cap ≤2/post (CAP-056), `social.generate` (System) + `social.export` (Editor, export-only per DEC-O07). Publish-gate failure outcome is register-unnamed (contract OQ5) — candidate stays `scheduled` + alert surfaced on the queue; flagged, not invented.
- **Files touched (expected):** `convex/editorial/publish.ts`; scheduler wiring via P1-04's jobCatalog
- **Acceptance criteria:** CAP-046 Notes (quoted): "Re-runs URL + similarity HARD checks at publish mutation (edits can reintroduce URLs/copy)." CAP-057 cap enforcement (quoted): "≤2/post + ≤1/tool enforced in mutation" — **the affiliate-cap check is owned here, inside the publish transaction; this is the enforcement point, not just a reference.** CAP-056 (quoted): persona density cap ≤2/post. DEC-O07 (quoted): "export-only, never auto-published externally." Idempotency: contract §4 (quoted): "transactional, idempotent."
- **Size check:** ≤2 days — one big transactional mutation + one System action + one export; the re-run checks reuse P4-02/P4-07 evaluators.
- **FATAL-adjacent flag:** CAP-057's affiliate cap binds HERE (publish), not at inject — same class as Wave 6C's Finding-5 route-level discipline (gate at the point of no return). Quoted exactly.

## SLICE-P4-12 — Affiliate-inventory console + CAP-049/050 inject/remove (inventory BEFORE inject)
- **CAP-IDs covered:** CAP-539, CAP-540, CAP-541, CAP-544, CAP-545, CAP-049, CAP-050, CAP-057
- **Source contract(s):** `contracts/wave-4/CONTRACT-4-affiliate-inventory-FINAL.md` (§1–§4) · `contracts/wave-4/CAP-049 register row` (E1/E2 stamps)
- **Depends on:** SLICE-P3-01/04 (shell + A1), SLICE-P1-06 (audit), **SLICE-P4-11 is NOT a dependency — inject is post-approval pre-schedule; but the console (539–545) MUST land before inject can resolve any link** — dependency graph states: inventory slices before inject
- **Scope:** Define `commercialEntities`/`affiliateRelationships`/`affiliateLinks` schema (E6 defaults enumerated). Build `/admin/affiliate-inventory` (CAP-544 list, 539/540/541 create/edit with parent-chain gating, CAP-545 soft-deactivate cascade, **CAP-012 logo upload consume — P4-02 owns `generateUploadUrl`**; do not fork). Then implement CAP-049/050 on the editorial surface: injection-time active-status verification (relationship active AND link active), tool name-match, structured CTA with `rel="sponsored nofollow noopener"`, never prose.
- **Files touched (expected):** `convex/schema.ts` (M2 commercial region); `convex/affiliateInventory.ts`; `convex/editorial/inject.ts`
- **Acceptance criteria:** CAP-049 E1/E2 stamp (quoted): "at **injection time** (not merely at initial name-match) verify `affiliateRelationships.relationshipStatus=active` … **AND** the specific `affiliateLinks` row is not deactivated (`status=active`)." CAP-545 (quoted): "Deactivation is soft — status flip, not deletion … Cascading downward." CAP-540/541 gating (quoted): "Create-child-without-parent: blocked in UI and rejected server-side." CAP-049 CTA rule (quoted): "structured CTA, `rel='sponsored nofollow noopener'`; never in prose." CAP-057 (quoted): "≤2/post + ≤1/tool enforced in mutation" — enforcement owned by P4-11's publish mutation; this slice provides the UI boundary (disable inject affordances at cap boundary) + the cross-slice rejection test (inject 3 → publish must reject). FUTURE-M2-01 stays named-not-built (quoted): "A relationship or link deactivated after a prior injection does not retroactively affect already-published posts."
- **Size check:** ≤2 days — three small CRUD entities + one console + one inject/remove pair; the cascade is one tested transaction.
- **FATAL-adjacent flag:** the inject chain is the M2 half of the disclosure/commerce integrity story. CAP-049's injection-time checks and CAP-057's publish-time cap are both quoted verbatim; disclosure rendering (M11 storefront side) is Phase 6 — cross-referenced, not duplicated.

## SLICE-P4-13 — `/p/[slug]` base render + type index + SEO SSR (CAP-089 / 090 / 091 / 092 / 106-read / 107)

- **CAP-IDs covered:** CAP-089, CAP-090, CAP-091, CAP-092, CAP-107; **CAP-106 read-tolerance only** (writer = P5-02 CAP-122)
- **Source contract(s):** `contracts/wave-2/CONTRACT-2-post-detail-FINAL.md` (§1–§4, States A/E) · register CAP-089/090/091/092/106/107 · FATAL-M17-01 (Wave-2 noindex default)
- **Depends on:** SLICE-P4-01 (posts + 8 extensions), SLICE-P4-02 (published rows exist; CAP-012 not required), SLICE-P4-03 (`postTags` display), SLICE-P4-04 (`tools` aggregates for Compare)
- **Scope:** Build `/p/[slug]` reading column. `posts.getDetail` (CAP-090) returns `{post, extension, threadContext}` for all 8 active types (news/review/compare/spark/debate/list/showcase/help). Lookup key = `postSeoMeta.slug` (contract OQ#2 — register unnamed; route param is `[slug]`). **CAP-091 `posts.listByType`:** paginated by active type — **M4 owns this query**; P6-03 feed type-nav **consumes** it (do not re-implement in feed). **CAP-092 `compare.render`:** live-compute overall = ratingSum/ratingCount and per-dim from `tools`; count 0 → "—"; 2≤toolIds≤4; **no numeric scores stored in postCompares**. Spark/news/review/showcase/help **render** is CAP-090 (no extra query). Showcase outbound button **only when `approvalStatus=approved`** (approve/reject is P7E-13 CAP-101). **CAP-089** author soft-delete: tombstone + `lifecycleStatus`; comments preserved. **CAP-107:** SSR + **noindex in Wave 2**; indexable flip only when CAP-468 ships (**P7G-01 / P7T-11 pairing**, FATAL-M17-01 — never separate). Held/rejected/private/**unlisted** → noindex. **CAP-106:** M4 read **tolerates** cleared `acceptedCommentId` → Help reverts to open. **Do not implement comment-delete here.** **Fence OQ#3:** CAP-090/092 actor=member; inventory lists anonymous — anonymous gets CAP-107 SSR shell; live Compare/mechanics for anonymous = stop-and-report, do not invent. **Fence OQ#5:** author's own draft/held at this route unspecified — not built. Define `debateVotes` / `listItemVotes` / `postListItems` / `postSeoMeta` in schema if P4-01 omitted them (bible l.93–99, l.166 **complete** — transcription, not invention). Indexable-entity deepen (`previousSlugs[]` etc.) is **P7G-01**.
- **Files touched (expected):**
  - **[BIBLE-FIX — apply now]:** none (cited M4 bullets complete inline).
  - **[CODE — Phase 5 build]:** `convex/schema.ts` (mechanic + `postSeoMeta` if missing); `convex/posts/detail.ts`; `convex/posts/listByType.ts`; `convex/posts/softDelete.ts`; `app/p/[slug]/`; Compare grid composed from §11 primitives (archetype gap — flag, not invent a table kit).
- **Acceptance criteria:** CAP-090 Notes (quoted): "Returns {post, extension, threadContext}; threadContext = {type, mechanic state, acceptedCommentId?, userVote?} for M6." CAP-092 Notes (quoted): "NO numeric scores stored in postCompares." CAP-091 Notes (quoted): "Paginated by active type." CAP-089 Notes (quoted): "Tombstone; comments preserved." CAP-107 Notes (quoted): "Page ships noindex in Wave 2, flips to indexable only when CAP-468 ships in Wave 7 — same-wave pairing required by FATAL-M17-01, never separated." CAP-106 Notes (quoted): "M4 read tolerates cleared ref → Help reverts to open."
- **Size check:** ≤2 days — one detail query + type list + Compare live-aggregate + SSR noindex + soft-delete. Per-type **writes** are P4-14/15. If Compare grid templating creeps, ship qualitativeGrid + "—" numeric stubs first.

## SLICE-P4-14 — Post-detail mechanics: debate + list (CAP-093 / 094 / 095 / 096 / 097)

- **CAP-IDs covered:** CAP-093, CAP-094, CAP-095, CAP-096, CAP-097
- **Source contract(s):** post-detail contract States B/C · §4 Actions 3–7 · R-DBV / R-LST / INV-4
- **Depends on:** SLICE-P4-13 (detail surface + mechanic tables), SLICE-P2-03 (`create`-class guard as needed), SLICE-P1-09
- **Scope:** Debate: verified member `debate.cast` (unique userId+postId; persona/editorial votes **excluded from tallies**); `debate.change` atomic decrement-old + increment-new. List: `community_ranked` verified members `listItems.add` (≤200 chars); `listItems.remove` own item + voteCount recompute; `listItemVotes.toggle` unique (userId, postListItemId), voteCount same-mutation. **`static_creator` → only author edits** (CAP-095). **Fence OQ#7:** whether vote-toggle is suppressed in `static_creator` is unstated — **do not invent**; ship author-edit lock; stop-and-report if a named suppress is required. No rawEvents named (contract §5) — do not silently add. Help accept / showcase URL are **P4-15**.
- **Files touched (expected):**
  - **[BIBLE-FIX — apply now]:** none.
  - **[CODE — Phase 5 build]:** `convex/posts/debate.ts`; `convex/posts/listItems.ts`; affordances on P4-13 page (radio / text input / icon vote with aria-label).
- **Acceptance criteria:** CAP-093 Notes (quoted): "type=debate + active + verified member + no existing vote; unique (userId,postId); persona/editorial votes excluded from tallies." CAP-094 Notes (quoted): "Atomic." CAP-095 Notes (quoted): "Content ≤200 chars; static_creator → only author edits." CAP-097 Notes (quoted): "Unique (userId, postListItemId); voteCount maintained in same mutation."
- **Size check:** ≤2 days — five mutations, two patterns (tally vs voteCount).

## SLICE-P4-15 — Post-detail mechanics: Help accept/reopen + Showcase URL submit (CAP-098 / 099 / 100)

- **CAP-IDs covered:** CAP-098, CAP-099, CAP-100
- **Source contract(s):** post-detail contract States D · §4 Actions 8–9 · register CAP-098/099/100 · R-HLP
- **Depends on:** SLICE-P4-13, SLICE-P5-01 is **not** a hard dep for the mutations (accept targets a `comments` id — P7E-13 previously fixtured this); **when P5-01/02 land, CAP-098 must target real comments.** CAP-106 writer remains P5-02.
- **Scope:** `help.accept`: single accepted, **replaces prior**; user-Help → post author only; editorial-Help → Editor/Publisher. Writes `postHelps` (resolvedStatus=resolved, acceptedCommentId, acceptedByUserId, acceptedAt). `help.reopen` → resolvedStatus=open. **Accept affordance may ship with no visible thread until P5-03** (contract OQ#6 — mutation exists; UI target arrives with M6). `showcase.submitProjectUrl`: server-side normalized hostname, HTTPS required, exact host OR `.endsWith("."+domain)` vs `systemConfig` `showcase.allowedDomains`; reject embedded creds, IP literals, localhost/private/reserved, unauthorized subdomains; **NO preview fetch (SSRF)**; fail-closed if allowlist missing; `approvalStatus=pending`. Moderator approve/reject is **P7E-13 CAP-101** — this slice does not invent review. **P7E-13 must stop fixturing these writers** once this slice exists.
- **Files touched (expected):**
  - **[BIBLE-FIX — apply now]:** none (`postHelps` / `postShowcases` / `showcase.allowedDomains` complete).
  - **[CODE — Phase 5 build]:** `convex/posts/help.ts`; `convex/posts/showcase.ts`; author chrome on P4-13.
- **Acceptance criteria:** CAP-098 Notes (quoted): "Single accepted; replaces prior; user-Help → only author; editorial-Help → Editor/Publisher." CAP-099 Notes (quoted): "`help.reopen`." CAP-100 Notes (quoted): "Server-side: normalized hostname, HTTPS required … NO preview fetch (SSRF). Fail-closed if allowlist missing."
- **Size check:** ≤2 days — three mutations. CAP-100 SSRF discipline reuses P1-10 **must not** be called (quoted: no preview fetch).

---

## Dependency graph (within Phase 4)

Ordered list; items on the same line are parallelizable after their dependencies land.

1. **SLICE-P4-01** (M4 schema) — foundational for 02/03
2. **SLICE-P4-04** (tools schema + surfaces) — parallel with P4-01 (M5 region); foundational for 05
3. **SLICE-P4-02** (posts.create/update + R-URL + drafts) — after 01 + P2-03
4. **SLICE-P4-03** (tags) — after 01 + 02
5. **SLICE-P4-05** (ratings + auto-flag) — after 04
6. **SLICE-P4-06** (M3 schema + seed + console) — after P3-01/04 + P1-05/06/08; parallel with the M4/M5 tracks
7. **SLICE-P4-07** (qualify + live/replay split) — after 06; the M2 chain's gate
8. **SLICE-P4-08** (ingestion) — after P3 + P1-10; parallel with M3/M5 tracks
9. **SLICE-P4-09** (forge + review workspace) — after 07 + 08
10. **SLICE-P4-10** (approve/reject/schedule) — after 09
11. **SLICE-P4-12-console + 12-inject** — console after P3 + P1-06 (parallel with the editorial chain); **inject after P4-09 (workspace) + console** — inventory before inject, never the reverse
12. **SLICE-P4-11** (publish) — after 10 + P4-04 (embeddings writer). **CAP-057 enforcement lives in P4-11; P4-12 depends on that check existing for its e2e test** (inject 3 → publish must reject). Never assume the inject-side slice owns the cap.
13. **SLICE-P4-13** (`/p/[slug]` base + Compare + SEO noindex) — after 01 + 02 + 03 + 04; **blocks Phase 5 discussion slices**
14. **SLICE-P4-14** (debate + list writes) — after 13
15. **SLICE-P4-15** (Help + Showcase URL) — after 13; **P7E-13 consumes these writers** (no more fixtures)

**Phase exit gate (audit Part D, quoted):** "a sourced article passes the deterministic gate, operator approves claim-by-claim, publishes with affiliate injection capped." Concretely: a registered source's poll → extract → cluster → forge → qualify (live, immutable) → claim-by-claim confirm → approve (fail-closed) → inventory-verified inject → schedule → publish with CAP-046 re-run + CAP-057 cap ≤2/post + ≤1/tool. **SF-02 addendum:** `/p/[slug]` renders all 8 types via CAP-090 with Wave-2 noindex (CAP-107); mechanic writes exist for debate/list/help/showcase.

**Flags carried to Phase 5+ (stated, not silent):** CAP-054's missing auditLog (OQ2), publish-gate failure state (OQ5), `postSocialDerivatives.status=edited` writer (OQ3), sources' undefined `robotsStatus`/`rightsBasis` value sets (OQ5/6), CAP-031/539–541/544/545 mutation names unnamed-in-register (named in-slice, flagged), CAP-086 per-type client error keys (OQ8), tool-match semantics (OQ10). Post-detail OQ#3 anonymous interactive, OQ#5 author-own unpublished, OQ#7 static_creator vote suppress, OQ#6 Help-accept vs M6 thread sequencing.

---

## Orphan-CAP disposition (2026-09-04 — FINAL-HOLISTIC-AUDIT HOL-P1-001 closure)

All 27 register rows that had no owning slice are now dispositioned:

| CAP-IDs | Owner | Notes |
|---|---|---|
| CAP-065–067, 069, 073, 075–077 (hard checks) + CAP-078–082 (soft scores) | **SLICE-P4-07** | the 13 M3 qualify rules the audit flagged as omitted |
| CAP-061, CAP-062, CAP-063 | **SLICE-P4-08** | ingest budgets/fan-out ceilings |
| CAP-047, CAP-051 | **SLICE-P4-11** | post-approval persona + SEO generation |
| CAP-105 | **SLICE-P4-02** | composer postTypeConfig.list read |
| CAP-155 | **SLICE-P5-02** (PHASE5) | low-trust outbound-link gate (shared helper w/ P4-02) |
| CAP-438, 441, 442 | **SLICE-P1-07** (PHASE1) | rawEvents write-time stamping/mirroring |
| CAP-401 | **SLICE-P7A-03** (PHASE7-ADMINCORE) | shared-lease expiry cron |
| CAP-457 | **SLICE-P7O-03** (PHASE7-OPS) | dual-login detection event |
| CAP-009 | **DEFERRED — no slice by design** | Founder revokeRole is CLI-only emergency tooling (no UI per register); boundary documented in SLICE-P3-09's scope note. Build only if CLI tooling is ever scoped. |
| CAP-156 | **DEFERRED — FUTURE-M7-02** | retrospective review queue; already ledger-tracked ("do not invent a third admin board"); revisit per that row. |

Readiness "Content safety" category (DECISIONS-LOCKED #8) references this set:
it is satisfiable now that P4-07 owns the M3 pipeline checks.
