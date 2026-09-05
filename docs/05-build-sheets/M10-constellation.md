# DECISION — M10: Constellation · Free Resource Store (Build Sheet · BACKEND-LOCKED)

**Status:** BACKEND LOCKED · **CONFIRMED (GPT 89 / GLM 92 / Sonnet 87 — HIT; bake-ins B1–B9 applied 2026-08-06; B10 OPEN legal)** · **Soft-beta surface: UGC OFF (DEC-M10-UGC-PILOT)** · **Customer FE:** deferred to the FE PHASE (DEC-FE-DIVISION; §10 = reference) · **Date:** 2026-08-06  
**RACI:** R/A = PM · Consulted/Informed = GPT/GLM/Sonnet + Founder  
**Schema:** fills `M0-build-sheet-schema.md`. Canonical names = `_data-model.md`. Rounds: `Aggregated/m10-constellation.md` (design HIT-conditional → confirmation HIT) · `Aggregated/m10-ugc-ab.md` (Path B locked).

**North star:** a **free, platform-authored digital resource library** drives acquisition + return (DEC-S15/S16). **Constellation UGC** (member reference uploads → forge) is **fully specified below** as a **reactivatable pilot**. **Soft public beta ships Path B:** **`constellation.ugc.enabled = false`** — **in-house / operator resources only**; no Contribute Reference UI, no untrusted intake worker, no contributor attribution/Signal split. UGC may reactivate later per A/B reactivation gates (stable core + demand + quarantine owner + counsel-reviewed licence + CSAM/parser live).

### Soft-beta surface (LOCKED 2026-08-06 — DEC-M10-UGC-PILOT)
| Ship now | Deferred (flag off) |
|----------|---------------------|
| `resources` / `resourceVersions` / view / acquire / download / DEC-S15 quota / drip / `postResources` / artifact validation on **platform** PDFs / staff provenance | `resourceReferences` intake · grants UI · contribution weights · quarantine parser · UGC kill-gate · cascade-for-UGC · upload caps |
| Download Signal to **resource authoring org / editorial** as configured (no multi-contributor UGC split) | Contributor-weighted Signal from references |

> **Name:** build-sheet id = **M10-constellation** (product surface = free Resource Store + optional Constellation contribution engine). Distinct from M11 (user affiliate storefront).

---

## 1. Header & Layer Profile
- **id:** M10 (Constellation / free resource store) · **purpose:** browse/view/acquire/download free platform resources; weekly drip; private library; structured post↔resource links; **UGC reference intake → rights-gated forge → publish**; contributor attribution + contribution-weighted Signal; DMCA/takedown; operator review queues; pilot kill-gate. · **owner:** PM · **status:** backend locked.
- **dependencies (up):** M2/M3 (claims-first forge + similarity + grounded citation + SSRF patterns) · M4 (structured tokens; no-URL; max attachments density with M4) · M7 (verified contributor; basic profile for post tagging) · M12 (qualified download → Signal; legitimacy; contribution split; Recipient Neutrality) · M13 (DMCA agent ops, repeat-infringer, sanctions — **infra required at launch**) · DEC-S15/S16/S19 (quota + inventory + window) · DEC-S20 (**OPEN** — downloader licence before first public download). **(down):** M14 retention surfaces · M15 admin queues · M16 analytics · M17 SEO resource pages.
- **Layer Profile:** Backend/Data = **Required** · Jobs (intake parse, forge, quota settle, kill-gate metrics, cascade review) = **Required** · Integration (isolated parse worker, object storage, signed delivery CDN) = **Required** · Admin-FE (rights/content review, publish queue, DMCA) = **Required** · Customer-FE = **DEFERRED** (FE phase) · Analytics/Audit = **Required**.

