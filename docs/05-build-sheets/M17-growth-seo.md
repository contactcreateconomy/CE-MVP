# DECISION — M17: Growth, SEO & Distribution (Build Sheet · CONFIRMED)

**Status:** **CONFIRMED + CLOSED** · Design HIT mean ~89.5 · **CONFIRMATION HIT** (GPT 98 / Sonnet 95 / Opus 93 / GLM HIT — mean ~95.3; **FATAL-M17-C1 baked 2026-08-07**) · Public SEO render contracts = in-scope · Customer FE polish deferred · **Date:** 2026-08-07  
**RACI:** R/A = PM · Consulted = GPT/GLM/Sonnet/Opus + Founder  
**Schema:** `M0-build-sheet-schema.md`. Bible = `_data-model.md`. Aggregates: `m17-growth-seo.md` · confirm `m17-confirm.md`. Auth = **DEC-AUTH (Convex Auth)**.

**North star:** Zero-seed soft beta acquires via **founder-video UTMs (launch channel)** + **trustworthy indexable supply (compounding)** + **Path B free library** — never an AI content farm. Make human review **machine-visible** (scaled-content-abuse defence + AI Act Art. 50).

---

## 1. Header & Layer Profile
- **id:** M17 · **purpose:** indexation matrix · SSR/SEO contracts · provenance/AI disclosure · landing/signup mode · UTM dictionary · sitemap/robots/JSON-LD · OG · Search Console health · soft-beta page inventory. · **owner:** PM · **status:** confirmed + closed.
- **dependencies (up):** DEC-G01/G02/G03 · DEC-L01/L04 · DEC-O06/O07 · DEC-A01 · DEC-M2-SCHEMA · DEC-M4-URL · DEC-M7 · DEC-P11/P12 · M2–M16 · M13 moderation status. **(down):** M15 health · M16 referrer · M18 sitemap/OG jobs.
- **Layer Profile:** Backend/Data = **Required** · Jobs (sitemap ISR · GSC weekly) = **Required** · Integration (GSC/Bing) = **Required** · Customer-FE = **Supporting** (public render contracts; polish deferred) · Admin-FE = **Supporting** (UTM builder `/admin/utm` · signup.mode) · SEO/Analytics = **Required** · Audit = **Supporting**.

## 2. Canonical Names & Enums
- **Public routes (canonical):** `/` · `/signup` · `/tools/[slug]` · `/topics/[slug]` · `/discussions/[slug]` *(or existing post URL)* · `/library/[slug]` *(or `/resources/[slug]` — pick one at implement; Bible locks)* · `/how-we-review` · `/editorial-policy` · `/ai-disclosure` · `/about` · `/help` · legal routes · `/sitemap.xml` · `/robots.txt` · `/api/og/[type]/[slug]`.
- **Admin:** `/admin/utm` *(renamed from utm-builder, W7D E-route)* · M15 health deep-link to Search Console.
- **Tables (new/deepen):**
  - `seoPagePolicies` / code-owned indexation predicates *(prefer source-controlled policy module)*
  - `utmDictionary` *(versioned allowlists)*
  - `seoHealth` *(indexedPages, sitemapSize, lastCrawlAt?, coverageErrors, lastCalculatedAt)*
  - `previousSlugs` on indexable entities *(301)*
  - deepen `systemConfig.signup.mode`
  - deepen posts/tools/resources with `lastReviewedAt`, review attestation fields for provenance
- **Enums:**
  - `signupMode`: open · waitlist · closed
  - `indexDecision`: index_follow · noindex_nofollow · noindex_follow
  - `seoHttpOutcome`: ok_200 · gone_410 · not_found_404 · redirect_301
  - `utmSource`: youtube · instagram · tiktok · x · linkedin · reddit · newsletter · partner · direct_share · product_hunt
  - `utmMedium`: organic_video · short_video · organic_social · community · launch · email · referral · post · bio_link · comment · profile
  - JSON-LD types used: WebSite · Organization · SoftwareApplication · AggregateRating · Review · DiscussionForumPosting · Article · LearningResource · CreativeWork · HowTo · ItemList · CollectionPage · WebPage · FAQPage · Person
- **Helpers:** `assertIndexable(entity)` · `renderProvenanceBlock` · `buildJsonLd` · `captureUtm` · `utmBuilder.generate`

