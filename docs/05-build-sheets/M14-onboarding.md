# DECISION — M14: Onboarding & Retention (Build Sheet · CONFIRMED)

**Status:** **CONFIRMED + CLOSED** · BACKEND LOCKED · **DESIGN HIT** (GPT 94 / GLM 94 / Sonnet 88 / Opus 87) · **CONFIRMATION HIT** (GPT 96 / GLM 96 / Sonnet 96 / Opus 91 — mean ~94.8; confirm C1–C2 + hardening baked 2026-08-07) · **Customer FE:** deferred to FE PHASE (DEC-FE-DIVISION; §10 = reference contracts) · **Date:** 2026-08-07  
**RACI:** R/A = PM · Consulted = GPT/GLM/Sonnet/Opus + Founder  
**Schema:** `M0-build-sheet-schema.md`. Bible = `_data-model.md`. Rounds: `Aggregated/m14-onboarding.md` · confirm `Aggregated/m14-confirm.md`. Auth = **DEC-AUTH (Convex Auth)**.

**North star:** assemble proven market patterns — Duolingo (first real win) · Canva (kill blank canvas) · Linear/Notion (soft coach) · Discord (checklist-as-state) · Reddit (honest empty) · Epic weekly free (drip) — into a **server-tracked activation + return machine**. Primary Phase-1 aha = **first resource acquire**. Primary retention = **drip + quota governor** on the **user’s local calendar**. No greenfield ritual. No fabricated social proof.

---

## 1. Header & Layer Profile
- **id:** M14 · **purpose:** first-run → activation milestones → habit/return (drip/quota/since-visit/in-app notifs) · empty-state contracts · newsletter consent · coach/ladder state. · **owner:** PM · **status:** confirmed + closed.
- **dependencies (up):** M1 (Convex Auth wiring) · M7 (basic profile / eligibility — do not re-derive) · M9 (feed/exploration) · M10/DEC-S15 (acquire/quota) · M13 (hold/appeal copy; R-BRIGADE reuse) · M12 (Might/tier events, psych) · DEC-L08 · DEC-P13 · DEC-AUTH. **(down):** M15 (config knobs chrome) · M16 (funnel dashboards over `rawEvents`) · M17 (landing/SEO).
- **Layer Profile:** Backend/Data = **Required** · Jobs (drip publish; quota_restored = **lazy on session**, not midnight cron) = **Required** · Integration (Convex Auth — GLOBAL/M1) = **Supporting** · Customer-FE = **DEFERRED** (contracts only) · Admin-FE = **Supporting** (systemConfig) · Analytics = **Required** (event family).

## 2. Canonical Names & Enums
- **Tables:** deepen `users`, `notifications`, `rawEvents`, `resourceQuotaLedgers` / acquisitions, `threadReadStates`, `systemConfig`; **new:** `newsletterConsents`, `dripBatches`.
- **Enums:**
  - `onboardingState`: new · basic_profile_complete · exploring · activated · engaged · retained · coach_dismissed · expired
  - `activationQuality`: standard · unverified_fast · staff_excluded *(analytical only — never access/Signal gate; store with `activationDefinitionVersion`)*
  - `emptyStateReason`: no_inventory · no_matching_filter · no_human_activity · no_acquisitions · no_distribution_members · moderation_unavailable · content_temporarily_unavailable · new_account
  - `notificationType` *(P0)*: comment_reply · post_comment · help_resolution · saved_post_activity · resource_released · acquired_resource_updated · quota_exhausted · quota_restored · moderation_held · moderation_resolved · appeal_resolved · account_restricted · distribution_joined · drip_batch · *(P1)* trust_tier_changed · signal_level_changed · store_status_changed
  - `newsletterConsents.status`: pending · confirmed · unsubscribed
  - `coachCardId`: discover_resource · acquire_resource · join_discussion · return_update
- **Functions:** `onboarding.state` · `onboarding.dismissCoach` · `visit.commit` · `activation.onAcquire` · `sinceLastVisit.query` · `notifications.list`/`markRead` · `newsletter.prompt`/`consent`/`unsubscribe` · cron `drip.release` · *(no `quota.restoredNotify` cron — lazy on session; confirm C1)*.

