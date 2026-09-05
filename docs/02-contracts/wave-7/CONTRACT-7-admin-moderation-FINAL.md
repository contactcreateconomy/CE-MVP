# CONTRACT-7-admin-moderation-FINAL

**Screen:** Moderation Console / Case Queue — `/admin/moderation`
**Wave:** 7C (M13 Trust, Safety & Moderation)
**Template archetype:** Operator case queue + detail
**Primary CAP-IDs:** CAP-101, 102, 103, 114, 135, 136, 137, 138, 327, 328, 329, 330, 333, 335, 336, 337, 341, 342, 359
**Actors:** Moderator, administrator (per-action authority narrower — terminate is Admin/Founder only)
**Register basis:** 565-row register at Wave 7C close (CAP-565 added); register is now **567** after Wave 7D's CAP-566/567 — no Wave 7C rows affected by those additions. ~~CAP-138 actor mismatch confirmed.~~ **E-mod-1 CLOSED 2026-08-26 — CAP-138 Actor corrected to Moderator, administrator.** **E-mod-2 CLOSED 2026-08-26 — CAP-101/103/114 now write `moderationCases`** (polymorphic target pattern).
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. States: enum-backed set adopted (resolved on register evidence — GPT's ~200 per-value states folded). Two escalations touch this screen. See RECONCILIATION-7C §2.

---

## 1. Route & Access
- **Path:** `/admin/moderation`, no params. **Inventory Actors:** Moderator, administrator. **Two-layer authz (Wave-7B E2 model):** shell entry = any staff role (CAP-390), route = CAP-392, narrow gate = each CAP's own Actor column. Admin URLs noindex (CAP-486). CAP-019 (60/1m); audit fail-closed (CAP-426).
- **Per-CAP narrow gates:** Moderator (101, 103, 114, 135, 137, 327, 328, 335, 336, 341, 359, **138 — Actor corrected 2026-08-26**) · administrator (136) · **Admin/Founder-only (337 — "Mods may not terminate")** · System/cron (102, 329, 330, 333, 342 — not screen-access actors).
- **E-mod-1 CLOSED 2026-08-26:** CAP-138 Actor corrected from "Editor, Publisher, administrator" to **Moderator, administrator** — matching this screen's inventory set (line 108, which already read correctly; the register row lagged). Editor/Publisher removed; no other surface loses access (CAP-138's only surface is this console per its "UI: admin console" note).
- **Intake confirmed (both producers + more):** **CAP-324** `report.submit` → R-REPORT-DEDUPE (many reports → **one open case per target+policyFamily+window**; volume ≠ guilt) writes `moderationCases` directly. **CAP-127** `context.signal` → routes to CAP-137's context-signal review queue (`commentContextSignals`) → resolves into reports/moderationActions. The inventory's stale **CAP-324 "ENTITY UNCLEAR"** overlay tag is **resolved** (§2 G5, 2026-08-09; the full Report button was always unambiguous) — must not propagate. Also feeding: CAP-102 (URL-obfuscation held), CAP-154 (M7 pre-publish safety), CAP-321–323 (autoGate + classifier-unavailable → HELD_FOR_REVIEW, never fail-open), CAP-326→327 (brigade), CAP-383 (reply-flood), CAP-561 (product-owner hide).

## 2. Entities

| Entity | Direction | Detail (CAP) |
|---|---|---|
| `moderationCases` | read + write (328/335/341/359; System 329/333/342; **101/103/114 queue-surfacing — E-mod-2 CLOSED**) | caseType · targetType · targetId · policyFamily · **severity {s0_critical\|s1_high\|s2_medium\|s3_low}** · priority · status · reasonCode · policyVersion · autoReleaseEligible? · preserveUntil? · reporterCountDistinct · claimedByUserId? · leaseExpiresAt? · agingLevel · parentCaseId? — ⚠️ status/caseType/policyFamily enums not enumerated in the data-model (M13 sheet owns; Open Question) |
| `moderationActions` | write (135/335/336/337/341/359; System 333) | actorUserId · actorRole · action · reasonCode · policyVersion · reversible · before/afterState · **idempotencyKey** · appealDeadlineAt? |
| `reports` | read + write (137) | reporterId · reasonCode · dedupeKey · caseId? |
| `legalIntake` | read (330 queue ordering) | ✓ canonical post-7A — **Standing-Rule-2 sweep clean** (no dmcaNotices/takedownRequests residue) |
| `policyReasonCodes` | read (333 auto-release allowlist) | code+version stored on cases |
| `posts` · `comments` | write (102/135/333/359) | moderationStatus transitions |
| `postShowcases` | write (101) | approvalStatus {none·pending·approved·rejected} |
| `toolRatings` + `tools` | write (114) | status/moderationStatus + **R-AGG delta reversal** |
| `postHelps` · `debateVotes` · `listItemVotes` · `postDebates` · `postListItems` | write (103) | abusive accepted-mechanic teardown |
| `commentContextSignals` | read + write resolved (137) | signalType {context_needed·outdated} |
| `capabilityRestrictions` · `strikes` · `trustHistory` · `users` | write (327/336/337) | sanction ladder + standing |
| `threadPluginConfig` (136) · `threadIntelligenceRuns` (138) | write | governance config (scope-placement Open Question) |
| `adminInterventionAlerts` | write (System 342) | appeal-SLA escalation |
| `auditLog` | write (all actions) | never deletable |