## 3. Scope & Non-Goals
- **In:** indexation · provenance/AI disclosure · SSR metadata · sitemap/robots · JSON-LD integrity · OG · open signup + mode · UTM dictionary+builder · M16 handoff · GSC/Bing · 40–45 page inventory · weekly growth ritual · M15 health.
- **Non-Goals:** in-app social publisher (DEC-O07) · video studio (DEC-O06) · programmatic SEO · GEO SaaS · llms.txt · paid ads · rank trackers · profile indexing · in-app search (DEC-P11 P1) · customer FE polish.

## 4. Domain Context
- **Terminology:** *Launch channel* = founder video UTMs. *Compounding channel* = organic/AI citations. *Provenance block* = visible human-review attestation. *GEO-lite* = extractable honest pages — not a second product.
- **Invariants (INV-M17-1…15):**
  1. Indexability derived from content state + quality predicates — not manual Admin override.
  2. Non-published → **410** (was public) or **404** + noindex; never rely on sitemap absence alone.
  3. AggregateRating only from **≥3 distinct human** community raters (`authorType=human`); **omit below**; personas/staff/editorial **never** enter ratingValue/ratingCount (confirm FATAL-M17-C1).
  4. FAQ/HowTo schema only when visible real Q&A/steps exist (≥2 pairs / Help accepted-answer).
  5. No cloaking — crawler content HTML ≡ human content HTML.
  6. User links `rel="ugc nofollow"`; affiliate `rel="sponsored nofollow"` in SSR.
  7. **Provenance rendered** on every indexable content page (FATAL-M17-01).
  8. **AI disclosure** human+machine (`/ai-disclosure` + persona labels) (FATAL-M17-02).
  9. No programmatic/templated SEO pages at soft beta.
  10. Personas never inflate community/schema counts; density gate when persona-heavy + zero community ratings → noindex.
  11. UTM dictionary mandatory; unknown values flagged, never silently coerced.
  12. Thin floor → noindex until unique main content ≥ threshold (tool/hub ≥150–300 words per surface rules).
  13. OG only for published/passed; unpublished → generic Createconomy card.
  14. One `signup.mode` at a time; no dual Join+Waitlist CTAs.
  15. **Affiliate-removal survivability** — page remains useful if BUY removed, else not indexable.
- **Actors:** anonymous crawler · visitor · member · founder (external video) · Admin · Google/Bing bots.
- **Source of truth:** domain publish/moderation state → index decision; M16 for attribution ledger.

## 5. Dependencies & Cross-Module Contracts
| Provider | Contract | Failure |
|----------|----------|---------|
| M2/M3 | Human-reviewed publish; similarity vs sources **and own corpus** | Fail closed publish |
| M4/M6 | Public post URLs; Help accepted-answer → FAQ eligibility | — |
| M5 | Community rating aggregates only | No editorial AggregateRating |
| M10 | Resource public detail; acquire gated | Never index gated bytes |
| M11 | Storefront product cards default **noindex** unless substantive | Doorway prevention |
| M13 | moderationStatus/lifecycleStatus live at render | Held never 200-indexable |
| M15 | seoHealth deep-link | — |
| M16 | UTM/referrer capture; signup.mode annotation on L08 | — |
| DEC-O06/O07 | External video/social; copy-out UTMs only | — |

## 6. Data Model
- **`systemConfig`** *(deepen)* — `signup.mode` {open|waitlist|closed} default **open**; blastRadius tier2/3 per M15.
- **`utmDictionary`** — version, allowedSources[], allowedMediums[], campaignFormat, contentFormat, maxLen=80, updatedAt.
- **`seoHealth`** — indexedPagesEstimate?, sitemapUrlCount, lastSitemapBuildAt, coverageErrorCount, lastGscPullAt?, status, lastCalculatedAt.
- **Indexable entities** *(deepen)* — previousSlugs[], lastReviewedAt?, reviewedByUserId?, provenanceVersion.
- **Attribution session** *(deepen / M16)* — firstTouch utm_* + referrer; utmValidated boolean.

**Provenance block fields (rendered):** authorByline · reviewedBy · reviewedAt · datePublished · dateModified · sourceAttribution links · communityRatingCount? · methodology link to `/how-we-review`.