## 3. Scope & Non-Goals
- **In:** milestones (`firstValueAt` / `activatedAt` / `engagedAt` / `retainedAt` / `activationQuality`) · activationProgress bits · soft coach (lifetime ≤4) · empty-state contracts · since-last-visit (≥3 gate) · local-calendar quota windows (DEC-S19) · dripBatches + quota-restored notifs · in-app notification deepen · newsletter post-acquire consent · `systemConfig` knobs · guest→user `anonymousSessionId` join (rawEvents) · L08 event names for M16.
- **Non-Goals:** email digest / push / marketing automation (DEC-P13) · Rocketeer/storefront coaching · streaks / daily goals / onboarding badges · AI concierge · fake social proof · redefining M7 profile fields · PostHog dashboard chrome (M16) · landing/waitlist (M17) · FE polish.

## 4. Domain Context
- **Terminology:** *Activated* = first distinct successful resource acquire. *First value* = qualified resource view before/with acquire. *Engaged* = first published community contribution OR acquired-resource revisit OR second qualified session on a different local day. *Retained* = qualified session ≥7×24h after `activatedAt`. *Drip* = scheduled release of in-house resources. *Coach* = contextual non-modal card.
- **Invariants:**
  - **INV-1 Port, don’t invent.** Prior-art patterns only; no mandatory tour.
  - **INV-2 Acquire = activation.** `activatedAt` write-once on first successful acquire; never voided by later unpublish; staff/persona excluded from product funnel.
  - **INV-3 Value ≠ activation.** `firstValueAt` / `engagedAt` / `retainedAt` are distinct; dashboards must not treat acquire as all four.
  - **INV-4 Coach never blocks.** User action always wins; dismiss permanent per `coachCardId`; no shame/Might pressure.
  - **INV-5 Honest empty.** No fabricated counts; personas never count as human activity / Reach / “online.”
  - **INV-6 Drip + quota are one mechanic.** Drip without quota → binge-and-leave; quota without drip → frustration.
  - **INV-7 Local calendar windows (DEC-S19).** Day/week keys in user timezone; fallback UTC if timezone missing (log).
  - **INV-8 In-app only (DEC-P13).** No sneak email digest; newsletter is consented list for a future send, not P0 delivery.
  - **INV-9 M9 persona exploration stands.** Persona-authored posts stay **out** of the exposure-deficit exploration queue (M9 LOCKED). Day-1 feed uses Hot/Top/New + **editorial seed inventory (DEC-L02)** — not persona exploration slots. Misreading “exclude personas” as “hide all AI-labeled UI” is forbidden; AI labels stay visible.
  - **INV-10 Config over constants.** Retention/activation levers live in `systemConfig` so 1–2 humans can act Tuesday without deploy.
- **Actors:** visitor · member · coach/automated · drip cron · Admin (config).
- **Source of truth:** acquisitions + `users` milestone fields + `rawEvents` + `notifications` + `newsletterConsents`.

## 5. Dependencies & Cross-Module Contracts
| Provider | Contract | Failure |
|----------|----------|---------|
| DEC-AUTH / M1 | `tokenIdentifier` → users | Fail closed auth |
| M7 | Basic profile complete → handoff | Derive progress from M7 fields |
| M9 | Feed + exploration (personas out of exploration queue) | Empty → library fallback |
| M10 / DEC-S15 | Acquire + quota | Idempotent; re-download ≠ activate |
| M13 | Hold/appeal copy; R-BRIGADE on reply floods | Mod notices > coach |
| M16 | Consumes onboarding.*/retention.* events | — |

