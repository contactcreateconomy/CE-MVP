# SLICE CATALOG — BUILD PHASE 6: DISTRIBUTION + MONEY

**Date:** 2026-08-29 · **Phase order source:** AUDIT-FINAL.md Part D (corrected build order)
**Basis:** `CAPABILITY-REGISTER-MERGED.md` (572 rows) · `_data-model.md` · Wave 6A/6B/6C contracts (feed, search, curation, resources, resource-viewer, contribute, admin-resources, storefront, product-detail, sell, sell-apply, admin-store, go-redirect) · AUDIT-FINAL Part D · Phase 5 CAP-570 helper · Phase 6 CAP-571/572 seeders
**Sizing-rule addendum applied:** every cited bullet checked for ellipsis/`{…}`/"see X" incompleteness. **Zero true ellipsis cases.** All cited M9 bullets (l.129–139), M10 bullets (l.190–202), M11 bullets (l.215–226) are complete inline field lists. `signalLedger` (l.334) and `distributions` (l.341) are complete. The one combined bullet (`storeStrikes` / `merchantComplaints` l.227) enumerates both entities' fields inline (reasonCode/evidence/actor · complainant/targetProductId/reason/status) — not an ellipsis, not a sheet pointer. Two bounded unspecified-enum notes, both resolvable in-slice with the stop-and-report guard: `vibingFeatured.status` remaining literals besides `pulled` (curation OQ1); `heroSlots.disclosureClass` values (curation OQ3). Neither is invented.
**Phase boundary:** M9 feed/search/curation → M10 resource store → M11 storefront + `/go`. M12 economy enrichment of `/u/[handle]` and of `distributions` (might/levels/awards) is **Phase 7**. CAP-217 DMCA public intake is **Phase 7** `/legal/intake` (F-33). CAP-101/103/114 moderator mutations are **not re-sliced here** — see confirmation below.

---

## Extra-scrutiny confirmations (this phase's named hazards)

### 1. BUY gate — both-branch independent verification (Wave 6C E1 + Finding 5)

Owned by **SLICE-P6-17**. Acceptance criteria quote CAP-248 and CAP-249 register Notes **separately**. A test suite that only exercises the in-app branch (or only the off-platform branch) cannot pass this slice. See P6-17.

### 2. Three-state `/go` taxonomy (Group B, 2026-08-25)

Owned by **SLICE-P6-17**. Dead-link / gate-fail / redirect-proceeds are three distinct, separately-testable states — not variants of one error. See P6-17 States A/B/C.

### 3. CAP-525 two-field write

Owned by **SLICE-P6-16**. Persistence is `salesEvidence.type=self_report` **AND** `salesEvidence.status=unverified` — two fields, never collapsed into a `self-reported-unverified` status literal (that literal does not exist). See P6-16.

### 4. CAP-101/103/114 moderationCases writes (Wave 7C E-mod-2)

**Not a Phase 6 UI path.** Those three rows already write `moderationCases` as the polymorphic queue-visibility layer (target = postShowcases / mechanic row / toolRatings). Their operator surface is `/admin/moderation` (Phase 7, CAP-330 ordering) on the shared A12 board from SLICE-P3-05. Phase 4 already binds CAP-114's aggregate-exclusion into P4-05's recompute. This phase's **new** `moderationCases` writers — **CAP-268** (merchant complaint, P6-15) and **CAP-561** (owner hide-for-review, P6-18) — write the **same** polymorphic case, same queue, **no special-cased UI**. Confirmed: nothing in this catalog invents a parallel store/resource moderation board.

### 5. A13 verified-vs-unverified badge

**Fenced, not invented.** Inventory A13 and the `/sell` contract §6 are explicit: no §11 token exists; "flagged, not designed." SLICE-P6-16 requires the **data** distinctness (two fields + Amazon source context) and a labeled slot; it does **not** design A13. Structure is a §11.5 Pill placeholder with distinct copy keys; visual token is STYLE-KIT work outside this slice. The phase-exit "interim tier renders distinct" gate is satisfied by the two-field persistence + non-conflatable labels, not by inventing a badge.

### 6. `resource_acquired` ledger wiring (Phase 5 carry-forward)

Owned by **SLICE-P6-07**. CAP-570 helper already exists (P5-05). This slice is the call-site: same-mutation `activity.append(..., eventType=resource_acquired)` inside CAP-212 `resource.acquire`. Not a 20th slice.

---

## SLICE-P6-01 — M9 distribution schema (scores, buckets, exploration, cards, vibing, hero, sessions)
- **CAP-IDs covered:** substrate for CAP-182–201, CAP-553/554 — schema only
- **Source contract(s):** `contracts/wave-6/CONTRACT-6-feed-FINAL.md` (§2) · `contracts/wave-6/CONTRACT-6-curation-FINAL.md` (§2)
- **Depends on:** SLICE-P4-01 (posts FK), SLICE-P5-01 (comments/threadReadStates FKs for Fav)
- **Scope:** Define `postDistributionScores`, `postDistributionBuckets`, `feedExplorationState`, `cardSummaries`, `feedSessions`, `vibingTrends`, `vibingHooks`, `vibingFeatured`, `heroSlots`, `heroAssignments`, `leaderboardProjections`. Bible bullets l.129–139 complete inline. Indexes for Top/Hot/New scans (never compute-at-read). `leaderboardProjections` is a **read-only projection owned by M12** — table exists so P6-03 can render "Podium is forming" (`minThresholdMet=false`) until Phase 7 writes it.
- **Files touched (expected):** `convex/schema.ts` (M9 region)
- **Acceptance criteria:** bible l.129 (quoted): "Read = index scan, never compute-at-read." bible l.137 (quoted): "Display projection only — **MUST NOT write `postDistributionScores` or any rank/score field.**" bible l.131 (quoted): "NEVER an operator curation surface." `vibingFeatured.status` includes `pulled` (CAP-554); remaining literals unspecified (curation OQ1) — store as string union of known values + `pulled`, stop-and-report if a write needs an unnamed literal.
- **Size check:** ≤2 days — ~11 tables, transcription from complete bullets.

## SLICE-P6-02 — M9 System writers: rank/exploration crons + card projections + vibing + hero auto-fill