## 7. Domain States & Lifecycle
- Entity: draft/processing → published (indexable if predicates) → held/removed → **410** if was indexed · waitlist mode pauses new signup without deleting pages.
- Sitemap membership: include only `assertIndexable` true.
- Slug change: 301 from previousSlugs; admin audit required if indexed ≥7d.

## 8. Rules, Algorithms & Limits

### R-INDEXABLE
TRIGGER: SSR metadata / sitemap / OG generation.  
CONDITION: status=published ∧ moderation=passed ∧ visibility=public ∧ not duplicate ∧ not doorway ∧ not thin ∧ HTTP would be 200 ∧ affiliate-survivability ∧ persona-density OK.  
ACTION: robots index,follow; include sitemap; emit eligible JSON-LD.  
ELSE: 404/410 + noindex,nofollow; exclude sitemap; generic OG if URL hit.

### R-PROVENANCE (FATAL-M17-01)
TRIGGER: Render indexable content page.  
ACTION: Always render provenance block + footer links to `/how-we-review` · `/editorial-policy` · `/ai-disclosure`.

### R-AI-DISCLOSURE (FATAL-M17-02)
TRIGGER: Persona or AI-assisted editorial content.  
ACTION: Visible AI label + machine-readable provenance; `/ai-disclosure` states who holds editorial responsibility. Pre-beta Legal confirm Art. 50 exception.

### R-SIGNUP-MODE
TRIGGER: Visitor opens signup/landing CTA.  
CONDITION: signup.mode.  
ACTION: open → email-verified account; waitlist → email capture only (no L08 signup_completed); closed → no capture. Single CTA set. M16 annotates mode.

### R-UTM
TRIGGER: Landing with UTM params.  
ACTION: Validate vs dictionary; store first-touch once; emit M16 observational event; canonical URL strips UTMs; unknown → utmValidated=false.

### R-AGGREGATE-RATING — Confirm FATAL-M17-C1
TRIGGER: JSON-LD build for tool.  
CONDITION: distinctHumanCommunityRaterCount ≥ **3** AND aggregates from M5 community fields only AND authorType=human (personas/staff/editorial excluded).  
ACTION: Emit AggregateRating.  
ELSE: **Omit** AggregateRating entirely (page may still index).  
FEEDBACK: Visible copy must state exact count (e.g. “3 community ratings”) — never imply consensus from thin n.  
PRECEDENCE: DEC-M2-SCHEMA + this threshold. Raise to n≥5 later if manipulation appears.

### R-POST-EDIT-SIMILARITY — Confirm hardening
TRIGGER: Substantive post-publish edit (significant body growth or new quoted-looking blocks).  
ACTION: Flag / light re-run M3 similarity vs sources and own corpus; do not silently bypass anti-doorway/plagiarism gate.

### R-AFFILIATE-SURVIVE
TRIGGER: Index decision for page with affiliate CTA.  
CONDITION: Main content remains useful if affiliate block removed.  
ELSE: noindex.

**Limits:** Launch inventory **40–45** substantive pages · thin unique text floors per surface · UTM value max 80 chars · weekly growth decisions ≤3.

## 9. Backend Operations
| Function | Type | Notes |
|----------|------|-------|
| `seo.assertIndexable` | TS helper | Shared |
| `seo.metadata` | Next generateMetadata | Per route |
| `seo.sitemap` | Next route ISR 3600 | Predicate filter |
| `seo.health.get` | query | M15 consumer |
| `seo.gsc.pull` | internalAction weekly | Optional API |
| `utm.capture` | mutation/helper | Session + M16 |
| `utm.builder.generate` | mutation | Admin |
| `config.signupMode.set` | mutation | Admin + audit |

**Env:** `NEXT_PUBLIC_SITE_URL` · GSC verification · Bing verification.

## 10. Customer Frontend
**Public render contracts (Required); polish DEFERRED.**  
Landing: Beta label · primary CTA Join public beta · secondary Explore free resources · tertiary Discussions. Provenance on content pages. Waitlist/open copy must match `signup.mode`.

## 11. Admin & Governance
- `/admin/utm` — dropdown generate links.  
- `signup.mode` config with audit.  
- M15: seoHealth strip + Search Console deep-link.  
- No exploration curator. No SEO score vanity dashboard.

