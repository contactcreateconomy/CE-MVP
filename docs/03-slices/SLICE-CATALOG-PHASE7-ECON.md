# SLICE CATALOG — BUILD PHASE 7-ECON: ECONOMY ENRICHMENT + MODERATION CONSOLE

**Date:** 2026-08-29 · **Phase order source:** AUDIT-FINAL.md Part D (corrected build order)
**Sub-batch:** 7-ECON of remaining Phase-7 firings. Later catalogs (real files, not “later”): `SLICE-CATALOG-PHASE7-TRUST.md` · `SLICE-CATALOG-PHASE7-ADMINCORE.md` · `SLICE-CATALOG-PHASE7-GROWTH.md` · `SLICE-CATALOG-PHASE7-OPS.md`. Slice IDs are `SLICE-P7E-*`.
**Basis:** `CAPABILITY-REGISTER-MERGED.md` (572 rows) · `_data-model.md` · `contracts/wave-7/CONTRACT-7-profile-economy-FINAL.md` · `contracts/wave-7/CONTRACT-7-admin-moderation-FINAL.md` · AUDIT-FINAL Part D + F-11 · Phase 5 P5-07 · Phase 6 P6-12 (CAP-565) · Phase 3 P3-05 (A12) · Phase 4 P4-05
**Sizing-rule addendum applied:** every cited bullet checked for ellipsis/`{…}`/"see X" incompleteness. **One true brace-ellipsis, resolved without invention:** `signalSeasons.thresholds{orbit…multiverse}` (bible l.343) expands to the ten `signal.level` literals already enumerated at bible l.404 (`orbit · comet · moon · planet · star · supernova · pulsar · galaxy · universe · multiverse`) — same-file enum reference, not a discovery-cost multiplier. **Stale cross-line, not used as source of truth:** bible l.125 still says public Signals = "the finalized `signalLedger` sum" — **superseded by CAP-281 Notes / E-econ-2 (`activeSignals`)**. This catalog quotes the register, not that intro sentence. All other cited M12 bullets (l.122, l.334–346) are complete inline field lists. M13 `moderationCases` (l.238) is complete including caseType/status (2026-08-29 F-19 remainder). `legalIntake` gained `payloadHash` / `counterNoticeId?` / `operatorUserId?` in the **2026-08-29 Phase-1 described-vs-applied correction pass** (M13 sheet l.77 remainder — not a 7-ECON write). **`moderationCases.caseType` and `.status` are now on the bible bullet and Core-enums** (2026-08-29 F-19 remainder; source `M13-trust-safety.md` §2 l.21–22). **`policyFamily` remains unenumerated** — no `policyFamily:` line exists on M13 §2 l.20–30; stop-and-report only if a write needs a named family literal, do not invent.
**Phase boundary (this firing only):** `/u/[handle]` Metrics enrichment (Reach · Signals · Awards · Ladder) on the P5-07 Overview/Journal base, plus `/admin/moderation` full case-queue console. **Not this firing:** `/legal/intake` (F-33), `/appeal/[actionId]` submit (CAP-340 — consumed, not built here), analytics/SEO/UTM, reliability/readiness, `/admin/home` queue-load widgets (CAP-332/334), Repeat-Infringer public page (CAP-338/339), legalIntake writers (CAP-343–353).

---

## Extra-scrutiny confirmations (verify-before-assuming + six hazards)

### V1. CAP-565 — CONSUME, do not create

**Found:** SLICE-P6-12 already implements CAP-565 as the Distribution **create-writer**: auto-create immediately after bootstrap complete, `ownershipMode=single`, **initial state only**. Quoted P6-12 scope: "M12 economy fields (might/levels/awards) stay Phase 7; this slice creates the row only." Register CAP-565 Notes (quoted): "Guarantees CAP-299's '1:1 Distribution-per-member' invariant holds before any member could reach `/u/[handle]`." Quoted: "NOT the same atomic transaction" as CAP-002/003. CAP-299 "becomes effectively redundant at signup but stays as a defensive/idempotent path."

**This batch:** every economy slice **reads an existing `distributions` row**. P7E-02 is F-11 backfill + CAP-299 defensive retry only. No second auto-create path.

### V2. CAP-101 / CAP-103 / CAP-114 moderationCases writes — mutations were never sliced

| CAP | What exists today | What this batch does |
|---|---|---|
| **CAP-101** `showcase.reviewProjectUrl` | Register Writes already include `moderationCases (target=postShowcases row)` (E-mod-2, 2026-08-26). **No Phase 1–6 slice lists CAP-101 as covered.** P4-02 creates showcase posts (CAP-086); it does not implement moderator review. | **First implementation** of the moderator mutation, **including** the register's `moderationCases` write. Not a silent add — the write was specified at E-mod-2; the mutation had no owner. |
| **CAP-103** force-clear Help/vote | Same: E-mod-2 Writes on the register; **no catalog covered-ID**. Gated by CAP-098 (`help.accept`), now **P4-15**. | First implementation of the moderator mutation + `moderationCases` write. **Consume P4-15** — do not invent member accept/reopen. |
| **CAP-114** `toolRatings.moderate` | P4-05 covers CAP-112/113/117/115/116/**533**/535. CAP-114 is **not** a covered CAP-ID. P4-05 only **binds** CAP-114's aggregate-exclusion rule into recompute (quoted: "held/removed/withdrawn excluded from aggregate regardless of score"). **CAP-533** already writes `moderationCases` targeting `toolRatings` (System auto-flag). | First implementation of the **moderator** mutation + its E-mod-2 `moderationCases` write. **Do not re-implement CAP-533.** Console **consumes** CAP-533 cases. P4-05 recompute already excludes held/removed/withdrawn — this mutation must apply the R-AGG delta so that rule has rows to exclude. |

**Already populating the same polymorphic queue (consume, do not re-write):** CAP-154 (P5-02), CAP-127 (P5-03), CAP-268 (P6-15), CAP-561 (P6-18), CAP-533 (P4-05). Schema substrate: P1-03.

**Related gap, stated not silent:** Phase 4's header claimed "moderation STUB (CAP-321–328 subset) is pulled forward" but **no P4 slice lists those CAP-IDs**. AUDIT-FINAL "first 10" slice 10 named the same stub; it was never cataloged. P5-02 depends on "P1-03 auto-gate stub" and implements CAP-154, not CAP-321. **P7E-11 owns CAP-321–323** as the named autoGate wiring onto existing submit paths.

### V3. CAP-321–328 stub sequencing — CONFIRMED, not patched (2026-08-29)

**Question:** did Phase 2 posting-gate slices (P5-02 `comments.create` + eligibility) treat CAP-321–328 as a hard dependency that never existed, or did they correctly build without that assumption?

**Finding: correctly built without a hard CAP-321–328 call.** This is not a silent integration hole between already-closed phases. P7E-11 landing now as the first named implementation is later than the Wave-2-era plan, not a false close.