> **UNBLOCKED 2026-09-04 — DECISIONS-LOCKED #11:** ranking constants (Top/Hot priors, weights, gravity, exploration taper, trend baselines, cooldowns) ship as versioned config defaults tagged `calibration_pending: true`; tunable without code changes; calibration gated by Readiness Category 8 before public launch.
- **CAP-IDs covered:** CAP-187, CAP-188, CAP-189, CAP-190, CAP-193, CAP-195, CAP-196, CAP-197
- **Source contract(s):** `contracts/wave-6/CONTRACT-6-feed-FINAL.md` (§3 C/D/F/H, §4)
- **Depends on:** SLICE-P6-01, SLICE-P1-04 (jobCatalog), SLICE-P5-04 (CAP-129 rank scores — running-comment/avatars gated by it), SLICE-P4-08 (sourceClaims for one-liner grounding)
- **Scope:** Register and implement the crons/actions that **write** the projections P6-03 only reads: `rank.recompute` (leased dirty-queue, M6 pattern), `exploration.refresh` (exposure-deficit; never operator curation), `vibing.compute` (human-activity-only qualification), `card.generateHook` (MAX-grounded, valence guard, neutral fallback if CAP-132 absent), `card.generateSummary` / `card.pickRunningComment` / avatars (pre-computed onto `cardSummaries`; freeze ≥15min), CAP-193 stale-hero auto-fill from TOP labeled "Community Top". CAP-190's CAP-132 gate: missing MAX → neutral fallback (feed OQ9), not a blocker.
- **Files touched (expected):** `convex/jobs/rank.ts`; `convex/jobs/explore.ts`; `convex/jobs/vibing.ts`; `convex/cards.ts`
- **Acceptance criteria:** CAP-187 (quoted): "M6 pattern (dirty-flag + leased bounded workers). Refresh tiers by age. Selective reranking (not global)." CAP-188 (quoted): "Never operator curation (INV-4)." CAP-189 (quoted): "Entirely from eligible HUMAN activity (INV-3)." CAP-190 (quoted): "Never attribute emotion to named user. Neutral fallback." CAP-193 (quoted): "Never Recognition-selected." CAP-195 (quoted): "Member posts only — not persona." CAP-196 (quoted): "Freeze ≥15min anti-flicker. Personas excluded." Card writers **must not write** `postDistributionScores` (bible l.137, quoted above).
- **Size check:** ≤2 days, full — eight System writers but each is one job/action over P1-04. Split line if needed: crons (187/188/189) vs card/hero writers (190/193/195–197).
- **FATAL-adjacent flag:** personas/staff ZERO in core ranking and in vibing qualification. Quoted. Any slice that lets a persona increment `distinctHumanCount` is a blocker.

## SLICE-P6-03 — /feed + / (authed): four sorts, chrome, session controls, Podium placeholder

> **UNBLOCKED 2026-09-04 — DECISIONS-LOCKED #11:** same as P6-02 — feed sort constants from versioned `calibration_pending` config; no invented hardcodes.
- **CAP-IDs covered:** CAP-182, CAP-183, CAP-184, CAP-185, CAP-186, CAP-194, CAP-198, CAP-199, CAP-200, CAP-201, CAP-553
- **Source contract(s):** `contracts/wave-6/CONTRACT-6-feed-FINAL.md` (§1–§4)
- **Depends on:** SLICE-P6-01/02 (projections exist), SLICE-P2-06 (routing convention — complete users land on `/feed`), SLICE-P5-03 (commentSaves/threadReadStates for Fav), SLICE-P4-13 (`posts.listByType` CAP-091 — **consume**, do not re-implement)
- **Scope:** Build `/` (authed) and `/feed`: four sort modes (Top/Hot/New/Fav), post-type nav (active types only; launch_pad/gigs hidden — **type-index rows from P4-13 CAP-091**, not a second `listByType`), hero band + Featured overlay **render** (writes live on P6-04), Vibing ticker **render** (A7 archetype — v1 = labeled list, not a invented ticker component; degrade per F-24), Podium widget render of M12 projections (empty/"Podium is forming" until Phase 7), card assembly from `cardSummaries`, realtime snapshot (counters + "newer material", never live reorder), why-drawer (member), hide/mute/unhide (CAP-200/553), Rising badge → Podium. Two query branches (anonymous-safe vs member). noindex (CAP-486). **Fenced:** "see-fewer" has no write target (feed OQ3) — not built. `vibingFeatured` render read has no member-facing CAP (feed OQ1) — render from the table P6-04 writes; flagged as the same class as a missing list-read, not silently invented as a new row.
- **Files touched (expected):** `app/feed/`; `convex/feed.ts`
- **Acceptance criteria:** CAP-182 (quoted): "Bayesian confidence-damped positive score; NOT Wilson." CAP-183 (quoted): "Anonymous lands on Hot." CAP-185 (quoted): "saved comments (commentSaves) surface alongside saved posts." CAP-186 (quoted): "Hide Launch Pad + Gigs until ~1000-DAU flip." CAP-194 (quoted): "Min activation threshold (25 contributors)." CAP-198 (quoted): "Snapshot feed; only visible-card counters + 'newer material exists' pushed." CAP-553 (quoted): "Reverse path for CAP-200 hide/mute." Firewall (quoted, contract §3 M): "personas/staff ZERO in core ranking; controlled participation display-only." CAP-554 `status=pulled` items must not render.
- **Size check:** ≤2 days, full — render-only over P6-02 projections. A7 ticker degrades; Podium is a placeholder. The four sort queries share P6-01 indexes.

## SLICE-P6-04 — /admin/curation: Hero + Featured + emergency-pull
- **CAP-IDs covered:** CAP-191, CAP-192, CAP-423, CAP-554
- **Source contract(s):** `contracts/wave-6/CONTRACT-6-curation-FINAL.md` (§1–§4)
- **Depends on:** SLICE-P6-01, SLICE-P3-01/03/04/06 (shell + widget seed + A1 + datetime picker), SLICE-P1-06 (audit fail-closed)
- **Scope:** Build `/admin/curation`: Featured booking (`vibing.setFeatured`, cadence caps, M13-passed gate), hero upsert/schedule (10 slots, 4–6 rendered, ≥2 rotate/24h), CAP-554 emergency-pull (`status=pulled`, must not mutate `trendScore`). Seed the widget catalog row. Pause/archive mutation names unspecified (curation OQ4) — lifecycle states exist on the row; named mutations beyond `hero.upsert/schedule` are not invented, flagged.
- **Files touched (expected):** `convex/admin/curation.ts`; `/admin/curation` page; adminWidgets catalog row
- **Acceptance criteria:** CAP-191 (quoted): "Never mutates trend score. Cadence cap (≤1/cycle, ≤1–2 active)." CAP-192 (quoted): "10 managed, 4–6 rendered. States draft/scheduled/active/expired/paused/archived." CAP-554 (quoted): "Does not mutate `trendScore`." CAP-423 firewall (quoted via contract §1): "Hero/Featured ≠ organic/exploration scores." Audit-fail → fail-closed (CAP-426). CAP-019 rate limit applies.
- **Size check:** ≤2 days — three mutations + scheduler UI on A1/datetime already in Phase 3.