## 12. RBAC
| Role | Capability |
|------|------------|
| Founder/Admin | UTM builder `/admin/utm` · signup.mode · GSC ownership |
| Editor/Publisher | content that becomes indexable via publish predicates |
| Support | none for SEO config |
| Member | none |

## 13. Integrations
Google Search Console · Bing Webmaster · `@vercel/og` · optional GPTBot/PerplexityBot allow in robots (want citation corpus). No social publish APIs.

## 14. Analytics, Audit & Observability
M16 owns funnels. M17 defines UTM dictionary + landing events. Audit signup.mode changes + slug changes on indexed pages. seoHealth monitors: sitemap count · coverage errors · thin indexed = 0 · held indexed = 0.

## 15. Content & Copy Contract
- Trust pages: literal AI-assisted + human-reviewed disclosure (Legal-reviewed before beta).  
- “No human reviews yet” when AggregateRating omitted.  
- Ops: never imply SLA on crawl times.

## 16. Edge Cases & Failure Recovery
| Trigger | Behavior |
|---------|----------|
| Held after index | Serve 410/noindex; sitemap drop; request removal via GSC if needed |
| Waitlist mode week | M16 shows mode annotation — not false funnel collapse |
| Invalid UTM | Ignore bad values; flag unknown |
| OG request on draft | Generic card |
| Affiliate-only thin page | noindex |

## 17. NFR / Security / Privacy / SEO
- This module **is** SEO. Profiles noindex. Feed/search noindex. UTM never in canonical. No User-Agent branching.

## 18. Fixtures, Tests & AC
**Fixtures:** published tool · held tool · deleted-was-public · zero-rating tool · community-rated tool · persona-dense page · affiliate-only thin · resource · UTM valid/invalid · signup modes.  
**AC:**
- Given held URL, When crawl, Then 404/410 + noindex (not 200).
- Given communityRatingCount=2 humans, When JSON-LD, Then **no** AggregateRating.
- Given communityRatingCount≥3 distinct humans, When JSON-LD, Then AggregateRating from M5 only.
- Given persona ratings only (n≥3), When JSON-LD, Then **no** AggregateRating.
- Given editorial score only, When JSON-LD, Then no AggregateRating.
- Given unpublished, When OG, Then generic.
- Given affiliate-only thin, When assertIndexable, Then false.
- Given open mode, When signup, Then account path not waitlist.
- Given provenance page, When render, Then Reviewed by + dates visible.
- Given persona content, When render, Then AI label present.

## 19. Release, Migration & Rollback
- Flag: public indexing on at soft beta after confirm.  
- Pre-launch: GSC/Bing verify · submit sitemap · Legal Art. 50 note.  
- Rollback: emergency `signup.mode=waitlist` or sitewide noindex flag (Tier3) without destroying content.

## 20. Global Projections & Open Decisions
**Projects to:** Bible Growth/SEO · `_index` §W · DEC-L01/G02 reconciliation · M16 UTM · M15 health.  
**Open:** Legal Art. 50 confirmation (pre-beta gate) · exact public path aliases (`/library` vs `/resources`) · DEC-L05 launch blockers still open.  
**Launch inventory (40–45):** homepage 1 · tools 10–15 · resources ≥12 · editorial/help ~12 · topic hubs ≤5 · trust/AI/legal ~8–10.

### Soft-beta cut
**P0:** provenance · AI disclosure · indexation · SSR metadata · sitemap/robots · JSON-LD · OG gate · open signup+mode · UTM builder · M16 handoff · GSC/Bing · inventory · M15 health · weekly ritual.  
**P1:** GSC API projections · citation spreadsheet · IndexNow · more hubs.  
**Park:** programmatic · GEO SaaS · llms.txt · paid ads · social CMS · profile index · rank trackers.

---

**Consent stamp:** Founder accepted Q1–Q6 / D1–D10 on 2026-08-07.  
**Confirm stamp:** FATAL-M17-C1 baked (AggregateRating **n≥3 distinct humans**, personas excluded) · hardenings (post-edit similarity · shared schema counts · Showcase shared rel · signup.mode default open · Art. 50 Legal record fields · OG version keys) · **CONFIRMED + CLOSED 2026-08-07**.