| Slice | What it actually covers | What it does **not** cover |
|---|---|---|
| **P1-03** | Schema substrate for CAP-321–328 writers. Quoted: "schema only; case behavior is Phase 4 stub → Phase 7 console." Promised F-19 enum copy (this pass finally lands caseType/status). | No `mod.autoGate` function. |
| **P4-02** | CAP-086/087/088/531/532. Depends on P4-01 / P2-03 / P1-09. Gate chain = R-TYP / R-URL / R-GATE / INV-2. | **No CAP-321–328 in Covered IDs. No Depends-on P1-03.** Header "stub pulled forward" is aspirational prose, not a slice contract. |
| **P5-02** | CAP-120/121/122/141/140/152/153/**154**. Acceptance quotes CAP-152/153/154 fail-closed, **not** CAP-321. CAP-154 Notes (quoted): "Fail-closed. Overlaps M13." Writes `moderationCases`. | **Does not list CAP-321–328 as covered.** Depends-on `"SLICE-P1-03 (moderationCases + auto-gate stub)"` names a **schema slice** so CAP-154 has a table to write — the "auto-gate stub" label overstates P1-03 (schema only). |

**Soft, not silent:** CAP-120 Gated-by includes "M13 auto-mod pass." P5-02 fulfilled that with the M7 R-ABUSE stack (152/153/154), which the register already marks as overlapping M13. Comments/posts can ship fail-closed without `mod.autoGate`. When P7E-11 wires CAP-321, it **must not double-hold** against CAP-154 on the same submit (already in P7E-11 scope: "Does not replace P4-02 R-URL or P5-02 CAP-154").

**No catalog/code patch to Phase 4 or 5.** Do not back-date CAP-321 onto P5-02.

### H1. CAP-281 public Signals = `activeSignals`

Quoted from register Notes: "The public-facing 'Signals' number in the Reach·Signals·Awards triad is the **Active** count — the live/current measure. Total is the permanent historical record (not shown publicly as 'Signals'); Pending is transitional and not shown publicly." Contract States E (quoted): "the public 'Signals' number in the Reach·Signals·Awards triad = `activeSignals`."

### H2. CAP-312 opt-out = FULL hide

Quoted from register Notes: "opt-out hides Level/progress/badges **AND Reach/Signals** — the full public economy-metrics surface, not a partial hide. Math unchanged; the opted-out profile shows none of the public triad + ladder + badges." Toggle writer already exists: CAP-552 on P5-06 (`users.leaderboardOptOut`). This batch **enforces the read-side hide**.

### H3. CAP-313 identical anonymous/member render

Quoted from register Notes: "Actor broadened member → anonymous, member — same ladder render for both. … No separate anonymous-restricted render — CAP-312's opt-out is the sole visibility governor … if not opted out, anonymous and member see identical ladder content."

### H4. Podium ↔ Ladder firewall (CAP-298)

Quoted from economy contract §1: "CAP-313's Level data (`distributionLevelAssignments`) is **NOT** read by CAP-194 Podium (which reads `leaderboardProjections`, Recognition-driven). CAP-298 mandates this separation." CAP-298 Notes (quoted): "two currencies in different tables; never cross-reference." P6-03 already renders Podium; this batch **writes** `leaderboardProjections` via CAP-294 and **must not** let ladder queries read Recognition/Podium tables or vice versa.

### H5. Sealed keys never in any query this batch builds

Quoted from CAP-394 Notes: "Sealed keys (`legitimacy.medianTarget`, `signal.eventWeights`, `signal.attributionSplit`, `trust.weightCap`) absent from editor." Same four keys **must never appear** in Metrics queries, ladder queries, or `/admin/moderation` responses (public or staff). P1-05 sealed-by-absence still holds; this batch adds a projection deny-list test on every new query.

### H6. CAP-324 Report modal target = comment

Settled; not re-litigated. `report.submit` creates/attaches `moderationCases` with target = the comment. Many reports → one open case per target+policyFamily+window.

### H7. Polymorphic case-ordered queue — no special-cased UI

Quoted from E-mod-2 (moderation contract States S): "These three action types appear in the **normal case-ordered queue (CAP-330) like everything else — no special UI, no sub-tabs, no separate panels needed.** Domain tables remain the detail record; `moderationCases` is the queue-visibility layer." A12 from P3-05 is the board.

### Contract Primary CAP-IDs vs this firing's extra list

Moderation contract Primary (quoted): "CAP-101, 102, 103, 114, 135, 136, 137, 138, 327, 328, 329, 330, 333, 335, 336, 337, 341, 342, 359." This firing also named 127, 132, 321–330, 340–342, 533, 561, **565–566**.

- **CAP-565 / CAP-566 are not moderation CAPs.** CAP-565 = Distribution auto-create (P6-12). CAP-566 = `utmDictionary` seed/edit (**P7O-06**). **Not placed on `/admin/moderation`.** Treated as a firing-list slip, not a console requirement.
- **CAP-127** already implemented (P5-03). Console reviews via **CAP-137**.
- **CAP-533 / CAP-561** already write cases. Console consumes.
- **CAP-340** is `/appeal/[actionId]` (separate contract). This console **resolves** (341) and **SLA-ticks** (342). Submit is fenced to a later legal/trust sub-batch unless an empty appeals-near-bound column is acceptable with fixtures.

---

## SLICE-P7E-01 — M12 economy schema (distributions enrichment + ledger/ladder tables)
- **CAP-IDs covered:** substrate for CAP-272–320 — schema only (no behavior)
- **Source contract(s):** `contracts/wave-7/CONTRACT-7-profile-economy-FINAL.md` (§2) · `_data-model.md` l.122, l.334–346, l.404–406
- **Depends on:** SLICE-P6-12 (`distributions` row already exists, initial state), SLICE-P1-01a (users), SLICE-P1-07 (rawEvents)
- **Scope:** Patch `distributions` with M12 economy fields the P6-12 create-writer left unset (`memberCount`, `reachFactor`, `activeSignalFactor`, `might`, `mightPercentile`, `currentLevel`, `highestLevelAchieved`, `awardsCount`, `dormant`). Define `outcomeDefinitions`, `signalLedger`, `signalSummary`, `legitimacyScores`, `engagementEdges`, `integrityFlags`, `recognitionEvents`, `badges` (if not already present from the P5-07 placeholder assumption — define here; do not duplicate if P5 landed it), `distributionMemberships`, `signalSeasons`, `signalLevelDefinitions`, `distributionLevelAssignments`, `vouches` (Phase-2 skeleton, unused). Seed Founding Season + ten `signalLevelDefinitions` rows from l.344 bands (Orbit=all … Multiverse abs-cap ~top100) — values are in the bullet, not invented.
- **Files touched (expected):** `convex/schema.ts` (M12 region); season/level seeder
- **Acceptance criteria:** bible l.341 (quoted): "`memberCount` (= the PUBLIC 'Reach' — a clean integer) · `reachFactor` (internal legitimacy-weighted Σ … **never shown**) · `might` · `currentLevel` (signal.level) · `awardsCount`." bible l.335 (quoted): "`totalSignals` (lifetime → record + trust capacity) · `activeSignals` (90d weighted-decay … → Might) · `pendingSignals`." bible l.336 (quoted): "`legitimacyScores` … **NEVER surfaced by any query**." `thresholds{orbit…multiverse}` stored as a map keyed by the l.404 ten-literal enum — not a free-form blob. CAP-565 rows remain valid after the patch (nullable-or-zero defaults on new fields; no recreate).
- **Size check:** ≤2 days — transcription from complete bullets + one enum-expand. Split line: tables vs Founding-Season seed if copy/threshold numbers overflow.

## SLICE-P7E-02 — F-11 backfill + CAP-299 defensive create (consume CAP-565)
- **CAP-IDs covered:** CAP-299 (defensive/idempotent only); **F-11 migration** (no new CAP)
- **Source contract(s):** economy contract States A · register CAP-565 Notes · AUDIT-FINAL F-11
- **Depends on:** SLICE-P7E-01, SLICE-P6-12 (CAP-565 live for new signups), SLICE-P2-02 (bootstrap complete)
- **Scope:** (1) **F-11 backfill:** one-shot/internal migration creating a `distributions` row (`ownershipMode=single`, initial state) for every `bootstrapState=complete` member who lacks one — the gap F-11 names (quoted): "CAP-565 auto-create covers only post-M12 signups; no backfill CAP for pre-existing members." (2) **CAP-299** as the contract States A defensive path (quoted): "fires only in the edge case where CAP-565 didn't create one — retry logic, migration, etc.; at normal signup it is not needed and does not render." Idempotent: unique owner → one row; second call no-ops. **Does not replace CAP-565.** Metrics tab never renders a null Distribution after this slice + P6-12.
- **Files touched (expected):** `convex/distributions.ts` (defensive create); `convex/migrations/backfillDistributions.ts` (F-11)
- **Acceptance criteria:** F-11 (quoted): "pre-M12 members' Metrics tab hits the 'never null' state CAP-565 was meant to prevent" — after backfill, every complete member has exactly one Distribution. CAP-565 Notes (quoted): "CAP-299 … stays as a defensive/idempotent path." Economy States A (quoted): "a fresh profile's Metrics tab always has a real (if empty/zero-state) Distribution to display, **never a null/missing-entity state**." CAP-299 mutation name unspecified (economy OQ5) — named `distribution.createDefensive` in-slice, flagged. Create-Distribution **modal does not render** on the normal path.
- **Size check:** ≤2 days comfortably — one idempotent insert + one migration job.

## SLICE-P7E-03 — Signal award path (eligible outcome → provisional ledger)
- **CAP-IDs covered:** CAP-272, CAP-273, CAP-274, CAP-275, CAP-280, CAP-285
- **Source contract(s):** register CAP-272–275/280 Notes · bible l.334
- **Depends on:** SLICE-P7E-01, SLICE-P1-07 (rawEvents), SLICE-P6-17 (`storefrontClicks` for CAP-275), SLICE-P7E-05 (legitimacy snapshot — if 05 is not yet landed, award path fail-closes missing legitimacy rather than defaulting to 1.0)
- **Scope:** Implement the award pipeline as System functions (no UI): detect eligible outcome (272) → qualified-outcome predicate + dedupe + integrity + per-(actor,target) cap (274) → qualified-CTA gate (275) → `signal.awardFromOutcome` provisional @80% × actor legitimacy (273) → confidence damping (280). Bare view/reaction with no downstream outcome = ZERO Signal. **CAP-285:** suspected event **shadow-damped** (still ticks visible counter, fractional weight); actor never told. Fence remains for CAP-282/286–292 (**FUTURE-M12-01**).
- **Files touched (expected):** `convex/signal/award.ts`; `convex/signal/ctaQualify.ts`
- **Acceptance criteria:** CAP-274 Notes (quoted): "bare view/reaction with no downstream outcome = ZERO Signal (AC-10)." CAP-273 (quoted): "writes provisional Signal row @80% computed value … × actor legitimacy (INV-2)." CAP-285 Notes (quoted): "actor never told (no gaming gradient)." bible l.334 (quoted): "Value not actions — outcomes only; never posting/reacting/login/completion." Event weights (quoted from CAP-272): "view 0.3 / reaction 1 / reply 1.5 / comment 2 / completion 2.5 / save 3 / CTA 10 / conversion 25" — these are **qualified-outcome evidence weights**, not automatic Signal (bible F1). Sealed key `signal.eventWeights` is **not** read from config and **not** returned. CAP-275 dwell/once-per-window constants: "calibrated on first ~100 conversions" — use named config keys if present; stop-and-report if unnamed numerics are required beyond the register sentence.
- **Size check:** ≤2 days, full — five capabilities, one pipeline. Split line: 272/274/273 vs 275/280 if CTA calibration overflows.

## SLICE-P7E-04 — Signal settle / reversal / clawback / attribution split
- **CAP-IDs covered:** CAP-276, CAP-277, CAP-278, CAP-279
- **Source contract(s):** register CAP-276–279 Notes · bible l.334
- **Depends on:** SLICE-P7E-03
- **Scope:** `attribution.settle` cron (≤7d provisional → finalized or reversed). Reversal cascade on refund/invalidate (277). Clawback cascade on confirmed integrity (278). V1 positional split ~85% author / ~15% commenter pool, journey-linked comments only (279, F2).
- **Files touched (expected):** `convex/jobs/attributionSettle.ts`; `convex/signal/reversal.ts`
- **Acceptance criteria:** CAP-276 (quoted): "finalizes provisional Signal (≤7-day window) or reverses." CAP-277 (quoted): "displayed Signals = max(Σ finalized, 0)." CAP-279 (quoted): "commenter pool = journey-linked only (F2 fix)." CAP-278 (quoted): "clawback entryType." Append-only: reversal/clawback are **new rows**, never rewrites of award rows (same-mutation discipline as CAP-436).
- **Size check:** ≤2 days — one cron + two cascade writers.

## SLICE-P7E-05 — legitimacy.recompute + snapshot-on-cast

> **UNBLOCKED 2026-09-04 — DECISIONS-LOCKED #11:** the seven legitimacy component formulas ship as versioned conservative defaults in config, each tagged `calibration_pending: true`; calibration post-beta gated by Readiness Category 8.
- **CAP-IDs covered:** CAP-283, CAP-284
- **Source contract(s):** register CAP-283/284 · bible l.336
- **Depends on:** SLICE-P7E-01, SLICE-P1-07
- **Scope:** `legitimacy.recompute` cron: geometric mean of the seven named components (account_age · activity_diversity · interaction_diversity · content_quality · temporal_humanity · device_independence · reciprocity_balance). Snapshot-on-cast onto rawEvents (284). **Never returned by any public or admin query this batch owns.**
- **Files touched (expected):** `convex/jobs/legitimacy.ts`; snapshot helper used by P7E-03
- **Acceptance criteria:** CAP-283 (quoted): "geometric mean: one near-zero tanks whole score." bible l.336 (quoted): "hidden [0,1] per actor; NEVER surfaced by any query." Sealed key `legitimacy.medianTarget` absent from responses and from the editor. Fence (not this slice): CAP-282 grace, CAP-286/287 graph+neutrality, CAP-288–292 trust/weight/brakes — **FUTURE-M12-01**. CAP-285 is **P7E-03**.
- **Size check:** ≤2 days — one cron + one snapshot helper. Component formulas that are unnamed beyond "7 bounded components" → stop-and-report rather than invent weights.

## SLICE-P7E-06 — signalSummary cron (public Signals binding)
- **CAP-IDs covered:** CAP-281
- **Source contract(s):** economy contract States E + Entities `signalSummary` · register CAP-281 Notes
- **Depends on:** SLICE-P7E-01, SLICE-P7E-03/04 (ledger rows exist; zeros are valid)
- **Scope:** Cron maintains `signalSummary` per user and per Distribution: Total / Active (90d decay) / Pending. **This slice does not choose a public field in the UI** — it writes all three. The Metrics tab (P7E-09) is required to bind the triad to Active.
- **Files touched (expected):** `convex/jobs/signalSummary.ts`
- **Acceptance criteria:** CAP-281 Notes (quoted in full for the binding): "The public-facing 'Signals' number in the Reach·Signals·Awards triad is the **Active** count — the live/current measure. Total is the permanent historical record (not shown publicly as 'Signals'); Pending is transitional and not shown publicly." bible l.335 decay (quoted): "`clamp((90−days)/90,0,1)`." A test that exposes Total or Pending as the triad "Signals" label **fails this slice's consumer contract** (enforced in P7E-09; this cron must still persist all three).
- **Size check:** ≤2 days comfortably — one projection cron.

## SLICE-P7E-07 — Recognition rollup + badge.mint + Awards count + Podium projection writer + CAP-298 firewall tests
- **CAP-IDs covered:** CAP-293, CAP-294, CAP-295, CAP-297, CAP-298
- **Source contract(s):** economy contract States F · register CAP-293–298 · P6-01 (`leaderboardProjections` read-only until M12 writes)
- **Depends on:** SLICE-P7E-01, SLICE-P6-01/03 (Podium already **renders** `leaderboardProjections`; this slice **writes** them), SLICE-P5-06 (profile-completion badges exist as a Recognition-firewalled path)
- **Scope:** `recognition.rollup` from local wins — **never reads `signalLedger`**. CAP-294 writes `leaderboardProjections` (min 25 eligible else P6-03 already shows "Podium is forming"). `badge.mint` (provisional→finalized). CAP-297 updates `distributions.awardsCount` + shelf of **finalized** badges; revoked remains in audit, stays on public shelf/count per bible. CAP-298 is **test-only enforcement**: Recognition/Awards/Podium queries must not read Signal/Might/Reach tables; Signal/Might/Reach/ladder queries must not read `recognitionEvents` / `leaderboardProjections`.
- **Files touched (expected):** `convex/jobs/recognition.ts`; `convex/badges.ts`; firewall tests
- **Acceptance criteria:** CAP-293 (quoted): "never reads signalLedger." CAP-294 (quoted): "M12 computes, M9 renders; min 25 eligible else 'Podium is forming'." CAP-297 (quoted): "third public metric (Reach·Signals·Awards); not grindable." bible l.340 (quoted): "a **revoked** badge leaves the public Awards count/shelf but stays in the audit trail. **Inactivity or a Level DROP never revokes**." CAP-298 (quoted): "two currencies in different tables; never cross-reference." Economy §1 (quoted): "a reconciler finding Podium reading Level data would be a CAP-298 violation."
- **Size check:** ≤2 days — three writers + one projection + a firewall test suite. Split line: rollup+Podium writer vs mint+Awards if tests overflow.

## SLICE-P7E-08 — Reach / reachFactor / Might / monthly Level commit (+ cold-start + dormant + `tier_unlocked`)

> **UNBLOCKED 2026-09-04 — DECISIONS-LOCKED #11:** Might/reachFactor/level constants from versioned `calibration_pending` config defaults (same ruling as P7E-05).
- **CAP-IDs covered:** CAP-302, CAP-303, CAP-304, CAP-305, CAP-315, CAP-316, CAP-570 (call-site only: `tier_unlocked`)
- **Source contract(s):** economy contract States D/G/H/J · register CAP-302–305/315/316
- **Depends on:** SLICE-P7E-01, SLICE-P7E-05 (legitimacy for reachFactor), SLICE-P7E-06 (`activeSignals`), SLICE-P5-05 (`activity.append` helper)
- **Scope:** CAP-302 writes public `memberCount` (verified/active/integrity-qualified COUNT). CAP-303 writes internal `reachFactor` (Σ legitimacy) — **Has-UI NO, never shown**. `might.recompute` = √(reachFactor × activeSignals). `level.commitMonthly` with hysteresis/holdover, **no monthly demotion**. Founding Season fixed thresholds below ~1000 (315). Dormant at Might=0 for 180d (316). On a committed level change, same-mutation `activity.append(..., eventType=tier_unlocked)` (CAP-570 Phase 7 wiring point).
- **Files touched (expected):** `convex/jobs/might.ts`; `convex/jobs/levelCommit.ts`; `convex/jobs/reach.ts`
- **Acceptance criteria:** CAP-302 (quoted): "clean integer; raw all-time count admin-only." CAP-303 (quoted): "never shown publicly." A Metrics or ladder query that returns `reachFactor` or `legitimacyScores.value` **fails**. CAP-304 (quoted): "Might = √(reachFactor × activeSignals)." CAP-305 (quoted): "promotes + stabilizes; never demotes for missed month." Economy States G (quoted): "**Might continuous (CAP-304), Level committed monthly (CAP-305)** — two-speed display." CAP-315 (quoted): "Supernova+ stay silhouettes until pool large." CAP-570 (quoted): six v1 names include `tier_unlocked` — same-mutation as the commit that unlocks; append throw rolls back the commit.
- **Size check:** ≤2 days, full — four crons + one call-site. Split line: 302/303/304 vs 305/315/316 if monthly-commit tests overflow.

## SLICE-P7E-09 — `/u/[handle]` Metrics tab: triad + ladder + join/leave + CAP-312 full hide + A8
- **CAP-IDs covered:** CAP-300, CAP-301, CAP-313, CAP-312 (read-side effect; writer is CAP-552)
- **Source contract(s):** `contracts/wave-7/CONTRACT-7-profile-economy-FINAL.md` (§1, §3 B–I, §4, §6) · P5-07 reserved Metrics tab
- **Depends on:** SLICE-P5-07 (tab shell), SLICE-P7E-02 (Distribution exists), SLICE-P7E-06/07/08 (numbers to render; zeros honest), SLICE-P5-06 (CAP-552 `leaderboardOptOut`)
- **Scope:** Fill the Metrics tab on `/u/[handle]`: public triad **Reach · Signals · Awards**; ladder via `ladder.view` (current + below + next + silhouette above; three-component progress Reach% · Signal% · sustained-days). Join (deliberate, never auto) / leave (log-scaled). **A8** multi-tier cosmic ladder is an archetype gap — v1 composed from Progress Fill + pills + silhouette slots; **not invented as a new design-system token**. Anonymous and member: **one query, one render**. Opt-out: hide triad + ladder + badges (Overview Awards shelf included). Create-Distribution modal **does not render** on the normal CAP-565 path. Query projections: no `reachFactor`, no legitimacy value, no sealed keys, no Total/Pending labeled as "Signals".
- **Files touched (expected):** `convex/profile/metrics.ts`; `app/u/[handle]/` Metrics tab; `components/ladder/A8Ladder.tsx` (v1)
- **Acceptance criteria:**
  - CAP-281 binding (quoted): triad Signals = **`activeSignals`**. Total/Pending not shown publicly as "Signals."
  - CAP-312 Notes (quoted): "the opted-out profile shows none of the public triad + ladder + badges." Math unchanged (summaries still compute).
  - CAP-313 Notes (quoted): "same ladder render for both [anonymous, member]. … No separate anonymous-restricted render."
  - CAP-300 (quoted): "never auto-joined from thread/comment/download; legitimacy snapshot captured."
  - CAP-301 (quoted): "log-scaled reach effect (anti-suppression)."
  - Economy States G (quoted): "three-component progress (Reach% · Signal% · sustained-days)."
  - CAP-303 (quoted): `reachFactor` "never shown publicly."
  - Sealed keys absent from the query response (H5).
  - CAP-298: this query's Reads are `distributions`, `signalSummary`, `signalLevelDefinitions`, `distributionLevelAssignments`, `badges`, `users.leaderboardOptOut` — **not** `leaderboardProjections` / `recognitionEvents`.
- **Size check:** ≤2 days, full — one tab + two mutations + A8 v1. Split line: read/triad/opt-out vs join/leave vs A8 if visualization overflows; A8 degrades to stacked level rows + silhouette placeholder (no data-model change).

---

## SLICE-P7E-10 — M13 remaining schema + policyReasonCodes seed + version-forward copy (CAP-360 / 358 / 429)

> **UNBLOCKED 2026-09-04 — DECISIONS-LOCKED #4:** `moderationCases.policyFamily` enumerated in `_data-model.md` Core-enums: {spam · harassment_abuse · misinformation · copyright_ip · legal_other · quality_guidelines · safety_illegal}. String field may stay, but values are constrained to the literal set; dedupe key = (target, policyFamily, window).
- **CAP-IDs covered:** CAP-360, CAP-358, CAP-429; schema substrate for CAP-321–359
- **Source contract(s):** `_data-model.md` l.238–247, l.263 · moderation contract §2 · register CAP-360 / 358 / 429 · INV-M15-14
- **Depends on:** SLICE-P1-03 (`moderationCases`, `legalIntake` already exist), SLICE-P2-03 (`capabilityRestrictions`), SLICE-P1-06 (`auditLog`), SLICE-P3-07 (`/admin/config` — **additive Legal section**, not a new route)
- **Scope:** Define tables P1-03 did not: `reports`, `moderationActions`, `strikes`, `policyReasonCodes`, `adminInterventionAlerts` (if not already in a Phase 3 home-deferred schema — define here). CAP-360 seeder: reason codes including `autoReleaseEligible` flags and the four allowlist codes CAP-333 names. **Version-forward copy (same table, never in-place overwrite):** **CAP-358** Admin edits `userFacingTitle`/`userFacingBody` by inserting a **new version** row (historical code+version on cases unchanged). **CAP-429** Founder policy-copy version bump (INV-M15-14) — same helper, Founder-only actor; may also bump a `systemConfig` pointer to current version. **Not P3-08:** that screen already owns STOP/kill; putting 429 there would Depends-on this table (later-phase). UI = Legal namespace on existing `/admin/config`. **F-19 remainder already closed on the bible (2026-08-29):** `moderationCases.caseType` and `.status` transcribed from `M13-trust-safety.md` §2 l.21–22 onto the entity bullet + Core-enums. Schema validators for those two fields cite the bible, not the sheet. **`policyFamily` still has no sheet enum** — keep as string; do not invent.
- **Files touched (expected):**
  - **[BIBLE-FIX — apply now]:** none (l.244 complete).
  - **[CODE — Phase 5 build]:** `convex/schema.ts` (M13 remainder); `convex/moderation/reasonCodesSeed.ts`; `convex/moderation/reasonCodes.ts` (358/429); config Legal section.
- **Acceptance criteria:** bible `moderationCases` bullet (quoted): caseType `{ugc_safety|ugc_conduct|spam_manipulation|account_integrity|store_commercial|merchant_ip|source_takedown|dmca|resource_rights|appeal|moderator_conduct|hard_harm}` and status `{open|triaged|claimed|awaiting_user|awaiting_legal|awaiting_external|actioned|resolved_no_action|appealed|closed|auto_released_aged}` — schema unions match. bible l.239 (quoted): "Many → one open case per target+policyFamily+window; volume ≠ guilt." CAP-333 allowlist (quoted): "profanity_soft / off_topic_uncertain / low_substance / wrong_post_type_uncertain" — those four exist as seeded codes with `autoReleaseEligible` consistent with CAP-323 (classifier-unavailable **never** autoReleaseEligible). bible l.244 (quoted): "Cases store code+version, never rendered copy" + "Legal-mutable via **new version**, never in-place overwrite." CAP-358 Notes (quoted): "Legal/Admin new version; never in-place overwrite." CAP-429 Notes (quoted): "Versions forward; no in-place overwrite."
- **Size check:** ≤2 days, full — four/five tables + seeder + two version-forward mutations on an existing config screen. Split line: schema+360 vs 358/429 if overflow.

## SLICE-P7E-11 — autoGate + URL-obfuscation hold (wire into existing submit paths)
- **CAP-IDs covered:** CAP-321, CAP-322, CAP-323, CAP-102
- **Source contract(s):** moderation contract States L · register CAP-321–323, CAP-102
- **Depends on:** SLICE-P7E-10, SLICE-P4-02 (`posts.create`), SLICE-P5-02 (`comments.create`), SLICE-P1-06 (audit)
- **Scope:** Named autoGate on post/comment submit: URL/length/dup/velocity → pass/hold/hard reject; writes `moderationCases` + `moderationActions`. Optional classifier (322) **cannot sanction**. Timeout/unavailable → `HELD_FOR_REVIEW`, `autoReleaseEligible=false` (323) — never fail-open. CAP-102: repeated URL-obfuscation → `posts.moderationStatus=held` + case. **Does not replace** P4-02 R-URL or P5-02 CAP-154; it is the M13 case-visibility layer those submits were missing as a named CAP.
- **Files touched (expected):** `convex/moderation/autoGate.ts`; call-sites in `convex/posts.ts` / `convex/comments.ts`
- **Acceptance criteria:** CAP-321 (quoted): "deterministic checks → pass/hold/hard reject (URL/dup)." CAP-322 (quoted): "cannot sanction (INV-4)." CAP-323 (quoted): "never fail-open; aged release never applies (C1)." CAP-102 (quoted): "Repeated attempts → route to moderation queue (held)." Classifier-unavailable holds are never `autoReleaseEligible` (contract States H, quoted).
- **Size check:** ≤2 days — one gate module + two call-sites + CAP-102 counter. Classifier may be a stub that always takes the CAP-323 path until a vendor is named — flagged, not invented.

## SLICE-P7E-12 — Report submit (comment target) + rate limit

> **UNBLOCKED 2026-09-04 — DECISIONS-LOCKED #4:** report submit writes the enumerated `policyFamily` literal (see P7E-10); one-case-per-(target+policyFamily+window) dedupe is now implementable and testable.
- **CAP-IDs covered:** CAP-324, CAP-325
- **Source contract(s):** moderation contract States S · register CAP-324/325 · discussion thread (Report affordance)
- **Depends on:** SLICE-P7E-10, SLICE-P5-03 (comment exists), SLICE-P2-03 (capability key `report`)
- **Scope:** `report.submit` on the **comment** (H6 — not re-litigated). Dedupe: many reports → one open `moderationCases` per target+policyFamily+window. Rate: verified 10/24h, 30/7d; critical ≤5/hr. Modal lives on `/p/[slug]` thread (P5-03), not on the admin console.
- **Files touched (expected):** `convex/moderation/report.ts`; Report modal on thread
- **Acceptance criteria:** CAP-324 (quoted): "many reports → one open case per target+policyFamily+window." CAP-325 (quoted): "verified 10/24h, 30/7d; critical ≤5/hr mechanical." Target type = comment. Inventory "ENTITY UNCLEAR" must not propagate (contract §1, quoted): "must not propagate."
- **Size check:** ≤2 days — one mutation + one modal + rate keys (P1-09 pattern).

## SLICE-P7E-13 — Domain moderator mutations (first implementation of CAP-101/103/114) + comment moderate
- **CAP-IDs covered:** CAP-101, CAP-103, CAP-114, CAP-135
- **Source contract(s):** moderation contract §4 rows 1–3, 4 · States K/M/N · register E-mod-2 Notes
- **Depends on:** SLICE-P7E-10, SLICE-P4-05 (CAP-533 cases already in queue; R-AGG recompute), SLICE-P4-15 (CAP-098/100 **real writers** — do not fixture), SLICE-P4-01 (`postShowcases` / Help/vote tables), SLICE-P5-01 (comments), SLICE-P3-01 (narrow Moderator gate)
- **Scope:** Implement the four moderator mutations **for the first time** (V2). Each writes domain tables **and** `moderationCases` (polymorphic target per E-mod-2) **and** `auditLog`. CAP-114 applies R-AGG delta; held/removed/withdrawn stay excluded by P4-05 recompute. **Do not re-implement CAP-533.** **CAP-098/100 are P4-15** — tests use those mutations, not fixtures. Surfaces are **actions on a case card**, not sub-tabs.
- **Files touched (expected):** `convex/admin/moderationDomain.ts`
- **Acceptance criteria:** CAP-101 Notes (quoted): "writes moderationCases for queue-surfacing (CAP-330 ordering) … target=postShowcases row … Only `approved` renders outbound button." CAP-103 Notes (quoted): "target=the relevant mechanic table's row." CAP-114 Notes (quoted): "Reversal applies corresponding delta; held/removed/withdrawn excluded from aggregate regardless of score" + "target=toolRatings row." CAP-135 (quoted): "Tombstone; held/rejected fail-closed." E-mod-2 (quoted): "**no special UI, no sub-tabs, no separate panels.**" Audit fail-closed (CAP-426). Every `moderationCases` write uses bible `caseType` / `status` unions (quoted from the `moderationCases` bullet): caseType `{ugc_safety|ugc_conduct|spam_manipulation|account_integrity|store_commercial|merchant_ip|source_takedown|dmca|resource_rights|appeal|moderator_conduct|hard_harm}`; status `{open|triaged|claimed|awaiting_user|awaiting_legal|awaiting_external|actioned|resolved_no_action|appealed|closed|auto_released_aged}`. `hard_harm` remains Founder-only. **`policyFamily` is still unenumerated on the sheet** — stop-and-report only if a write needs a named family literal; do not invent.
- **Size check:** ≤2 days — four mutations, one pattern. CAP-098/100 member writers = **P4-15**.

## SLICE-P7E-14 — `/admin/moderation` queue console: order, claim/lease, aging, auto-release, batch, s2/s3
- **CAP-IDs covered:** CAP-328, CAP-329, CAP-330, CAP-331, CAP-333, CAP-335, CAP-359, CAP-400, CAP-433
- **Source contract(s):** `contracts/wave-7/CONTRACT-7-admin-moderation-FINAL.md` (§1, §3 A/B/D/H/R, §4, §6)
- **Depends on:** SLICE-P3-01/04/05 (shell + A1 + **A12**), SLICE-P7E-10–13, plus **consume-only:** P4-05 (533), P5-02 (154), P5-03 (127), P6-15 (268), P6-18 (561)
- **Scope:** Build `/admin/moderation` on **A12** (no hand-rolled board). CAP-330 ordering (quoted): **s0 → legal → s1 → appeals near bound → s2 → s3**; **report count not a sort key**. Claim/lease 20m · renew 5m · max 60m; **CAP-400** shared-lease with Home when Home exists — until then, lease is still atomic on this console (**this slice owns the lease write**). `lease.expire` cron. `queue.age` (331); **s1 "8oh"** treated as **8h** (contract OQ7 typo, flagged, not invented as a new unit). S3 auto-release @96h with allowlist + completed gate (333). Batch max 25, five allowlisted verbs only (335). CAP-359 clears s2/s3. Widget catalog row. Two-layer authz: shell CAP-390, route CAP-392, per-action Actor columns. **CAP-433:** Administrator may take moderator claim/resolve via this Admin-app surface (R-RBAC) — **same mutations**, not a second console.
- **Files touched (expected):** `convex/admin/moderationQueue.ts`; `convex/jobs/moderationLease.ts`; `convex/jobs/queueAge.ts`; `app/admin/moderation/`; adminWidgets catalog row
- **Acceptance criteria:** CAP-330 (quoted): "s0 → legal → s1 → appeals near bound → s2 → s3" + "report count not a sort key." CAP-328 (quoted): "atomic claim; expired → triaged." CAP-400 Notes (quoted): "20m lease / 5m renew / 60m max; shared across widgets; cross-widget same case = one lease." CAP-433 Notes (quoted): "Admin may act as moderator." Queue claim/expire transitions stay inside the bible `moderationCases.status` union (quoted): `{open|triaged|claimed|awaiting_user|awaiting_legal|awaiting_external|actioned|resolved_no_action|appealed|closed|auto_released_aged}` — expired → `triaged` is a member of that set. CAP-335 (quoted): "never batch ban/DMCA/RI/clawback/critical." CAP-333 (quoted): "allowlist: profanity_soft/off_topic_uncertain/low_substance/wrong_post_type_uncertain; same revision; not a strike." One board, many `targetType`s — CAP-101/103/114/127/135/154/268/324/533/561 cases appear in the **same** ordered list. Sealed M12 keys absent (H5).
- **Size check:** ≤2 days, full — console + three crons + batch. Split line: queue+claim+order vs aging/auto-release/batch if overflow.

## SLICE-P7E-15 — Sanctions ladder + brigade restrict + terminate
- **CAP-IDs covered:** CAP-326, CAP-327, CAP-336, CAP-337
- **Source contract(s):** moderation contract States E/F/O · register CAP-326/327/336/337
- **Depends on:** SLICE-P7E-14 (claimed case), SLICE-P2-03 (`capabilityRestrictions` + `assertCustomerCapability`), SLICE-P7E-05 optional (`engagementEdges` for brigade cron — if 286 not built, CAP-326 uses reports correlation only and flags the graph reuse as degraded)
- **Scope:** Brigade detection cron (326) → confirmed restrict `report` (327). Sanction ladder warn → strike → restrict → suspend (336) with named capability keys. Terminate Admin/Founder only (337); Mods rejected server-side. Writes `trustHistory`. CAP-354 M12 bridge (`m12.emitConfirmed`) is a **one-line emit into P7E-04 clawback**, not a legitimacy recompute (quoted: "M13 never recomputes legitimacy; M12 owns clawback") — wire if P7E-04 exists; else flag.
- **Files touched (expected):** `convex/admin/sanctions.ts`; `convex/jobs/brigade.ts`
- **Acceptance criteria:** CAP-336 (quoted): "escalate by strike class; capability keys incl create_post/create_comment/react/report/manage_store/tag_product/revival_vote." CAP-337 (quoted): "Admin/Founder only; Mods may not terminate." CAP-327 (quoted): "explicit capability restriction." Next-request enforcement via existing CAP-430/CAP-005. Typed-confirm on terminate (§11.7).
- **Size check:** ≤2 days — three mutations + one cron. Strike-class duration table unspecified (OQ8) — config-keyed, stop-and-report if missing.

## SLICE-P7E-16 — Appeal resolve + SLA tick (submit fenced)
- **CAP-IDs covered:** CAP-341, CAP-342
- **Source contract(s):** moderation contract States G · `contracts/wave-7/CONTRACT-7-appeal-FINAL.md` (consumed, route not built)
- **Depends on:** SLICE-P7E-14, SLICE-P7E-15 (a sanction exists to appeal). **CAP-340 is not built here** — fixtures until **P7T-04** populates appeal cases so "appeals near bound" is testable (do not Depends-on that later sub-batch).
- **Scope:** `appeal.resolve` within 7 business days. `appeal.slaTick` → Admin escalation, **not** auto-deny/restore; safety holds not auto-restored. Console column uses CAP-330's "appeals near bound" slot.
- **Files touched (expected):** `convex/admin/appeals.ts`; `convex/jobs/appealSla.ts`
- **Acceptance criteria:** CAP-341 (quoted): "overdue → Admin escalation (not auto-deny/restore)." CAP-342 (quoted): "safety holds not auto-restored." Fence: `/appeal/[actionId]` + CAP-340 remain **P7T-04**. Empty appeals slot with a fixture case is an acceptable demo for this slice.
- **Size check:** ≤2 days comfortably — one mutation + one cron.

## SLICE-P7E-17 — MAX refresh (CAP-132) + context-signal review (CAP-137) + plugin/MAX operator actions (CAP-136/138)
- **CAP-IDs covered:** CAP-132, CAP-136, CAP-137, CAP-138
- **Source contract(s):** moderation contract §4 rows 5–7 · States J/P/Q · P5-03 placeholder ("rendering empty until Phase 7's CAP-132")
- **Depends on:** SLICE-P5-01/03 (comments; MAX refs empty), SLICE-P7E-14 (console slots), SLICE-P3-01 (CAP-136 administrator vs CAP-138 Moderator/administrator — E-mod-1)
- **Scope:** Define `threadIntelligenceRuns` / `threadThemes` / `threadPositions` / `threadQuestions` if P5-01 omitted them (P5-03 Reads them; **no Phase 5 schema slice listed them** — flag and define here). CAP-132 cron: first ~10–20 human comments; +20 or 6h; persona-exclusion at input. CAP-138 force-trigger from this console. CAP-137 resolves `commentContextSignals` (from P5-03 CAP-127) — contract OQ6 (parallel sub-queue vs CAP-330 case) **unpinned**: v1 = review actions on the same A12 board as a `targetType=commentContextSignal` case **or** a side panel that still uses A12 cards, **not** a second board component. CAP-136 `pluginRegistry.setEnabled` (typed keys only). Scope-placement OQ5 unresolved — **land on this screen as the contract Actions table specifies**; do not invent `/admin/governance`.
- **Files touched (expected):** `convex/jobs/maxRefresh.ts`; `convex/admin/threadGov.ts`; schema patch if needed
- **Acceptance criteria:** CAP-132 (quoted): "Async, never blocks MIN. Persona-exclusion at input." CAP-138 Actor (quoted): "Moderator, administrator." CAP-136 (quoted): "Predefined typed keys + bounded values only (no executable)." CAP-137 (quoted): "never lowers Best (INV-3)." P5-03 MAX placeholder replaced with real refs when a run exists; empty remains honest if cron has not fired.
- **Size check:** ≤2 days, borderline — MAX compute is the risk. Split line: schema+132 cron vs 136/137/138 console actions. If MAX model/vendor is unnamed, cron writes empty-success runs (same class as P6-02 "missing MAX → neutral fallback") and flags — do not invent a model.

## SLICE-P7E-18 — M12 season / promote / demote / discoverer + store-metrics skeleton (CAP-306–311 / 314 / 319)

- **CAP-IDs covered:** CAP-306, CAP-307, CAP-308, CAP-309, CAP-310, CAP-311, CAP-314, CAP-319
- **Source contract(s):** register CAP-306–311/314/319 · M12 R-PROMOTE / R-SEASON / R-MILESTONE / R-DEMOTE / R-REVEAL / R-PHASE2 · P7E-08 Level commit
- **Depends on:** SLICE-P7E-08 (Level assignments exist), SLICE-P7E-01 (`signalSeasons` / `signalLevelDefinitions` / `badges`), SLICE-P7E-07 (`badge.mint`), SLICE-P6-12 (store enabled for 319)
- **Scope:** The declared M12 **YES** remainder that Metrics zero-state did not require. **CAP-307** `season.recalibrate` at Season boundary (T-30 announce; T-0 freeze; T+1 publish) recomputes percentile breakpoints + freezes thresholds. **CAP-308** threshold precedence = min(percentileCandidate, priorSeasonThreshold×1.50) — 50% cap → “transition threshold” label. **CAP-309** Multiverse dual gate (percentile floor AND absolute top ~100). **CAP-306** immediate promotion + permanent milestone badge (sustained ~30d above line + ≥2 outcome families + integrity clear). **CAP-310** annual routine demotion (max 1 level, holdover grace ~10%; accuracy framing not punishment; first visible = preserved Peak badge). **CAP-311** integrity correction drops Level immediately (not “competitive demotion”). **CAP-314** first-to-reach newly-unlocked level → discoverer badge. **CAP-319** Phase-2 store metrics skeleton (Sales/Review Score/Vouch) **only when store enabled**; no-op if storefronts not active — do not invent store Signal math beyond the skeleton. **Not this slice:** CAP-282/286–292/317 (Has-UI=NO → **FUTURE-M12-01**); CAP-320 (register DEFERRED → **FUTURE-M12-02**); CAP-318 (**already P7A-06**); CAP-285 (**P7E-03**).
- **Files touched (expected):**
  - **[BIBLE-FIX — apply now]:** none (season/level bullets complete; `thresholds{orbit…multiverse}` already expanded in this catalog’s header).
  - **[CODE — Phase 5 build]:** `convex/jobs/seasonRecalibrate.ts`; `convex/signal/promoteDemote.ts`; `convex/badges.ts` discoverer path.
- **Acceptance criteria:** CAP-307 Notes (quoted): “T-30 announce; T-0 freeze; T+1 publish.” CAP-308 Notes (quoted): “50% cap binds → ‘transition threshold’ label.” CAP-309 Notes (quoted): “legendary at any scale.” CAP-310 Notes (quoted): “accuracy framing not punishment; first visible = preserved Peak badge.” CAP-311 Notes (quoted): “not ‘competitive demotion’.” CAP-314 Notes (quoted): “discoverer badge type.” CAP-319 Notes (quoted): “Vouch: one per member, revocable, 12mo reconfirm, legitimacy-gated.”
- **Size check:** ≤2 days, full — season cron + promote/demote + two badge types. Split line: 307/308/309 vs 306/310/311/314 if overflow. 319 is a gated skeleton, not a third console.

---

## Dependency graph (within 7-ECON)

Ordered list; items on the same line are parallelizable after their dependencies land.

1. **SLICE-P7E-01** (M12 schema) and **SLICE-P7E-10** (M13 remainder schema + CAP-360) — parallel (different regions)
2. **SLICE-P7E-02** (F-11 + CAP-299 defensive) — after 01 + P6-12
3. **SLICE-P7E-05** (legitimacy) — after 01
4. **SLICE-P7E-03** then **SLICE-P7E-04** (award → settle) — after 01 + 05
5. **SLICE-P7E-06** (signalSummary) — after 03/04 (zeros allowed earlier)
6. **SLICE-P7E-07** (Recognition/Awards/Podium writer + firewall tests) — after 01; **must not read signalLedger**
7. **SLICE-P7E-08** (Reach/Might/Level + `tier_unlocked`) — after 05 + 06
8. **SLICE-P7E-09** (Metrics tab) — after 02 + 06/07/08 + P5-07
9. **SLICE-P7E-11** (autoGate) and **SLICE-P7E-12** (report) — after 10; parallel; wire into P4-02/P5-02/P5-03
10. **SLICE-P7E-13** (101/103/114/135) — after 10 + P4-05 + **P4-15** (real 098/100)
11. **SLICE-P7E-14** (queue console) — after 11/12/13 + P3-05 A12 + consume 533/154/127/268/561
12. **SLICE-P7E-15** (sanctions) — after 14
13. **SLICE-P7E-16** (appeal resolve/SLA) — after 15
14. **SLICE-P7E-17** (MAX + 136/137/138) — after 14 + P5-03; parallel with 15/16
15. **SLICE-P7E-18** (season/promote/demote/discoverer/store-skeleton) — after 08 + 07

**CAP-057-class ownership line (economy):** public Signals binding lives in **P7E-09** (read), fed by **P7E-06** (write all three summary fields). A slice that labeled Total as "Signals" fails the batch.

**CAP-057-class ownership line (moderation):** queue **order** is P7E-14 (CAP-330). Domain **writes** that populate cases are P7E-11/12/13 plus prior phases' 154/127/268/561/533. P7E-14 must not re-implement those writes.

**Phase 7-ECON exit gate (this sub-batch):** (1) `/u/[handle]` Metrics shows a real Distribution (never null) with triad Signals = `activeSignals`, opt-out hiding the full economy surface, identical anonymous/member ladder; Podium queries still do not read Level tables. (2) `/admin/moderation` renders one A12 board ordered s0 → legal → s1 → appeals near bound → s2 → s3, including CAP-101/103/114 cases as normal rows; sealed keys absent from both surfaces.

---

## Flags carried forward (stated, not silent)

- **CAP-565 create-writer** — already P6-12; this batch consumes + F-11 backfill.
- **CAP-098 / CAP-100** — **owned by P4-15** (2026-08-29 SF-02). P7E-13 **consumes** real member writers; do **not** fixture Help-accept or Showcase URL submit.
- **CAP-340 `/appeal/[actionId]`** — **P7T-04** submits; P7E-16 resolves/SLA only. Fixtures until P7T-04 lands (do not Depends-on a later sub-batch).
- **CAP-332 / CAP-334** — queue-load alerts + >500 throttle; **P7A-06** (AdminCore). 7-ECON deferred both; closure placed 334 with 332 (register **M13**).
- **CAP-338 / CAP-339 / CAP-343–353** — RI page + legal intake; 7-LEGAL.
- **CAP-282 / 286–292 / 317** — Has-UI=NO graph/grace/brakes/anti-suppression internals. **FUTURE-M12-01** (ledgered 2026-08-29). P7E-05 still must not invent them.
- **CAP-285** — **P7E-03** (shadow-damp on the award path).
- **CAP-306–311 / 314 / 319** — **P7E-18** (this firing’s remainder close).
- **CAP-318** — **P7A-06** (already covered; was mislisted as unsliced M12 remainder).
- **CAP-320** — register DEFERRED collaborative DN. **FUTURE-M12-02**.
- **CAP-358 / CAP-429** — **P7E-10** (Admin + Founder version-forward copy on `policyReasonCodes`; UI = `/admin/config` Legal section). Not P3-08 (later-phase schema).
- **CAP-136/138 scope-placement (OQ5)** — landed on this console per Actions table.
- **CAP-137 vs CAP-330 (OQ6)** — unpinned; v1 uses A12, not a second board.
- **`moderationCases.caseType` / `.status` (OQ3 remainder)** — **closed** on the bible 2026-08-29 (M13 §2 l.21–22). **`policyFamily` still unenumerated** — field exists for INV-2; no sheet line; founder call if a literal set is needed (do not alias to `strike.class` without that call). "s1 8oh" (OQ7) — treat as **8h**.
- **A8 archetype (economy OQ9)** — v1 composed, not a new §11 token.
- **Economy OQ7/OQ8** (Reach formula; owner vs third-party ladder) — stop-and-report if a write needs a formula the corpus does not state; default render is the same query for owner and visitor (OQ8 unpinned — same render is the E-econ-1 posture unless a later founder call splits it).
- **CAP-565/566 on the firing's moderation list** — rejected as console CAPs (see extra-scrutiny).
- **bible l.125 stale Signals sentence** — do not implement from it.
- **Phase 4 autoGate stub claim** — closed by P7E-11 as the first named owner.