## 6. Data Model
- **`users`** *(deepen)* — `timezone` (IANA, write-once at signup; **Admin correction with auditLog only**) · `onboardingState` · `firstValueAt?` · `activatedAt?` · `engagedAt?` · `retainedAt?` · `activationQuality?` · `activationDefinitionVersion?` · `ladderCompleteAt?` · `lastVisitAt?` · `currentSessionStartedAt?` · `lastQuotaExhaustedPeriodKey?` *(for lazy quota_restored)* · `coachCardsShownCount` · `checklistStepsShownMax` *(separate from coach — confirm)* · `coachDismissed[]` · `coachDismissedAt?` · `onboardingExpiredAt?` · `activationProgress{…}` · `newsletterConsentStatus?`.
- **`newsletterConsents`** *(new)* — userId, status, consentedAt?, surface, copyVersion, ipHash?, unsubscribedAt?, createdAt. Unique userId.
- **`dripBatches`** *(new)* — batchId, releasedAt, resourceIds[], tags[], createdAt.
- **`notifications`** *(deepen)* — recipientUserId, notificationType, objectType, objectId, actorUserIds[], eventCount, dedupeKey, status, priority, batchWindowStartedAt?, batchWindowEndsAt?, readAt?, retractedAt?, createdAt, updatedAt. Indexes: by_user_unread · by_dedupe.
- **`resourceQuotaLedgers` / acquisitions** — `periodKeyDay` · `periodKeyWeek` = user-local `YYYY-MM-DD` / ISO week; index (userId, periodKeyDay).
- **`rawEvents`** — event family §14 (no parallel activationEvents table).
- **`systemConfig` keys:** `interestTiles.enabled[]` · `drip.itemsPerDay` (default **1** soft beta) · `drip.releaseHourUtc` (default **9** UTC global) · `drip.minScheduledDays` (**14** — alert if below) · `drip.launchInventoryFloor` (**40**) · `quota.perDay`/**perWeek** (5/20) · `coach.maxLifetime` (**4**) · `coach.maxPreActivation` (**3**) · `checklist.visibleMax` (**3**) · `sinceLastVisit.minItems` (**3**) · `leaderboard.minParticipants` (**25**) · `visit.qualifyMs` (**30000**) · `visit.writeThrottleMs` (**1800000**) · `notifications.<type>.enabled`.

## 7. Domain States & Lifecycle
1. **OnboardingState:** new → basic_profile_complete → exploring → activated → engaged → retained; or coach_dismissed / expired (coach UI off; funnel events continue).  
2. **Milestones:** firstValueAt → activatedAt → engagedAt → retainedAt (monotonic timestamps; independent).  
3. **Coach:** show → dismiss(permanent) | complete action (bit) | expire.  
4. **Newsletter:** none → pending/confirmed → unsubscribed (terminal; never re-prompt).  
5. **Precedence:** M13/legal notices > quota/account restriction > coach; drip legal hold > schedule.

## 8. Rules, Algorithms & Limits
- **R-HANDOFF-M7:** basic profile complete → `onboardingState=basic_profile_complete`; init bits from M7; route interest-matched feed + Constellation entry. Prefer-not-to-say stays completed.
- **R-FIRST-VALUE:** qualified view: open ≥**20s** OR ≥**25%** progress; short resource (<4 pages) ≥**10s** → set `firstValueAt` once. No Signal, no quota.
- **R-ACTIVATE:** first successful distinct acquire (published, quota ok, not staff/persona, not already acquired) → `activatedAt=now`, `resourceAcquired=true`, `activationQuality` + `activationDefinitionVersion` (`unverified_fast` if session age <**5m** AND no prior qualified action else `standard`), emit `onboarding.first_acquire`. Idempotent. Downloads/re-downloads/dupes/failed quota **cannot** set `activatedAt`. Later legal removal does **not** clear it. Quality is **never** an access or Signal input.
- **R-ENGAGE:** first public comment/post (after M13 publish, not while held) OR acquire-revisit OR second qualified session on a different local day → `engagedAt`.
- **R-RETAIN:** qualifying session with `activatedAt` and now ≥ activatedAt+**7×24h** → `retainedAt`, `day7Returned=true`. Exact calendar day-7 not required (day-12 ok). Visit write-throttle must **not** block retainedAt / day7 / threadReadStates / analytics session entry.
- **R-LADDER:** server tracks 7 bits; UI shows ≤**3** next actions via **`checklist.visibleMax`** (separate counter from coach lifetime); never % complete; `ladderCompleteAt` when all 7 true (≠ activation).
- **R-COACH:** max **3** pre-activation + **1** post-activation (**4** lifetime impressions); max **1**/session; one visible; never modal; never blocks; dismiss → permanent; ends at retained / **14** local days / cap / dismiss. Priority when two eligible: **funnel-stage ascending**. Alternate discussion/library cards. Moderation/quota/legal replace coach.
- **R-EMPTY:** honesty rules §15; feed uses Hot/Top/New before empty; if global zero → `no_inventory` + library CTA; thread “No human comments yet” (+ AI perspectives line if personas present); library empty without quota urgency; Distribution honest; hide podium if participants <**25**.
- **R-VISIT:** qualify session ≥**30s** OR qualified action; preserve prior `lastVisitAt` as comparison anchor then update; write throttle ≥**30m** between bumps; bounce does not advance marker.
- **R-SINCE:** on session start, if newItemsSince(lastVisitAt) ≥**3** → show modules (replies, saved updates, acquired updates, drip, mod) only for real events; else suppress + emit `retention.since_last_visit_suppressed` + show drip card if any.
- **R-QUOTA (DEC-S19 LOCKED):** `dayPeriodKey` = `YYYY-MM-DD` in IANA `users.timezone`; `weekPeriodKey` = ISO week-year+week, week starts **Monday 00:00** local; fallback UTC if timezone absent. Lazy reset inside acquire txn: if `now >= periodEnd` → reset counters. On blocked attempt → `quota_exhausted` + set `lastQuotaExhaustedPeriodKey`. **No “almost gone” nag.**
- **R-QUOTA-RESTORED (confirm C1):** **No per-timezone midnight cron.** On session start / visit.commit: if `lastQuotaExhaustedPeriodKey` set AND ≠ current local periodKey AND no unread `quota_restored` → emit once, clear marker. In-app only (DEC-P13).
- **R-DRIP:** cron hourly UTC; publish due items as `dripBatches` at `drip.releaseHourUtc`; notify intersecting interests (copy = **supply announcement**, not human activity/social proof); batch 0 → no notif. Soft-beta default `drip.itemsPerDay=1`; launch floor **40** banked; alert when scheduled supply < **14** days.
- **R-NOTIFY:** deepen notifications; dedupeKey = recipient+type+object+window; batch reply **15m**, saved **24h**, distribution join **6h**, drip one per batch; mute suppresses social not legal/mod; reply flood → M13 R-BRIGADE hook (never drop real reply). **Forbidden copy (all surfaces incl. notifs):** Might falling / losing rank / allowance wasted / everyone ahead. Persona-entered deferred.
- **R-NEWSLETTER (confirm C2):** **single ask** after first acquire only (not signup). Unchecked. Copy *(keepable, trigger-based — not weekly cadence)*: “Email me when new resources drop. No fixed schedule, no marketing.” `copyVersion=v1`. Insert `newsletterConsents`; **unsubscribe before production capture begins**; material copy change → re-consent; never bundle product marketing.
- **R-TILES-OPS:** interest tile with <**5** published resources → disable via config.