## 2. Canonical Names & Enums
- **Tables (Bible "Resource store / Constellation (M10)"):** `resourceReferences`, `resourceReferenceGrants`, `resourceContributions`, `postResources`, `resources`, `resourceVersions`, `acquisitions`, `downloads`, `resourceQuotaLedgers`, `resourceTakedownActions`, `resourceCascadeReviews`, `pilotKillGateEvaluations`. DMCA intake = M13 `legalIntake` (absorbs prior thin `dmcaNotices` — Wave 6B E1). Reuses: M2 forge/candidate tables + `sourceClaims` path · `rawEvents` · `signalLedger` · `auditLog` · `mediaAssets` · `resourceTags` · `systemConfig` · `systemJobs` *(deprecated — M18 jobCatalog)*.
- **Enums:**
  - `reference.rightsBasis`: own · authorized · compatible_licence · public_domain *(none → reject)*
  - `compatibleLicence.kind`: *enumerated allowlist only* (e.g. cc0 · cc_by · cc_by_sa · public_domain_mark) — **`cc_by_nd` / `cc_by_nc_nd` / other NoDerivs → reject or block selecting `compatible_licence`** (B8)
  - `resourceReference.status`: uploading · quarantined · scanning · rights_review · content_review · accepted_for_forge · rejected · forge_consumed · legal_hold · deleted
  - `resourceReference.rejectionReason`: no_rights · off_topic · unsafe · encrypted · macros · parse_failed · duplicate · spam · other
  - `contribution.role`: primary · supporting · duplicate · independent · source_only
  - `resources.status`: draft · review · scheduled · published · paused · under_legal_review · removed · archived
  - `resourceVersions.status`: generating · validation_failed · editorial_review · approved · current · superseded · withdrawn · removed
  - `resourceVersions.format`: pdf *(launch consumer only)* · *docx internal-only until DEFERRED*
  - `forge.oneToManyAllowed`: true only if reference sourceClass ∈ {in_house · operator · rights_verified}
  - `sourceClass`: user_ugc · in_house · operator · rights_verified
  - `dmcaNotice.status`: received · acknowledged · reviewing · complied · rejected_invalid · counter_notice
- **Functions:** `reference.submit` · `reference.ackContract` · `intake.scan` (action/job) · `reference.rightsReview`/`contentReview` (admin) · `forge.fromReferences` (action → M2) · `resource.publish`/`schedule` · `resource.view` · `resource.acquire` · `resource.download` · `resource.tagInPost` · `quota.check` · `signal.settleDownload` (cron → M12) · `dmca.intake` · `takedown.execute` · `cascade.review` · `pilot.metrics` (cron).

## 3. Scope & Non-Goals
- **In:** free library browse + hardened in-platform view + quota'd acquisition + free re-download · weekly release batches (5–10/week; 40–60 launch inventory DEC-S16) · private library (acquired / updates / related) · Constellation UGC reference pipeline with rights basis + licence grant · artifact-level "no links" validation · PDF consumer delivery at launch · contributor attribution + contribution weights · Signal only from qualified downloads · post→resource structured tags · DMCA + cascade review (depth ≤5) · pilot kill-gate + ditch→in-house-only · operator queues.
- **Non-Goals (reason):**
  - **Serve user-uploaded bytes publicly** — cut (malware + copyright laundering).
  - **User-authored publish-as-is store** — cut; we always forge/origin as Createconomy.
  - **One→many forge from ordinary UGC** — restricted (launch blast-radius + derivative-work risk).
  - **DOCX/editable consumer downloads at launch** — deferred until link-strip proven (PDF-only).
  - **Paid owned commerce** — deferred DEC-S18; free library stays.
  - **Open unlimited UGC with no kill-gate** — rejected; controlled pilot only.
  - **Full Customer FE polish** — FE phase.