## SLICE-P6-05 — /search keyword (CAP-529)
- **CAP-IDs covered:** CAP-529
- **Source contract(s):** `contracts/wave-6/CONTRACT-6-search-FINAL.md` (§1–§4)
- **Depends on:** SLICE-P4-01/04 (posts/tools), SLICE-P1-01a (`users.username`/`displayName`), SLICE-P1-07 (rawEvents capture)
- **Scope:** Build `/search`: keyword/text match only across post title/body, tool name, `users.username` + `users.displayName`. No ML ranking, no personalization, identical results for anonymous and member. Never reads `profiles` or `privateUserData`. Moderation-hidden/removed excluded. noindex. Mutation/query name unnamed (search OQ1) — named `search.query` in-slice, flagged. Pagination/ordering unspecified (OQ3/5) — v1 = deterministic type-grouped, title/name ascending, cap 50/class; flagged not invented as a ranker.
- **Files touched (expected):** `convex/search.ts`; `app/search/`
- **Acceptance criteria:** CAP-529 Notes (quoted): "Keyword/text match only for MVP-1 — no ML ranking required. Scope: post title/body, tool name, profile handle/display name. Handle = `users.username`, display name = `users.displayName` — not the M7 `profiles` attribute table." Quoted: "Anonymous gets same read-only results, no personalization." Quoted: "Never reads `privateUserData`."
- **Size check:** ≤2 days comfortably — one query, three result classes, one rawEvents write.

## SLICE-P6-06 — M10 resource-store schema
- **CAP-IDs covered:** substrate for CAP-202–229, CAP-555–559 — schema only
- **Source contract(s):** `contracts/wave-6/CONTRACT-6-resources-FINAL.md` (§2) · `contracts/wave-6/CONTRACT-6-admin-resources-FINAL.md` (§2) · `contracts/wave-6/CONTRACT-6-contribute-FINAL.md` (§2)
- **Depends on:** SLICE-P1-01a (users), SLICE-P1-03 (legalIntake FK on takedown actions), SLICE-P4-01 (posts for postResources)
- **Scope:** Define `resourceReferences`, `resourceReferenceGrants`, `resourceContributions`, `postResources`, `resources`, `resourceVersions`, `acquisitions`, `downloads`, `resourceQuotaLedgers`, `resourceTakedownActions`, `pilotKillGateEvaluations`, `resourceCascadeReviews`. Bible l.190–202 complete inline. Unique (userId, resourceId) on acquisitions. No `dmcaNotices` table (absorbed).
- **Files touched (expected):** `convex/schema.ts` (M10 region)
- **Acceptance criteria:** bible l.196 (quoted): "Quota unit only. View never creates a row. No type=view." bible l.195 (quoted): "Exactly one `isCurrent` when published." bible l.192 (quoted): "Σ weight per resource ≤ 1.0; duplicates weight 0." Absorbed-entity grep: zero `dmcaNotices` in schema.
- **Size check:** ≤2 days — ~12 tables, transcription.

## SLICE-P6-07 — /resources library + acquire/download/quota + resource_acquired ledger call-site
- **CAP-IDs covered:** CAP-224, CAP-212, CAP-213, CAP-215, CAP-216, CAP-229, CAP-570 (call-site only), CAP-214, CAP-376, CAP-377
- **Source contract(s):** `contracts/wave-6/CONTRACT-6-resources-FINAL.md` (§1–§4)
- **Depends on:** SLICE-P6-06, SLICE-P5-05 (CAP-570 `activity.append` helper), SLICE-P2-03 (customer guard, M7 verified), SLICE-P1-05 (quota config keys)
- **Scope:** Build `/resources`: browse (anonymous+member, `resources.library.enabled`), acquire (`resource.acquire` — unique key, atomic day/week ledger, 5/day · 20/week, user-local calendar DEC-S19), download (`resource.download` — TTL=60s signed URL, does **not** consume quota, schedules CAP-216), quota check (server-side), attribution line. **CAP-376** owns `dayPeriodKey`/`weekPeriodKey` in the member's IANA timezone (ISO week Mon 00:00; UTC fallback). **CAP-377** lazy-resets the ledger inside the acquire txn when `now ≥ periodEnd` — **no midnight cron**. **CAP-570 call-site:** inside the CAP-212 acquire mutation, same-transaction `activity.append(userId, eventType=resource_acquired, ...)`. CAP-214 `resource.tagInPost` (structured token on composer) lands here as the M10 write; UI embed is P4-02's composer. CAP-216 cron registered (qualified-download → signalLedger); M12 legitimacy damper consumes in Phase 7 — this slice writes the scheduled settlement, does not invent Signal math.
- **Files touched (expected):** `convex/resources.ts`; `convex/jobs/settleDownload.ts`; `app/resources/`; `convex/activity.ts` call-site
- **Acceptance criteria:** CAP-212 (quoted): "5/day · 20/week. **user-local calendar, per DEC-S19 (CONFIRMED)**. Concurrent double-get → one row." CAP-376 Notes (quoted): "dayPeriodKey=YYYY-MM-DD local; weekPeriodKey ISO week Mon 00:00; fallback UTC." CAP-377 Notes (quoted): "lazy reset inside acquire txn; no midnight cron." CAP-213 (quoted): "Abort mid-download does NOT reverse quota. Re-download ≠ quota." CAP-215 (quoted): "Server-side check, never trust client." Contract §3 F (quoted): "View ≠ acquisition; views never burn quota." CAP-229 (quoted): `"Created by Createconomy · Built with references contributed by [handle]"`. **CAP-570 resource_acquired:** same-mutation as acquire; a successful acquire whose ledger append throws rolls back (CAP-436/570 discipline). CAP-213 rawEvents omission is intentional (cleanup Group B E5) — do not silently add a rawEvents write.
- **Size check:** ≤2 days — browse + two member mutations + quota gate + one cron + one helper call. Viewer is P6-08 so INV-6 stays physically separate.
- **FATAL-adjacent flag:** INV-6 / DEC-S15 — view must never create an acquisition. Cross-slice test with P6-08.

## SLICE-P6-08 — /resources/[slug]/view sandboxed PDF (INV-6 isolation)
- **CAP-IDs covered:** CAP-211
- **Source contract(s):** `contracts/wave-6/CONTRACT-6-resource-viewer-FINAL.md` (§1–§4)
- **Depends on:** SLICE-P6-06/07 (published current version exists), SLICE-P1-05 (`resources.view.enabled`)
- **Scope:** Build `/resources/[slug]/view`: signed short-TTL URL to the **forged clean PDF only** (never original user bytes), sandboxed iframe + CSP, patched pdf.js, no app cookies on delivery origin. Member = full view; anonymous = teaser branch (structure per States B; teaser **content** = DEC-M10-VIEW-AUTH, fenced — page-count/first-page/watermark not invented). A5 viewer is an archetype gap — v1 = sandboxed iframe meeting the delivery invariants, not a designed PDF chrome kit. Flag-off render unspecified (viewer OQ5) — fail-closed: route renders disabled, not the PDF.
- **Files touched (expected):** `convex/resources/view.ts`; `app/resources/[slug]/view/`
- **Acceptance criteria:** CAP-211 (quoted): "rawEvents (view event only — NOT acquisitions)." Quoted: "View ≠ quota." Contract §3 A (quoted): "never creates an acquisition, never burns quota." Delivery (quoted): "serve **only the platform-forged clean PDF artifact, never original user reference bytes**." Cross-slice: viewing does not increment `resourceQuotaLedgers` and does not write `acquisitions` (test vs P6-07).
- **Size check:** ≤2 days — one read action + sandbox shell. Teaser content fenced, which shrinks scope.
- **FATAL-adjacent flag:** INV-6. Acceptance is the cross-slice test with P6-07, quoted.