## 3. States
*(Enum-backed set. GPT's ~200 transient states — each queue-order pair, each capability-key restriction, each sanction step as its own state — folded, since the `severity` (4), `moderationCases.status`, the 8 rejection/allowlist reason codes, and the sanction/capability-key enums are authoritative. Resolved on register evidence, not vote — see RECONCILIATION-7C §2.)*

**A. Queue ordering (CAP-330, verbatim):** **s0 → legal → s1 → appeals near bound → s2 → s3**; **report count not a sort key**.
**B. Claim/lease (328/329 + CAP-400 shared-lease):** unclaimed → **claimed (lease 20m · renew 5m · max 60m; atomic)** → renewed → **expired → triaged** (cron `lease.expire`, takeover audited); **one lease cross-widget** (Home's CAP-400 shares it).
**C. Severity:** s0_critical · s1_high · s2_medium · s3_low + legal (from legalIntake).
**D. Batch mode (335):** **max 25**; **only** approve_and_publish · reject_off_topic · reject_duplicate · clear_profanity_hold · suppress_duplicates; **never batch ban/DMCA/RI/clawback/critical**.
**E. Sanction ladder (336):** warn → strike → restrict → suspend; escalate by strike class; capability keys: **create_post · create_comment · react · report · manage_store · tag_product · revival_vote**; writes trustHistory.
**F. Termination (337):** TERMINATED — **Admin/Founder only; Mods may not**; gated CAP-336; enforcement next request (CAP-430 class).
**G. Appeals (340→341/342):** submitted (off-screen) → **resolved within 7 business days** · **overdue → Admin escalation — NOT auto-deny/restore** · **safety holds not auto-restored** (342 cron → adminInterventionAlerts).
**H. Aging/auto-release (331→333):** thresholds verbatim "s0 unclaimed 1h page Admin; **s1 8oh** [likely 8h — typo flagged]; s2 3d; s3 7d"; **S3 auto-release @96h** requires **autoReleaseEligible=true + completed gate + allowlist reason codes only** (profanity_soft · off_topic_uncertain · low_substance · wrong_post_type_uncertain) + **same revision + not a strike**. Classifier-unavailable holds are **never** autoReleaseEligible (CAP-323, C1).
**I. Queue-load (332/334, rendered via Home):** soft alerts at open-case **250/400**; **>500 → ingest.throttle** with carve-outs — **must not stop appeals/legal/erasure/safety/existing-case/Admin**.
**J. Context-signal review (127→137):** hidden until threshold; **never lowers Best (INV-3)**; resolution states.
**K. Showcase URL review (101):** pending → approved/rejected; **only approved renders the outbound button**.
**L. URL-obfuscation holds (102):** repeated attempts → `moderationStatus=held`.
**M. Comment moderation (135):** tombstone · hold · reject — **held/rejected fail-closed**.
**N. Rating moderation (114):** hold · remove · restore; **reversal applies the corresponding R-AGG delta**; **held/removed/withdrawn excluded from aggregate regardless of score**.
**O. Brigade (326→327):** correlated dismissed reports → new case → confirmed → **restrict_capability(report)**.
**P. Plugin registry (136) / Q. MAX refresh (138):** governance config (scope-placement Open Question).
**R. s2/s3 resolution (359):** Moderator clears holds; posts/comments state restored same-action.
**S. Intake dedupe (324):** many reports → **one open case per target+policyFamily+window**.
- **E-mod-2 CLOSED 2026-08-26 (founder decision):** CAP-101/103/114 **now write `moderationCases`** (polymorphic target: `postShowcases` row / the relevant mechanic-table row / `toolRatings` row) — same polymorphic case model as CAP-127/135/154/268/324; target typing matches CAP-533. These three action types appear in the **normal case-ordered queue (CAP-330) like everything else — no special UI, no sub-tabs, no separate panels needed.** Domain tables remain the detail record; `moderationCases` is the queue-visibility layer.

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| Approve/reject Showcase URL | Moderator | CAP-101 `showcase.reviewProjectUrl` | postShowcases, **moderationCases (target=postShowcases row)**, auditLog | CAP-100 |
| Force-clear abusive Help/vote | Moderator | CAP-103 (unnamed; §11 Moderator abuse) | postHelps, debateVotes, listItemVotes, postDebates, postListItems, **moderationCases (target=mechanic-table row)**, auditLog | CAP-098 |
| Hold/remove/restore rating | Moderator | CAP-114 `toolRatings.moderate` | toolRatings, tools (R-AGG delta), **moderationCases (target=toolRatings row)**, auditLog | CAP-112 |
| Moderate comment | Moderator | CAP-135 (unnamed; §11 governance) | comments (moderationStatus), auditLog, moderationCases, moderationActions | M13 RBAC |
| Toggle thread plugin | administrator | CAP-136 `pluginRegistry.setEnabled` | threadPluginConfig, auditLog | none |
| Review context-signal queue | Moderator | CAP-137 (unnamed) | reports, moderationActions, auditLog, commentContextSignals (resolved) | CAP-127 |
| Force MAX refresh | Moderator/admin (**E-mod-1 CLOSED**) | CAP-138 (unnamed) | threadIntelligenceRuns, auditLog | CAP-132 |
| Restrict report capability | Moderator | CAP-327 `restrict_capability(report)` | capabilityRestrictions, auditLog | CAP-326 |
| Claim case | Moderator | CAP-328 `case.claim` | moderationCases (claimedByUserId, leaseExpiresAt), auditLog | CAP-324 |
| (cron) Expire lease | cron | CAP-329 `lease.expire` | moderationCases, auditLog | CAP-328 |
| (cron) S3 auto-release | cron | CAP-333 | moderationCases, moderationActions, posts, comments, auditLog | CAP-331 |
| Batch action | Moderator | CAP-335 (unnamed; 5 allowlisted verbs) | moderationActions, moderationCases, auditLog | CAP-328; ≤25 |
| Apply sanction | Moderator | CAP-336 (unnamed; warn/strike/restrict/suspend) | users, strikes, capabilityRestrictions, moderationActions, trustHistory, auditLog | CAP-328 |
| Terminate account | Admin/Founder | CAP-337 (unnamed) | users, moderationActions, auditLog | CAP-336 |
| Resolve appeal | Moderator | CAP-341 `appeal.resolve` | moderationCases, moderationActions, auditLog | CAP-340; 7bd |
| (cron) Appeal SLA tick | cron | CAP-342 `appeal.slaTick` | moderationCases, adminInterventionAlerts, auditLog | CAP-340 |
| Resolve s2/s3 hold | Moderator | CAP-359 (unnamed) | moderationCases, moderationActions, posts, comments, auditLog | CAP-328 |

## 5. Analytics Events
**None** — no primary row writes rawEvents; staff actions are excluded from product counters (CAP-434 R-STAFF); **`auditLog` is the accountability record** (100% of mod actions, never deletable incl. by erasure). CAP-354 (`m12.emitConfirmed`) bridges confirmed facts to M12, but that's a separate M13 row not on this screen.

## 6. Components Used
- **A1 Data table** (inventory §3 explicitly lists /admin/moderation — highest-priority gap) · **A12 queue/case board (soft gap)** — claim/lease/aging affordances undefined · §11.5 severity pills (s0–s3, strike class, lease state) · §11.7 confirm modals (termination typed-confirm, batch-25, sanctions) · §11.8 inline errors (fail-closed rejections) · §11.9 skeletons · §12.4 admin layout via shell.

## 7. Open Questions
*(Escalated items in RECONCILIATION-7C. These are unspecified detail.)*
1. ~~**CAP-138 actor set** (Editor/Publisher) vs screen Actor(s) (Moderator/administrator).~~ **→ CLOSED (E-mod-1, 2026-08-26): register Actor corrected to Moderator, administrator; inventory already read correctly.**
2. ~~**CAP-101/103/114 don't write `moderationCases`** yet the queue is case-ordered (CAP-330) — surfacing path undefined.~~ **→ CLOSED (E-mod-2, 2026-08-26): all three now write `moderationCases` with polymorphic targets — they surface in the normal case-ordered queue, no special UI. See States S note.**
3. **`moderationCases.status` / `caseType` / `policyFamily` enums** not enumerated in the data-model (M13 decisions doc owns). (All three.)
4. **Eight unnamed mutations** (103, 135, 137, 138, 335, 336, 337, 359). (GLM + GPT + Opus.)
5. **CAP-136 (plugin config) + CAP-138 (MAX refresh) are governance/config, not case-queue actions** — scope-placement (this screen vs a separate M15 governance surface) unresolved. (Opus.)
6. **Context-signal queue (137) vs main case queue (330)** — whether an escalated context-signal becomes a `moderationCases` row in CAP-330 ordering, or stays a parallel sub-queue, is unpinned. (Opus.)
7. **"s1 8oh" aging typo.** (GLM, verbatim.)
8. **CAP-335 partial-failure transaction semantics + sanction durations/strike-class escalation table** — not fully enumerated. (GPT.)
9. **Inventory overlays note still tags CAP-324 "ENTITY UNCLEAR"** though §2 G5 resolved it — sync debt. (GLM + GPT + Opus.)

---

## ADDENDUM 2026-09-04 — DECISIONS-LOCKED #4 (F-35 resolved)

`moderationCases.policyFamily` is now enumerated (also in `_data-model.md`
Core-enums): **{spam · harassment_abuse · misinformation · copyright_ip ·
legal_other · quality_guidelines · safety_illegal}**. `copyright_ip` routes to
legal intake; `safety_illegal` carries highest severity / fastest SLA. Dedupe key
= (target, policyFamily, time window) — OQ on the enum is closed; report writers
map their reason codes onto this set.