## 9. Backend Operations
- **queries:** `onboarding.state`, `sinceLastVisit.query`, `notifications.list`, `emptyState.forSurface`  
- **mutations:** `visit.commit`, `onboarding.dismissCoach`, `newsletter.consent`/`unsubscribe`, `notifications.markRead`; activation hooks inside acquire mutation (M10)  
- **crons:** `drip.release` (hourly UTC) only — quota_restored is lazy  
- **auth:** Convex Auth `tokenIdentifier`; guest merge on first identity via `anonymousSessionId` (pre-auth rawEvents stitch must survive — N3)  
- **config:** §6 systemConfig keys

## 10. Customer Frontend — DEFERRED (reference contracts)
Routes: post-auth home, library, notification center, unsubscribe. Coach = one card region. Empty/since/quota copy = §15. Built in FE phase to DEC-UX-APPLE.

## 11. Admin & Governance
M15 surfaces: edit `systemConfig` knobs; drip schedule; tile enable list; newsletter copyVersion. No dual-control theatre. Audit config changes.

## 12. RBAC
| Action | visitor | member | Admin |
|--------|---------|--------|-------|
| Browse / empty states | ✓ | ✓ | ✓ |
| Activate / coach / notifs | — | ✓ | ✓ |
| Newsletter consent | — | ✓ | ✓ |
| Edit systemConfig / drip | — | — | ✓ |
| Impersonate funnel as staff | — | — | excluded from product metrics |

## 13. Integrations
Convex Auth (M1). Optional email provider for newsletter = **DEFERRED** until first send; capture+unsubscribe still ship. No push.

## 14. Analytics, Audit & Observability
**rawEvents (server):**  
`onboarding.signup_started` · `identity_verified` · `interests_selected{tileIds[],count}` · `rules_acknowledged` · `profile_completed` · `first_browse` · `first_action` · `first_acquire` · `first_value` · `engaged` · `coach_shown|dismissed|completed` · `retention.session_started` · `d7_return` · `quota_exhausted` · `quota_restored_seen` · `drip_batch_seen` · `since_last_visit_shown|suppressed` · `newsletter_prompted|consented`.  
**L08 annotation:** activation-rate reports should carry library catalog size/freshness (Path B load-bearing). Staff/persona excluded.