## SLICE-P6-09 — /contribute (dormant disabled-render + full spec behind the gate)
- **CAP-IDs covered:** CAP-202, CAP-203, CAP-204, CAP-227, CAP-228
- **Source contract(s):** `contracts/wave-6/CONTRACT-6-contribute-FINAL.md` (§1–§4)
- **Depends on:** SLICE-P6-06, SLICE-P3-06 (banner for disabled state), SLICE-P1-05 (`constellation.ugc.enabled`, default false)
- **Scope:** Build `/contribute` **reachable disabled-render** when `constellation.ugc.enabled=false` (E3: mounts, banner + disabled dropzone/submit, mutations server-reject — not 404). When the flag is true: `reference.ackContract` then `reference.submit` (quarantine, rightsBasis required), CAP-204 isolated scan worker, CAP-227 attribution erasure (non-value-bearing audit), CAP-228 cap recompute. A4 dropzone is an archetype gap — v1 = disabled-capable file input, not a designed uploader kit. CAP-202⇄203 circular gating was closed as sequential steps of one flow (cleanup Finding 3) — ship that sequence, not a circular gate.
- **Files touched (expected):** `convex/contribute.ts`; `convex/jobs/intakeScan.ts`; `app/contribute/`
- **Acceptance criteria:** CAP-202 E3 (quoted): "`/contribute` is reachable and renders a **disabled state** (not 404/unreachable) when `constellation.ugc.enabled=false` — this mutation server-rejects while the flag is false; the route still mounts." CAP-203 (quoted): "this mutation is not offered / server-rejects. Not 404." CAP-204 (quoted): "Isolated worker (no creds, no egress, CPU/mem/wall caps). Fail-closed." CAP-227 (quoted): "Never retain erased values in `auditLog.prev`." Original bytes never on public CDN (bible l.190).
- **Size check:** ≤2 days — the dormant path is the shippable MVP (flag default false); the on-path is specified and built behind the flag, same slice, because E3 requires both the disabled UI and the server-reject.

## SLICE-P6-10 — /admin/resources review pipeline + forge
- **CAP-IDs covered:** CAP-205, CAP-206, CAP-207, CAP-208, CAP-222, CAP-223, CAP-226
- **Source contract(s):** `contracts/wave-6/CONTRACT-6-admin-resources-FINAL.md` (§3 A–E/G, §4)
- **Depends on:** SLICE-P6-06/09, SLICE-P3-01/04/05 (shell + A1 + A12), SLICE-P4-07/09 (qualify + forge pipeline reuse), SLICE-P1-06 (audit; CAP-207 writes auditLog per E4)
- **Scope:** Rights review, content review (off_topic ≠ unsafe, INV-11), `forge.fromReferences` (reuses M2/M3; many→one OK; one→many blocked for user_ugc), CAP-208 PDF artifact validation (URI/Launch/JS/forms/embedded/remote/QR reject), contribution weights (Σ ≤ 1.0 server-enforced), rights_verified promotion (unlocks one→many). UGC-disabled does **not** disable this console (in-house/operator production continues).
- **Files touched (expected):** `convex/admin/resources.ts`; `/admin/resources` (review/forge sections); adminWidgets catalog row
- **Acceptance criteria:** CAP-206 (quoted): "Off-topic ≠ unsafe (distinct reject reasons)." CAP-207 (quoted): "Many→one synthesis OK; one→many blocked for user_ugc (INV-4)." CAP-208 (quoted): "Reject URI/Launch/JS/forms/embedded/remote/QR. Fail → not publishable." CAP-222 (quoted): "Σ weights ≤ 1.0 server-enforced. Duplicates = 0 weight." CAP-207 auditLog present (E4). Per-action actors: Editor excluded from nothing on these rows except later publish (P6-11).
- **Size check:** ≤2 days — four operator mutations + one System forge + one validator, on A12. Publish/takedown are P6-11 so this stays at the review engine.

## SLICE-P6-11 — /admin/resources publish, lifecycle, takedown, kill-gate
- **CAP-IDs covered:** CAP-209, CAP-210, CAP-218, CAP-219, CAP-220, CAP-221, CAP-225, CAP-555, CAP-556, CAP-557, CAP-558, CAP-559
- **Source contract(s):** `contracts/wave-6/CONTRACT-6-admin-resources-FINAL.md` (§3 F/H–K, §4)
- **Depends on:** SLICE-P6-10 (artifact-approved versions exist), SLICE-P3-01 (two-layer: CAP-221 is Administrator-only — narrower than screen access), SLICE-P1-03 (`legalIntake` — CAP-217 intake itself is Phase 7; this slice **executes** against rows that exist)
- **Scope:** Publish (exactly one `isCurrent`), schedule drip, CAP-558/555/556/557/559 lifecycle writes, takedown execute (→ `legalIntake` disposition + `resources.status=removed`, **not** `dmcaNotices`), cascade BFS ≤5 hops, strike, kill-gate cron (writes `pilotKillGateEvaluations` only — does **not** flip the UGC flag), CAP-221 Administrator kill-switch. **CAP-217 public DMCA intake fenced to Phase 7** (legal-intake screen, F-33). Console can execute CAP-218 against fixture `legalIntake` rows until then.
- **Files touched (expected):** `convex/admin/resourcesLifecycle.ts`; `convex/jobs/killGate.ts`; `/admin/resources` (lifecycle/legal sections)
- **Acceptance criteria:** CAP-209 (quoted): "Exactly one current version per published resource." CAP-218 (quoted): "Takedown ≠ erasure." + E1: writes `legalIntake` not `dmcaNotices`. CAP-219 (quoted): "BFS depth ≤5." CAP-220 (quoted): "**Does not itself flip `constellation.ugc.enabled`**." CAP-221 (quoted): "Administrator-only kill-switch — a distinct, narrower gate." Two-layer check: a store_operator hitting CAP-221 is server-rejected (P3-01 narrow gate). CAP-555–559 Notes (quoted status writes) each have a test. CAP-557 Actor = Moderator only.
- **Size check:** ≤2 days, borderline — 12 capabilities but they are one-pattern status mutations + two System jobs. Split line: lifecycle 209/210/555–559 (this slice) vs legal/kill 218–221/225 (follow-on) if publish UI creeps.
- **FATAL-adjacent flag:** CAP-221 narrower-than-route gate (E2 two-layer). Quoted. No `dmcaNotices` write anywhere.