## 4. Domain Context
- **Terminology:** *Reference* = private contributor file + context; never a public download. *Forge* = M2-powered production of an **original** Createconomy resource from authorized claims/concepts. *Resource* = published free library item. *Acquisition* = first Get (quota unit). *Download* = binary fetch (re-download free). *Constellation* = contribution program name. *Kill-gate* = measured pilot checkpoint (200 reviewed refs OR 90 days).
- **Invariants:**
  - **INV-1 Never serve reference bytes.** Only platform-forged, validated **current** `resourceVersions` are viewable/downloadable.
  - **INV-2 Rights before forge.** Upload requires exactly one `rightsBasis` + non-exclusive licence grant (store/parse/transform/publish/attribute/remove/evidence). Select none → **reject**. M2/M3 gates **supplement, never replace**, permission.
  - **INV-3 Attribution ≠ authorship.** Public copy: **"Created by Createconomy · Built with references contributed by [handle]"**. Never "Created by [contributor]" unless they platform-authored (they don't for forged UGC path).
  - **INV-4 One→many gated.** Ordinary `user_ugc` references: many→one synthesis OK; **one→many only** for `in_house` / `operator` / `rights_verified`. Expectation-contract copy is **state-aware** (B1).
  - **INV-5 Artifact must be link-clean.** Final PDF rejects URI/Launch/JS/forms/embedded/remote/QR; images platform-regenerated or QR-scanned. Fail → not publishable.
  - **INV-6 Viewer free; quota on first acquisition only.** View ≠ `acquisitions` row, ≠ quota. Re-download ≠ quota (DEC-S15). Windows = **DEC-S19** (no M10-local reinterpretation).
  - **INV-7 Signal only from qualified DOWNLOAD outcomes** (never upload/publication/view). Re-download = 0. One acquisition/user/resource. Contribution-weighted split, **Σ weights ≤ 100%**, duplicates = 0 weight. Erasure detaches public handle; does not rewrite provenance or re-surface attribution.
  - **INV-8 Takedown ≠ erasure.** Valid DMCA/rights notice **unpublishes**; identity erasure detaches attribution; legal hold may retain evidence under restricted access. Legal/takedown overrides product immutability.
  - **INV-9 Cascade depth ≤ 5.** Valid notice on reference R walks `resourceContributions` synthesis lineage up to **5 hops**; deeper edges → operator overflow queue still recorded on the graph.
  - **INV-10 Caps never Signal-scaled.** Upload caps grow only from **clean submission history + operator capacity**.
  - **INV-11 Off-topic ≠ unsafe.** Distinct rejection reasons (reuse M11 pattern).
  - **INV-12 Pilot or ditch.** UGC stays only while kill-gate green; else **in-house-only** (reference contribute disabled).
  - **INV-13 PDF-only consumer deliverable at launch** (B3).
  - **INV-14 Self-attestation residual is accepted** (B7) — false claims are an ops/incident class, not proof the checkbox "failed."
- **Actors:** visitor/browser · verified downloader · contributor · editor/publisher · DMCA operator · automated workers (intake, forge, settle, cascade, metrics).
- **Source of truth:** `resourceReferences` + grants = rights evidence; `resourceVersions` artifact = consumer truth; `acquisitions`/`downloads` = entitlement/events; `resourceContributions` = attribution + cascade graph; Signal via `signalLedger`.

## 5. Dependencies & Cross-Module Contracts
| Provider | Contract | Failure |
|----------|----------|---------|
| M2/M3 | Forge produces claims-grounded original draft; similarity/quote/SSRF gates | candidate cannot reach `approved` |
| M12 | Qualified download → provisional Signal; legitimacy damper; self/related exclusion; contribution split ≤100% | download still works; Signal deferred/zero with integrity flag |
| M13 | DMCA agent public listing; repeat-infringer; sanctions | **launch-blocking** if absent |
| M4 | `postResources` structured token; no body URLs | publish blocked if resource unavailable pre-submit |
| DEC-S15/S19 | 5/day · 20/week; UTC window default until S19 locked | config only |
| DEC-S20 | Downloader-use licence text | **OPEN — block first public download until LOCKED** (B10) |

## 6. Data Model (Bible summary)
- **`resourceReferences`** — uploaderUserId?, sourceClass, originalFileHash, storageKeyQuarantine (never public), mimeClaimed, magicBytesOk, sizeBytes, rightsBasis?, compatibleLicenceKind?, status, rejectionReason?, operatorNotes?, parseJobId?, createdAt, deletedAt?.
- **`resourceReferenceGrants`** — referenceId, grantVersion, termsHash, rightsBasis, licenceTextVersion, contributorUserId, attestedAt, ipHash?, userAgentHash? *(append-only grant evidence)*.
- **`resourceContributions`** — resourceId, referenceId, contributorUserId? *(nullable after erasure detach)*, role, **weight** (0–1), weightVersion, isDuplicate, signalEligible, createdAt. Unique (resourceId, referenceId). **Σ weight per resourceId ≤ 1.0.**
- **`postResources`** — postId, resourceId, relationType {mentions|explains|compares|uses|related}, sortOrder, createdAt. *(Structured only; token stores resourceId so version updates propagate.)*
- **`resources`** — title, slug, categoryIds[], license *(publisher terms pointer — DEC-S20)*, status, forgeDisclosure, attributionLine, releaseBatch?, releaseDate?, currentVersionId?, createdAt.
- **`resourceVersions`** — resourceId, versionNo, status, isCurrent, **format=pdf**, fileAssetId (clean bucket), pageCount?, sizeBytes, contentFingerprint, artifactSafetyPassed, previewAssetId?, releaseNotes, publishedAt?, createdByUserId.
- **`acquisitions`** — userId, resourceId, acquiredAt, quotaDayKey, quotaWeekKey. Unique (userId, resourceId). **Quota unit only — no view type.**
- **`downloads`** — acquisitionId, userId, resourceId, resourceVersionId, downloadedAt, integrityClass. **Never consumes quota.**
- **`resourceQuotaLedgers`** — userId, dayKey, weekKey, acquisitionsUsedDay, acquisitionsUsedWeek, updatedAt. *(Atomic with acquire mutation; DEC-S19 windows.)*
- **`legalIntake` (M13; absorbs `dmcaNotices`) / `resourceTakedownActions` / `resourceCascadeReviews` / `pilotKillGateEvaluations`** — notice intake · unpublish/remove actions · cascade hop graph (depth, parentActionId, disposition) · kill-gate evaluation snapshots (thresholds admin-configurable; disable remains CAP-221).
- **Views / telemetry:** view + open-preview → `rawEvents` only (not acquisitions).

## 7. Domain States & Lifecycle
1. **Reference:** uploading → quarantined → scanning → (rights_review → content_review) → accepted_for_forge | rejected | legal_hold | deleted; accepted → forge_consumed after resource(s) finalized.  
2. **Forge candidate:** reuses M2 pipeline states + artifact-safety checklist.  
3. **resourceVersions:** generating → validation_failed | editorial_review → approved → **current** (exactly one current per resource when published) → superseded | withdrawn | removed.  
4. **resources:** draft → review → scheduled → published → paused | under_legal_review → removed | archived.  
5. **Precedence:** legal/safety/DMCA > schedule/publish > editorial approval > contributor request. Legal unpublish never waits on self-service immutability.

## 8. Rules, Algorithms & Limits
- **R-RIGHTS:** `trigger` upload attempt → `condition` rightsBasis selected + grant accepted + (if compatible_licence then kind in allowlist and **not ND**) → `action` create reference + grant row → `else` reject `no_rights`. Feedback: errorCode `RIGHTS_REQUIRED` / `LICENCE_INCOMPATIBLE`.
- **R-CONTRACT (B1):** modal + checkbox; normal UGC copy = may yield **0 or 1** resource or be **combined**; operator/in-house/rights_verified = **0 / 1 / many**. Always: bytes never served · publication ours · attribution ≠ ownership · Signal only qualified outcomes · no ordinary self-service edit/withdraw · legal takedown may unpublish.
- **R-INTAKE:** quarantine bucket → isolated worker (**no creds, no network egress**, CPU/mem/wall-clock caps) → magic-byte validate → reject encrypted/password/macros/embedded → AV+CDR → **decompress bomb limits** (max unzip inflate size + mem — B4) → destroy temp → clean extract + claims → job complete. Fail-closed.
- **R-ONE-MANY:** forge planner: if `sourceClass=user_ugc` → max 1 output resource per reference lineage plan (may combine many→one). Multi-output only for allowed sourceClass.
- **R-ARTIFACT:** pre-publish PDF scan — reject URI/Launch/JS/forms/embedded/remote/QR; fail → `validation_failed`.
- **R-VIEW:** signed short-TTL access to forged PDF only · separate delivery origin · sandboxed iframe + CSP (no external net, disable forms) · patched pdf.js · **no app session cookies on delivery origin**.
- **R-ACQUIRE (DEC-S15):** first Get → atomic check ledger under DEC-S19 keys → insert acquisition (idempotent key) → increment day/week · feedback remaining counts. Concurrent double-get → one row.
- **R-DOWNLOAD:** requires acquisition + resource published/current · signed URL TTL=60s · write `downloads` · schedule `signal.settleDownload` · abort mid-download does **not** reverse quota.
- **R-SIGNAL:** settle only if qualified (eligible human · not self/related to contributors · min engagement/dwell where gated · legitimacy damp · once per user·resource window · integrity). Weight = outcome value × legitimacy × **contribution weight**. Re-download 0. Upload/publish/view 0. Total per resource outcome ≤ versioned Signal value.
- **R-WEIGHT (B2):** operator assigns role/weight at forge finalize; duplicates weight=0; upload order never sole determinant; Σ≤1.0 server-enforced. Erasure: null public contributorUserId display; keep weight for historical settlement rules; future Signal follows erasure/retention basis; **public attribution never reappears**.
- **R-CAPS upload:** launch **2/day · 5/week** · max 5 unresolved · 1 file/submission · max **50 MB**. After **5 accepted** refs with zero rights/safety violations → **5/day · 15/week** · 10 unresolved. Temporary ops throttle via `systemConfig`. **Never** scale on Signals/Awards/downloads.
- **R-CAPS download:** **5 distinct new acquisitions/day · 20/week**; re-download free; view free.
- **R-ALLOWLIST / off_topic:** category allowlist aligned DEC-C01 store emphasis; distinct reject reasons.
- **R-DMCA:** designated public agent · notice-and-takedown · **repeat-infringer policy** · evidence retention · at **launch**.
- **R-CASCADE (B5):** on valid rights/DMCA against reference or resource: unpublish target → BFS `resourceContributions` / synthesis edges depth **≤5** → queue `resourceCascadeReviews` for each node → deeper residual → overflow queue (still complete graph record).
- **R-KILL-GATE:** evaluate at **200 reviewed references OR 90 days** (first). Metrics: rights-basis reject rate · **rights-dispute rate** (B6) · safety/off-topic/duplicate · % accepted_for_forge · % published · operator-min/published · acquisition rate · 7d retention · takedown/dispute · Signal-abuse · **% forge steps LLM-automated**. Ditch → in-house if: <10% refs → publishable · ops cost > approved · dispute rate above tolerance · UGC quality << in-house at exposure · parser isolation fails · legal response lag · forge automation **<90%** (operator mostly rewrites). Outcome recorded; flag `constellation.ugc.enabled=false`.
- **R-SEED:** 40–60 quality-reviewed at launch; drip 5–10/week (DEC-S16).

## 9. Backend Operations
- **mutations:** `reference.submit`, `reference.ackContract`, `resource.acquire` (OCC/idempotent), `resource.tagInPost`, admin review/publish/takedown.  
- **actions / jobs:** `intake.scan` (isolated Lambda-class worker), `forge.fromReferences`, `artifact.validatePdf`, `resource.signDownloadUrl`, `signal.settleDownload`, `cascade.review`, `pilot.metrics`.  
- **http:** DMCA mailbox intake (or form → mutation).  
- **auth:** download/acquire = verified member; upload contribute = verified + acceptance of Constellation terms; view published may be public or auth per SEO policy (download still gated).  
- **config keys:** `quota.dayMax=5`, `quota.weekMax=20`, `upload.dayMax=2`, `upload.weekMax=5`, `upload.maxBytes=52428800`, `cascade.maxDepth=5`, `killGate.refCount=200`, `killGate.days=90`, `killGate.minAutomation=0.9`, `delivery.signedTtlSec=60`, `constellation.ugc.enabled`.

## 10. Customer Frontend — DEFERRED (reference)
Routes (reference): `/resources`, `/resources/[slug]`, `/library`, `/contribute/reference`, `/how-we-use-ai` (forge disclosure), legal: DMCA page, licence page (S20). UX principles: viewer primary / Get free secondary; quota feedback plain (no fake urgency); attribution line INV-3; state-aware contribute contract B1; empty/loading/error all intentional (DEC-UX-APPLE). Built in FE phase.

## 11. Admin & Governance
Queues: rights_review · content_review · forge editorial · legal_hold · DMCA · cascade overflow · kill-gate dashboard. Actions: approve/reject (reason enum) · mark rights_verified · assign contribution weights · publish/schedule/pause · unpublish legal · strike contributor · disable UGC pilot. All reasons audited. RBAC: Editor/Publisher/Moderator/Admin per DEC-O13; Store Operator for resource ops.

## 12. RBAC
| Action | visitor | member | operator roles | admin |
|--------|---------|--------|----------------|-------|
| Browse published | ✓ | ✓ | ✓ | ✓ |
| View PDF in-platform | ✓/policy | ✓ | ✓ | ✓ |
| Acquire/download | — | verified | ✓ | ✓ |
| Submit reference | — | verified + terms | ✓ | ✓ |
| Rights/content review | — | — | Editor+ | ✓ |
| Publish | — | — | Publisher | ✓ |
| DMCA handle | — | — | Moderator+ | ✓ |
| Kill-gate disable UGC | — | — | — | ✓ |

## 13. Integrations
- **Object storage:** quarantine bucket (private, no CDN) · clean delivery bucket (R2/S3 + CloudFront or equiv).  
- **Isolated parse worker:** AWS Lambda (or equivalent) **no VPC/no egress**, ephemeral `/tmp`, CDR/AV pipeline, bomb caps.  
- **Forge:** M2 LLM path (cost model ~variable; ~$150/mo ballpark at 1000 refs — ops, not hard SLA).  
- **Signed download:** TTL 60s, isolated hostname.  
- Failures fail-closed (no publish of unvalidated artifacts).

## 14. Analytics, Audit & Observability
- **Events:** `reference_submitted`/`rejected`/`accepted` · `rights_dispute` · `resource_viewed` · `resource_acquired` · `resource_downloaded` · `signal_settled_download` · `dmca_received`/`complied` · `cascade_review` · `pilot_kill_gate_eval` · `ugc_disabled`.  
- **Audit:** every rights decision, weight assignment, publish, takedown, contributor sanction.  
- **Health:** quarantine age · parse fail rate · rights reject rate · dispute rate · operator-min/published · cascade queue · download error rate · signed-URL abuse.

## 15. Content & Copy Contract *(provisional; R4 — legal final)*
- Attribution: **"Created by Createconomy · Built with references contributed by [handles]"**.  
- Contribute contract + state-aware 0/1 vs multi (B1).  
- CTA: **"View resource"** / **"Get free download"** (never "Buy").  
- Quota: "3 of 5 today / 12 of 20 this week"; exhaustion: previously acquired remain; new acquisitions reset at [localized reset].  
- Forge disclosure + link to how-we-use-ai.  
- DMCA page + agent contact (literal copy Legal).  
- **DEC-S20 downloader terms:** OPEN — default intent recorded: personal use · internal business use · modification for own/client work · **no redistribution of the downloadable · no resale · no strip of required notices** until counsel locks.

## 16. Edge Cases & Failure Recovery
- False rights claim → human discovery / notice → unpublish + cascade + sanction + residual log (B7).  
- ND licence selected as "compatible" → blocked at upload (B8).  
- Password PDF reference → reject.  
- Decompression bomb → worker kill + reject.  
- Artifact with QR/link → validation_failed.  
- Erasure mid-attribution → detach handle; resource may remain if lawful basis; future Signal respects erasure.  
- Concurrent acquire → idempotent single quota burn.  
- Contributor expects 10 Signals from 1 file diceds → one→many blocked for UGC; weights explain multi-ref synthesis.  
- Kill-gate fail → disable UGC; keep library; in-house pipeline only.

## 17. NFR / Security / Privacy / SEO
- Untrusted file surface = highest risk — isolated parse mandatory.  
- No reference ever on public CDN.  
- Delivery origin cannot access app auth cookies.  
- SEO: indexable resource pages after publish; no-index removed/legal_hold/draft.  
- Privacy: erasure detach; legal hold restricted access.  
- Accessibility: platform-authored PDF production path must plan accessible text (ops cost residual accepted).

## 18. Fixtures, Tests & Acceptance Criteria
- **Fixtures:** clean own-rights reference · ND "compatible" attempt · encrypted PDF · bomb archive · multi-ref synthesis · rights_verified one→many · quota-exhausted user · self-download farm · 6-hop synthesis chain for cascade · DMCA notice · erasure after publish.
- **AC-1** Given no rightsBasis selected, When submit fires, Then reject and no quarantine parse starts after rejection.  
- **AC-2** Given a user_ugc reference, When forge plans multi-output, Then plan is rejected; only in_house/operator/rights_verified allow multi.  
- **AC-3** Given view-only session, When user views PDF, Then no `acquisitions` row and quota unchanged.  
- **AC-4** Given first Get under remaining quota, When acquire succeeds, Then one acquisition + day/week ledger +1; re-download creates downloads only.  
- **AC-5** Given duplicate concurrent acquires, When both return, Then single acquisition and single quota burn (idempotent).  
- **AC-6** Given forged PDF with embedded URI action, When artifact.validate runs, Then not publishable.  
- **AC-7** Given valid DMCA on reference A feeding B→C within 5 hops, When cascade runs, Then A/B/C enter review/unpublish path; hop 6 queued overflow.  
- **AC-8** Given contributor erasure, When public page loads, Then handle gone; attribution line does not resurrect identity.  
- **AC-9** Given kill-gate automation <90% at review, When eval runs, Then `constellation.ugc.enabled` can disable UGC and metrics record rights-dispute rate separately.  
- **AC-10** Given ND licence tag, When contributor selects compatible_licence, Then UI/server rejects `LICENCE_INCOMPATIBLE`.  
- **AC-11** Given consumer download path, When format requested is docx, Then launch rejects; PDF only.

## 19. Release, Migration & Rollback
- **Flags:** `resources.library.enabled`, `constellation.ugc.enabled`, `resources.download.enabled`, `resources.view.enabled`.  
- **Order:** storage + delivery origin → intake worker → in-house seed publish (40–60) → download/quota → **legal: DMCA agent + DEC-S20** → UGC pilot open (caps low) → Signal settle wire → kill-gate cron.  
- **Rollback:** disable UGC first; disable download if abuse; library pages can stay indexable offline with download off.  
- **Migration:** deepen existing thin `resources`/`resourceVersions`/`acquisitions`/`downloads`; add reference/contribution/DMCA tables. No serving of old user files (none exist).

## 20. Global Projections & Open Decisions
- **Projections:** Bible Resource store → Constellation section · M12 download outcome type + contribution split · M13 DMCA ops shell · M15 queues · M16 acquisition funnel · M17 resource SEO · Journal event `resource_acquired` already seeded.  
- **Confirmation (2026-08-06):** GPT 89 / GLM 92 / Sonnet 87 — HIT · no model-killer · B1–B9 baked · B5 depth=5 · B10 OPEN.  
- **Open / constrained:**
  - **DEC-S20 / DEC-M10-DOWNLOADER** *(OPEN — launch-blocker for first **public** download)*: real downloader-use licence terms (default proposal in §15).  
  - **DEC-S19** *(LOCKED M14)*: **user-local calendar** day/week — M10 acquire/quota keys use `users.timezone` periodKeys.  
  - **DEC-M10-COMPAT-LIST** *(CONSTRAINED)*: exact compatible-licence allowlist enums refined by Legal.  
  - **DEC-M10-VIEW-AUTH** *(CONSTRAINED)*: anonymous full in-platform view vs teaser — FE + SEO decision; download remains gated.  
  - **Accepted residual (logged):** self-attested rights may be false (B7).

---

## DEC register (this module)

| ID | Decision | Status |
|----|----------|--------|
| DEC-M10-RIGHTS | Rights basis + non-exclusive transform/publish licence at upload; none → reject; M2 supplements permission | LOCKED |
| DEC-M10-BYTES | Never publicly serve user reference bytes; forged PDF only to consumers at launch | LOCKED |
| DEC-M10-ATTR | Attribution copy "Created by Createconomy · Built with references contributed by [handle]"; contribution weights ≤100%; weight ≠ ownership of forged work | LOCKED |
| DEC-M10-SPLIT | One→many only in_house/operator/rights_verified; many→one open; state-aware expectation contract | LOCKED |
| DEC-M10-DMCA | DMCA agent + notice-and-takedown + repeat-infringer + evidence **at launch**; publisher posture | LOCKED |
| DEC-M10-QUOTA | Viewer free; DEC-S15 acquire 5/day·20/week; re-download free; windows DEC-S19 | LOCKED |
| DEC-M10-SIGNAL | Signal only qualified download outcomes; contribution-weighted; upload/view/publish = 0 | LOCKED |
| DEC-M10-CAPS | Upload 2/day·5/week → 5/15 on clean history; never Signal-scaled | LOCKED |
| DEC-M10-PARSE | Isolated no-egress intake + CDR/AV + bomb caps + artifact link/QR validation | LOCKED |
| DEC-M10-CASCADE | Takedown cascade via contribution graph, depth ≤5 + overflow | LOCKED |
| DEC-M10-PILOT | Controlled pilot + kill-gate (200 refs OR 90d; ≥90% automation; rights metrics) — **reactivation** contract | LOCKED (spec) |
| DEC-M10-UGC-PILOT | Soft beta: **`constellation.ugc.enabled = false`** — in-house library only; UGC machine dormant | LOCKED |
| DEC-M10-PROVENANCE | Every in-house PDF records source/rights/staff/(model) provenance before publish | LOCKED |
| DEC-M10-DOWNLOADER | Real public downloader licence terms | OPEN (legal; blocks first public download) |