## 15. Content & Copy Contract *(provisional; R4)*
- Feed empty: “Createconomy is in public beta.” / “Discussions are starting…” / Explore · Browse resources. Never fake trending.  
- Thread empty: “No human comments yet.” (+ AI perspectives line if any).  
- Library empty: “Your library is empty…” no urgency.  
- Quota: “You’ve used today’s new-resource allowance… Resets at midnight your time (local).”  
- Newsletter: “Email me when new resources drop. No fixed schedule, no marketing.” Unsubscribe anytime.  
- Activation ack: library re-download without new allowance.  
- Held first comment: M13 copy; do not set `commentCreated` until publish.

## 16. Edge Cases & Failure Recovery
- Acquire fails → no activatedAt / no quota burn.  
- Held contribution → no engage bit until publish.  
- Timezone missing → UTC keys + log.  
- Timezone change → support-only; accepted residual gaming.  
- Coach action completed in other tab → card gone next query.  
- Double newsletter ask → forbidden.  
- Thin library → ops publish into top tiles; do not add coach cards.

## 17. NFR / Security / Privacy / SEO
Consent proof for newsletter. ipHash optional. No marketing without copyVersion. Private library/notifs no-index. Least privilege on config.

## 18. Fixtures, Tests & Acceptance Criteria
- **AC-1** First acquire sets `activatedAt` once; re-download does not.  
- **AC-2** Qualified view sets `firstValueAt` without quota.  
- **AC-3** `unverified_fast` when activate <5m with no prior qualified action.  
- **AC-4** Coach dismiss never resurfaces; 5th card not shown.  
- **AC-5** Coach never blocks navigate/post/acquire.  
- **AC-6** Since-visit suppressed when <3 items; event emitted.  
- **AC-7** Quota periodKey follows user timezone; restored notif fires.  
- **AC-8** Newsletter only post-acquire; unsubscribe works pre-send.  
- **AC-9** Persona posts not in exploration queue; editorial seed still fills Hot/Top.  
- **AC-10** Podium hidden if <25 participants.  
- **AC-11** Reply batch dedupe; flood logged to M13.  
- **AC-12** Tile with <5 resources disableable via config without deploy.

## 19. Release, Migration & Rollback
- **Flags:** `onboarding.coach`, `retention.dripNotify`, `retention.quotaRestoredNotify`, `newsletter.capture`.  
- **Order:** timezone capture → acquire hook → coach/empty contracts → notifications → drip cron → newsletter consent → since-visit.  
- **Launch blockers:** DEC-L02 editorial seed discussions (count on checklist) · **≥40** published resources banked · DEC-S20 before public download · newsletter unsubscribe live before capture · systemConfig knobs live · drip supply health alert wired.  
- **Rollback:** disable coach/drip notifs via flags; milestones remain historical.

## 20. Global Projections & Open Decisions
- Bible: Profile/onboarding deepen + newsletterConsents + dripBatches + quota local keys + lastQuotaExhaustedPeriodKey.  
- DEC-S19 → **LOCKED** user-local calendar.  
- DEC-M9-EXPLORE clarified in INV-9.  
- **M16 handoff:** annotate DEC-L08 activation rate vs M10 library catalog size/freshness (Path B load-bearing).  
- Email send pipeline DEFERRED.  
- Per-user drip local hour DEFERRED (global UTC release at beta).

---

## DEC register (this module)

| ID | Decision | Status |
|----|----------|--------|
| DEC-M14-AHA | `activatedAt` = first successful distinct resource acquire; + firstValueAt / engagedAt / retainedAt / activationQuality | LOCKED |
| DEC-M14-COACH | Soft coach lifetime ≤4; never blocks; permanent dismiss; UI ≤3 ladder steps; expire 14d/retain/dismiss/cap | LOCKED |
| DEC-M14-EMPTY | Honest empty contracts; no fabricated counts; personas ≠ human activity | LOCKED |
| DEC-M14-RETURN | Drip primary + quota governor; since-visit ≥3 gate; visit qualify 30s + write throttle 30m | LOCKED |
| DEC-S19 | Quota windows = **user-local calendar** day/week (`timezone` write-once; fallback UTC) | LOCKED |
| DEC-M14-NOTIFY | In-app P0; **quota_restored = lazy on session** (not midnight cron); drip_batch; M13 brigade; no Might-shame copy | LOCKED |
| DEC-M14-NEWSLETTER | One ask post-acquire; trigger-based copy (not weekly cadence); `newsletterConsents` + unsubscribe before capture | LOCKED |
| DEC-M14-CONFIG | Retention/activation levers in `systemConfig` (not hardcoded) | LOCKED |
| DEC-M14-SURFACE | Rocketeer/storefront coaching out of soft beta | LOCKED |