## SLICE-P6-12 — M11 storefront schema + CAP-565 Distribution auto-create + CAP-571/572 deploy seeders
- **CAP-IDs covered:** substrate for CAP-230–271, CAP-524/525, CAP-560/561; **CAP-565** (Distribution create-writer); **CAP-571** (seed-store seeder + reserved platform identity); **CAP-572** (`subIdRegistry` seeder)
- **Source contract(s):** Wave 6C contracts §2 · register CAP-565/571/572 · `_data-model.md` l.215–227, l.341
- **Depends on:** SLICE-P1-01a, SLICE-P2-02 (bootstrap complete is the CAP-565 trigger), SLICE-P4-04 (tools FK), SLICE-P5-01 (posts for CAP-560 shadow)
- **Scope:** Define `storefronts`, `storeRequests`, `storefrontProducts`, `storefrontProductVersions`, `storefrontLinks`, `linkValidations`, `storefrontClicks`, `wishlists`, `storefrontAnalytics`, `reviewConflicts`, `salesEvidence`, `subIdRegistry`, `storeStrikes`, `merchantComplaints`. Implement **CAP-565**: immediately after bootstrap complete, auto-create `distributions` (`ownershipMode=single`, initial state) — required because `storefronts.distributionId` FKs it. **M12 economy fields** (might/levels/awards) stay Phase 7; this slice creates the row only. Audit Part D listed CAP-565 under Phase 7's economy cluster; the user firing placed it here because storefronts cannot exist without the Distribution — create-writer lands here, enrichment stays Phase 7. **CAP-571:** deploy/migration seeds 10–20 `isPlatformCurated` stores (products + `storefrontLinks` at `validationState=approved_locked`); prerequisite step of the same seeder creates the reserved platform/system `users` row once if absent — all seed `ownerUserId`s reference it (uniqueness preserved; not CAP-022). **CAP-572:** deploy/migration seeds the per-network SubID capability dictionary (not click SubID assignment). Empty dictionary → P6-17 fail-closes (does not append unknown params).
- **Files touched (expected):** `convex/schema.ts` (M11 + distributions region); `convex/distributions.ts` (CAP-565 follow-on from finalizeBootstrap); `convex/store/seed.ts` (CAP-571 reserved identity + seed stores); `convex/store/subIdRegistrySeed.ts` (CAP-572)
- **Acceptance criteria:** CAP-565 Notes (quoted): "Guarantees CAP-299's '1:1 Distribution-per-member' invariant holds before any member could reach `/u/[handle]`." Quoted: "NOT the same atomic transaction" as CAP-002/003. bible l.219 (quoted): "`storefrontLinks` … **validationState {pending|approved_locked|under_review|rejected}**" — **no `status` field on this table** (F-01: do not implement from the stale M11-sheet/`MASTER-DECISION-DRAFT` sentence `storefrontLinks.status=active`; canonical sources are this bible bullet + CAP-247/248/249). bible l.219 (quoted): "A write to a locked field when approved_locked THROWS." CAP-571 Notes (quoted): "`ownerUserId` references a reserved platform/system identity (created once, inside this seeder — SLICE-P6-12; not CAP-022, which stays categories/config only and never creates users/Founder), preserving the field's uniqueness constraint uncompromised — no schema loosening." Quoted: "The field stays required/non-null; no special-case bypass." Quoted: "Not a third CAP: the reserved identity is a prerequisite step of this seeder, not CAP-573." Quoted uniqueness shape: "P6-12's index is **partial**: unique(`ownerUserId`) where `isPlatformCurated=false`." That identity is `isStaff=true`; **not** Founder. Seed storefronts share that identity's single Distribution. CAP-572 Notes (quoted): "Empty dictionary → CAP-248 fail-closes (does not append unknown params)." Amazon row flags consistent with CAP-261 "not Amazon" reconcile exclusion — from the source-controlled catalog, not invented.
- **Size check:** ≤2 days, full — schema transcription + CAP-565 wiring + two deploy seeders. Split line (pre-drawn): schema+CAP-565 vs CAP-571/572 catalogs if fixture content overflows a day. Seeders are still this slice's ownership.
- **Flags (register gaps, not silently filled):** none remaining on this slice — seed-store writer is **CAP-571**; `subIdRegistry` writer is **CAP-572** (both founder-approved 2026-08-29).

## SLICE-P6-13 — /sell/apply eligibility + application + data-honesty
- **CAP-IDs covered:** CAP-230, CAP-231, CAP-262
- **Source contract(s):** `contracts/wave-6/CONTRACT-6-sell-apply-FINAL.md` (§1–§4)
- **Depends on:** SLICE-P6-12, SLICE-P5-05/06 (profile complete + social handle), SLICE-P1-06 (audit)
- **Scope:** Build `/sell/apply`: eligibility eval (profile complete + ≥1 social + trust tier + no hold + **NOT staff + NOT persona** — E6), tap-first application (four attestations required), data-honesty acceptance (CAP-262; the `/how-we-use-your-store-data` **page content** is Wave 7 trust-pages — this slice records `dataUseVersion` against a config pointer, does not invent the legal copy). Mutation names unnamed (apply OQ3) — named `store.apply.start` / `store.apply.submit` / `store.apply.acceptDataHonesty` in-slice, flagged.
- **Files touched (expected):** `convex/store/apply.ts`; `app/sell/apply/`
- **Acceptance criteria:** CAP-230 (quoted): "eligibility = profile complete + ≥1 social handle + eligible trust tier + no integrity/moderation hold + **not staff, not persona**." Staff/persona → server-reject, R-STAFF class. CAP-231 (quoted): "attestations required." Four named: owns, programPermits, regionEligible, willDisclose. CAP-262 (quoted via contract §3 C): "aggregate-only disclosed." Trust-tier cutoff unnamed (apply OQ5) — config-keyed, stop-and-report if no key exists; do not invent a numeric tier.
- **Size check:** ≤2 days — one screen, three mutations, one eligibility formula.

## SLICE-P6-14 — /admin/store validation pipeline (request → inspect → lock)
- **CAP-IDs covered:** CAP-232, CAP-235, CAP-236, CAP-237, CAP-238, CAP-240, CAP-241, CAP-242, CAP-263
- **Source contract(s):** `contracts/wave-6/CONTRACT-6-admin-store-FINAL.md` (§3 A–C, §4)
- **Depends on:** SLICE-P6-12/13, SLICE-P3-01/04/05, SLICE-P1-10 (safeFetch / headless probe), SLICE-P1-06 (audit)
- **Scope:** Operator decides store requests (approved → `storefronts.status=setup`, Rocketeer badge **provisional**). Product pipeline: CAP-235 isolated SSRF-safe **headless** inspection → CAP-236 auto-screen (off_topic ≠ unsafe) → human approve **locks the package** (`validationState→approved_locked`; write-to-locked THROWS) or reject (8-value reason enum). Rescan cron 24h-high/7d-normal (CAP-240). Drift: buyer-report out-of-cycle (CAP-241), redirect-chain change → `under_review` (CAP-242) — **BUY disabled, storefront visible**. Queue view CAP-263 (batch ≤10). Distinct from `/admin/affiliate-inventory` (P4-12 editorial links).
- **Files touched (expected):** `convex/admin/store.ts`; `convex/jobs/linkRescan.ts`; `/admin/store` (queue); adminWidgets catalog row
- **Acceptance criteria:** CAP-237 (quoted): "locks package per INV-2; immutable at persistence layer." The lock this queue writes is **`validationState=approved_locked`** (admin-store OQ9 / E1, quoted): "the lock this queue writes is `validationState=approved_locked`." CAP-236 (quoted): "off_topic vs unsafe distinct reasons (INV-11)." CAP-242 (quoted): "material intermediate change triggers review." A drifted link **fails** the `approved_locked` gate — that failure is enforced at `/go` (P6-17), not assumed here. CAP-235 uses P1-10 safeFetch; unpinned probe disables (CAP-011), degrades to needs_human — never a silent pass.
- **Size check:** ≤2 days, full — the headless inspector is the risk item; approve/reject/queue are thin. Split line: inspection+auto-screen (235/236/240–242) from human queue (232/237/238/263).
- **FATAL-adjacent flag:** the lock written here is the value P6-17 re-reads. A slice that wrote `status=active` (F-01 stale text) would poison the money path. Canonical field quoted.

## SLICE-P6-15 — /admin/store enforcement (pause/strike/breaker/pull/revoke/complaint)
- **CAP-IDs covered:** CAP-264, CAP-265, CAP-266, CAP-267, CAP-268, CAP-271
- **Source contract(s):** `contracts/wave-6/CONTRACT-6-admin-store-FINAL.md` (§3 D–H, §4)
- **Depends on:** SLICE-P6-14 (live stores exist), SLICE-P3-01 (narrow gates), SLICE-P1-03 (CAP-268 writes moderationCases — **same polymorphic queue as CAP-101/103/114**, A12 in Phase 7)
- **Scope:** Operator block-domain / pause / strike / escalate (reason + auditLog). Circuit breaker (CAP-265 System; N/M from `configKeyRegistry` keys `store.circuitbreaker.complaintCountN` / `store.circuitbreaker.windowHoursM` — Finding 4, not hardcoded). Emergency product pull. Badge revoke (public notice; follower fan-out = FUTURE-M11-01, not built). Merchant complaint intake writes `merchantComplaints` + `moderationCases` (no special store-moderation UI). CAP-271 cron: public-notice + consented-buyer branches only.
- **Files touched (expected):** `convex/admin/storeEnforce.ts`; `convex/jobs/circuitBreaker.ts`; `/admin/store` (enforcement actions)
- **Acceptance criteria:** CAP-264 (quoted): "each action has reason code + auditLog." CAP-265 (quoted): "N/M are **admin-configurable, not hardcoded**." CAP-267 (quoted): "public storefront notice; NEVER infers buyers." + E3: follower/watcher fan-out is FUTURE-M11-01 — **not built**. CAP-268 Writes (quoted): "`merchantComplaints, moderationCases, auditLog`" — case `targetType` is the complaint/product; queue-surfacing is CAP-330 (Phase 7), **not a custom board on this screen**. CAP-271 (quoted): "follower/watcher/opt-in fan-out deferred."
- **Size check:** ≤2 days — five operator/System mutations + one cron. Portal surface for Actor=merchant (admin-store OQ5) unspecified — intake mutation exists; merchant-facing route fenced, flagged.

## SLICE-P6-16 — /sell dashboard: products, pause, analytics, evidence, CAP-525 two-field write (A13 fenced)
- **CAP-IDs covered:** CAP-233, CAP-234, CAP-239, CAP-243, CAP-270, CAP-257, CAP-258, CAP-259, CAP-260, CAP-450, CAP-525
- **Source contract(s):** `contracts/wave-6/CONTRACT-6-sell-FINAL.md` (§1–§4)
- **Depends on:** SLICE-P6-12/13/14 (activation gated by CAP-237), SLICE-P3-04 (A1)
- **Scope:** Build `/sell`: activation at ≥1 approved product (badge active+public; store public), product submit (writes links at `validationState=pending`), edit-request (new version, current stays live), storefront configure, pause (immediate, E5 owner-hide). Analytics read (Traffic / Intent / Confirmed; **CAP-450** k≥5/cell, ≥1d buckets, ≥24h delay, aggregate-only, no buyer identity). Evidence: SubID / coupon / self-report. **CAP-525 Amazon interim:** writes `salesEvidence.type=self_report` **AND** `status=unverified` (two fields) + `signalLedger` at admin-configurable weight strictly between 10 and 25. **A13 fenced:** no verified-vs-unverified badge token is designed here; labels use distinct copy keys so interim cannot be read as Confirmed. M12 ladder-detail surfacing of the tier is Phase 7 (sell OQ10). Evidence writes can be tested against fixture clicks **in this slice** (no later P6 slice owns a click factory).
- **Files touched (expected):** `convex/store/sell.ts`; `app/sell/`
- **Acceptance criteria:** CAP-233 (quoted): gated-by **CAP-237** (E4; not CAP-248). CAP-270 (quoted): "immediate, no review." CAP-257 (quoted): "privacy-query contract enforced on read path; no named individuals." CAP-450 Notes (quoted): "Aggregate-only; k≥5/cell; ≥1d buckets; ≥24h delay; fixed dims; parent/child suppression; rate-limit overlapping queries; no buyer identity." **CAP-525 — two-field write, quoted from register Notes:** "persistence is `type=self_report` + `status=unverified` (data-model enums: `type {subid·coupon·self_report·postback}`, `status {unverified·network_verified·refunded}` — no `self-reported-unverified` literal)." Quoted: "The interim tier must remain visibly distinct from `status=network_verified` everywhere it's surfaced (seller dashboard, admin, M12 ladder detail), so this tier can't be silently mistaken for a real verified sale." Quoted: "Weight must sit strictly between click-only (10) and network-verified (25) — never equal either." A test that writes only one of the two fields (or writes a nonexistent status literal) **fails this slice**. CAP-261 structurally excludes Amazon — this slice must not call reconcile-as-verified for Amazon destinations. **A13:** "flagged, not designed" (sell §6, quoted) — placeholder Pill with distinct keys; component not invented.
- **Size check:** ≤2 days, full — ten capabilities on one dashboard; evidence is four mutations of one pattern. Split line (pre-drawn): manage 233/234/239/243/270/257 vs evidence 258–260/525 if the two-field tests + analytics privacy-query overflow a day.
- **FATAL-adjacent flag:** CAP-525 two-field persistence + weight band. Quoted exactly. Collapsing to one field is a blocker.

## SLICE-P6-17 — /go/[linkId] BUY interstitial: route-level gate on BOTH branches (the money-path slice)
- **CAP-IDs covered:** CAP-247, CAP-248, CAP-249
- **Source contract(s):** `contracts/wave-6/CONTRACT-6-go-redirect-FINAL.md` (§1–§4) · register CAP-247/248/249 Notes (verbatim)
- **Depends on:** SLICE-P6-12 (storefrontLinks schema — `validationState`, **no `status` field**; **CAP-572** `subIdRegistry` must be non-empty — SubID append fail-closes if the dictionary is empty rather than inventing rows), SLICE-P6-14 (locked rows exist to proceed), SLICE-P1-07 (rawEvents), SLICE-P1-06 (audit on CAP-247)
- **Scope:** Build `/go/[linkId]` (internal id only — never a raw affiliate URL). **A6 context-aware interstitial built in-slice** (archetype gap; owning slice per F-24). In-app (valid session/Referer) → CAP-248. Off-platform (no internal Referer) → CAP-249, **NO auto-redirect**. Amazon destinations use the **identical** `/go` flow (CAP-524 — no UI or click-row divergence at this layer). Interstitial **copy** is founder/legal-owned (go OQ3) — structure ships; copy is a placeholder, not invented. F-31 residuals (TOCTOU intra-request, logging-failure-before-302, dwell timing, loop protection) are handled in-slice as fail-closed engineering choices where the contract is silent: gate re-reads `validationState` at the start of the request (Finding 5 already bounds staleness to one request); logging failure before 302 **fails closed** (no redirect if `storefrontClicks`/rawEvents cannot persist — CAP-436 class); dwell/loop numeric bounds unspecified — not invented, flagged.
- **Files touched (expected):** `convex/go.ts`; `app/go/[linkId]/`; `components/go/Interstitial.tsx` (A6)
- **Acceptance criteria (BOTH branches — separately quoted, separately tested):**

  **CAP-247 entry (on-platform BUY-tap), quoted from register Notes:** "verifies **storefrontLinks.validationState=approved_locked** — the live-gate (data-model: `storefrontLinks` has no `status` field; `approved_locked` is the only BUY-passing value)."

  **CAP-248 in-app branch — independent route-level gate, quoted from register Notes (must pass even when CAP-247 never fired):** "Verifies **storefrontLinks.validationState=approved_locked** server-side at this exact route/action, independent of whether CAP-247 fired first. This closes a real gap: a directly-hit `/go/[linkId]` (bookmarked, pasted off-platform — exactly the F3 abuse vector) never triggers CAP-247's entry-verify, so the gate must be a property of the route itself, not conditional on a prior BUY-tap event. Route-level invariant; INV-4's no-refetch is destination-scoped and unaffected (resolve from the locked stored record)."

  **CAP-249 off-platform branch — independent route-level gate, quoted from register Notes (must pass even when CAP-247 never fired):** "Verifies **storefrontLinks.validationState=approved_locked** server-side at this exact route/action, independent of whether CAP-247 fired first. This branch is the sharpest case: an off-platform pasted link NEVER fires CAP-247's BUY-tap entry-verify, so this route must gate itself. Gate-fail here renders the dead-link/unavailable state (no interstitial continue), never the locked destination. Route-level invariant."

  **Required tests (all three must exist; one shared "gate works" test does not suffice):**
  1. Direct GET `/go/{id}` with valid in-app Referer, CAP-247 never called → CAP-248 still re-reads `validationState` and rejects unless `approved_locked`.
  2. Direct GET `/go/{id}` with **no** internal Referer (pasted/off-platform), CAP-247 never called → CAP-249 still re-reads `validationState`; on fail, unavailable render, **never** the locked destination, **no** auto-redirect.
  3. CAP-247 BUY-tap when `validationState ≠ approved_locked` → reject (entry verify).

  **Three-state taxonomy — three distinct, separately-testable states (contract §3 C, quoted):**
  1. **Dead-link:** "`[linkId]` resolves to **no `storefrontLinks` row at all**" — Error-class dead-link render; no destination anywhere; not the same view as (2).
  2. **Gate-fail:** "row found, but **`validationState ≠ approved_locked`** (`pending` / `under_review` / `rejected`)" — unavailable notice; BUY disabled; storefront stays visible upstream; **never** the locked destination.
  3. **Redirect proceeds:** "row found AND `approved_locked` → branch A or B by context." In-app: interstitial → SubID append → 302. Off-platform: interstitial with **NO auto-redirect**.

  Contract §3 C (quoted): "**These three are distinct states, not variants of one error** — dead-link vs gate-fail have different causes, different renders, and different data writes."

  INV-4 (quoted, CAP-248): "hot path never refetches destination; merchant domain from fingerprint." Affiliate id **NEVER exposed** (`affiliateAccountRefMasked`). "A click must never be emitted as a verified conversion" (go §5, quoted).
- **Size check:** ≤2 days — one route, two branches, three states, A6 shell. Copy fenced. The test matrix is the work.
- **FATAL-adjacent flag:** this is the money-path slice. Acceptance criteria that folded CAP-248 and CAP-249 into one "the gate is checked" bullet would recreate Finding 5. They are quoted separately on purpose. F-01: implementation reads the register/contract/bible, **not** `M11-affiliate-store.md:78` or `MASTER-DECISION-DRAFT.md:2712` (stale `status=active`).

## SLICE-P6-18 — Public storefront + product detail + shadow-post discussion (CAP-560/561)
- **CAP-IDs covered:** CAP-269, CAP-246, CAP-252, CAP-245, CAP-244, CAP-253, CAP-254, CAP-255, CAP-524, CAP-560, CAP-561, CAP-250, CAP-251, CAP-256, CAP-261
- **Source contract(s):** `contracts/wave-6/CONTRACT-6-storefront-FINAL.md` · `contracts/wave-6/CONTRACT-6-product-detail-FINAL.md`
- **Depends on:** SLICE-P6-12/14/16/17 (locked links + /go exist; **CAP-572** dictionary must be non-empty — BUY via `/go` fail-closes if empty, enforcement in P6-17), SLICE-P5-02 (comments.create for Product Discussion), SLICE-P5-07 (CAP-550 handle → owner → store resolution), SLICE-P3-05 (A12 not used here — CAP-561 writes cases for Phase 7)
- **Scope:** Build `/s/[handle]` (handle = owner's CAP-550 username composed with unique `ownerUserId` — no handle field on storefronts) with the Group B public-lifecycle renders (pre-activation not-found; paused = resolvable + "temporarily unavailable" + no BUY; suspended/closed = "no longer available" + no BUY). Seed/platform-curated stores labeled, not user-owned (CAP-269; written by **CAP-571** on P6-12). Card preview + wishlist (ZERO Signal). Product detail `/s/[handle]/[product]`: live reference, BUY → `/go` only, Amazon **standard /go** (no click-row divergence; copy slot explains Traffic/interim vs Confirmed — wording fenced as sell OQ4). **CAP-560:** System creates hidden shadow post immediately after CAP-237 approval (thread host). **CAP-561:** owner hide-for-moderator-review → `comments.moderationStatus=held-for-review` + `moderationCases` (polymorphic, **not** a special UI). CAP-244 in-post composer block (≤5 own approved products, structured token) wires into P4-02's composer. **CAP-254** `conflict.detect` cron (flags conflicted review) gates **CAP-255** exclusion/label (readable, not hidden). Settlement crons: `click.settle` (provisional 10), conversion 25 (network-verified only; **Amazon excluded**), analytics.rollup (k≥5), sales.reconcile (not Amazon). Seed catalog is CAP-571's job; this slice renders it labeled, not fake. BUY still fail-closes if CAP-572's dictionary is empty (P6-17 wiring).
- **Files touched (expected):** `convex/store/public.ts`; `convex/store/shadow.ts`; `convex/jobs/clickSettle.ts`; `convex/jobs/conflictDetect.ts` (CAP-254); `app/s/[handle]/`; composer product-block embed
- **Acceptance criteria:** Store contract §3 B paused (quoted): "renders a 'temporarily unavailable — store owner has paused this store' notice … product cards and BUY links NOT rendered." Suspended/closed (quoted): "NO product cards, NO BUY, NO affiliate navigation." CAP-252 (quoted): "ZERO Signal." CAP-560 (quoted): "Reuses M6's existing comments infrastructure with zero FK changes — comments.postId stays non-nullable." CAP-561 (quoted): "hide-for-moderator-review, never delete" + Writes `moderationCases` routed to M13 — **same case-ordered queue as CAP-101/103/114, no special UI**. CAP-245 Finding 2 (quoted): "this row's `posts` write applies to the **in-post composer-block case only** … standalone page's discussion thread host is **CAP-560's shadow post**." CAP-524 (quoted): "standard /go redirect flow (same as all networks)." CAP-251 (quoted): "wishlist=ZERO Signal." CAP-261 (quoted): "reconciles in Impact/ShareASale/Awin/CJ; not Amazon." CAP-250 (quoted): "A click must never be emitted as a verified conversion" (via go §5 — settlement writes `qualification`, not a conversion event). CAP-254 (quoted): "same-device alone cannot reach confirmed; human review" — this cron **gates** CAP-255. CAP-255 (quoted): "label not hideable; false claims still moderated."
- **Size check:** ≤2 days, borderline — two public routes + shadow-post writer + four crons. Split line: public store+detail+560/561 (this slice) vs settlement crons 250/251/256/261 (follow-on) if cron wiring overflows. Crons are listed here so the money pipeline has an owner; they are independently testable against fixture clicks.
- **FATAL-adjacent flag:** CAP-561 must not become a delete path. Shadow post must never surface in M9 (P6-03 filter). Amazon clicks identical at `/go`; exclusion is settlement-only.

---

## Dependency graph (within Phase 6)

Ordered list; items on the same line are parallelizable after their dependencies land.

1. **SLICE-P6-01** (M9 schema) and **SLICE-P6-06** (M10 schema) and **SLICE-P6-12** (M11 schema + CAP-565 + CAP-571/572 seeders) — three schema tracks, parallel after their Phase 1/2/4/5 FKs
2. **SLICE-P6-02** (M9 System writers) — after 01
3. **SLICE-P6-03** (/feed) — after 02; **SLICE-P6-04** (/admin/curation) — after 01 + P3; **SLICE-P6-05** (/search) — after P4-01/04, parallel with feed
4. **SLICE-P6-07** (/resources + acquire + CAP-570 `resource_acquired` call-site) — after 06 + P5-05
5. **SLICE-P6-08** (viewer) — after 07 (INV-6 cross-slice test)
6. **SLICE-P6-09** (/contribute dormant) — after 06
7. **SLICE-P6-10** (admin resources review+forge) — after 09 + P4 forge reuse
8. **SLICE-P6-11** (admin resources publish/lifecycle/takedown) — after 10
9. **SLICE-P6-13** (/sell/apply) — after 12
10. **SLICE-P6-14** (/admin/store validation + lock) — after 13; **this writes `validationState=approved_locked`, which P6-17 re-reads**
11. **SLICE-P6-15** (/admin/store enforcement) — after 14
12. **SLICE-P6-16** (/sell + CAP-525 two-field write; A13 fenced) — after 14
13. **SLICE-P6-17** (`/go` BUY gate — both branches independently) — after 14 (locked rows) + 12 (schema + **CAP-572** dictionary). **Does not depend on CAP-247 having fired.** Fail-closes if `subIdRegistry` is empty.
14. **SLICE-P6-18** (public storefront + product + CAP-254/255 + 560/561 + settlement crons) — after 14 + 17 (`/go` exists for BUY) + P5-02 (comments). Seed stores from CAP-571; BUY still depends on CAP-572 via P6-17.

**CAP-057-class ownership line (money path):** `validationState=approved_locked` **enforcement at redirect time lives in P6-17**, on **both** CAP-248 and CAP-249, each quoting its own register Notes. P6-14 **writes** the lock; P6-16/18 **consume** it (disable BUY UI when not locked). P6-18 must not assume P6-17's gate ran — a public BUY tap still goes to `/go`, where the route re-verifies.

**Phase exit gate (audit Part D, quoted):** "BUY click passes `validationState=approved_locked` at-route on both branches; interim tier renders distinct (A13)." Concretely: (1) in-app `/go` without a prior CAP-247 still rejects non-`approved_locked`; (2) off-platform `/go` without a prior CAP-247 still rejects and never auto-redirects; (3) dead-link ≠ gate-fail ≠ proceed, three tests; (4) CAP-525 persists two fields and cannot be read as `network_verified`; A13 component itself remains fenced.

---

## Flags carried forward (stated, not silent)

- **Seed-store writer** — **CLOSED** (CAP-571, rides P6-12; reserved platform identity created once inside that seeder).
- **`subIdRegistry` writer** — **CLOSED** (CAP-572, rides P6-12). P6-17 still fail-closes if the dictionary is empty at runtime (do not invent rows).
- **`vibingFeatured` public read CAP missing** (feed OQ1) — render from table, no new row invented.
- **A13 badge** — fenced; data distinctness owned by P6-16.
- **CAP-217** DMCA public intake — Phase 7 legal-intake (F-33).
- **CAP-565 economy enrichment** (might/levels/awards on `distributions`) — Phase 7; create-writer is P6-12.
- **`tier_unlocked` CAP-570 call-site** — Phase 7 M12.
- **FUTURE-M11-01** follower/watcher notifications — not built (CAP-267/271).
- **F-01 stale secondary text** (`storefrontLinks.status=active` in M11 sheet + MASTER-DECISION-DRAFT) — P6-17 implements from register/contract/bible only.
- **F-31** dwell / redirect-loop / max continuation — unspecified numerics, not invented; logging-failure-before-302 fail-closed in P6-17.
- **Interstitial copy** (go OQ3) and **Amazon communication copy** (product-detail OQ4) — founder/legal-owned.
- **DEC-M10-VIEW-AUTH** teaser content — fenced in P6-08.
- **Trust-tier store-eligibility cutoff** (apply OQ5) — config-keyed, stop-and-report if unnamed.
- **CAP-101/103/114 operator UI** — Phase 7 `/admin/moderation` (A12, CAP-330); this phase only confirms CAP-268/561 join that queue.
