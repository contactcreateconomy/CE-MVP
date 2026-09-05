# DECISION — M7: Posting Eligibility & Profile (Build Sheet · BACKEND-LOCKED)

**Status:** BACKEND LOCKED · **CONFIRMED (GPT/GLM/Sonnet AGREE, no fatal)** · **Customer FE (onboarding UI):** DEFERRED → **Frontend phase** · **Date:** 2026-08-03
**RACI:** R/A = Opus · Consulted/Informed = GPT/GLM/Sonnet + Founder
**Schema:** fills `M0-build-sheet-schema.md`. Canonical names = `_data-model.md`.

**North star:** **"Open the door, earn the megaphone."** Posting is a *right* (verify + a ~10-second profile), reach is *earned* (Signal + trust). Posting is NEVER points-gated — "posting isn't rare; a firewall here just angers people." The profile is the platform's first-party data asset (**"the gold"**) — captured *smooth-as-butter*, consent-first, forward-compatible with every later phase. Honesty spine (consent, no dark patterns, firewall) inherited from the Signal round.

---

## 1. Header & Layer Profile
- **id:** M7 · **purpose:** who can do what (browse/comment/post), the frictionless onboarding profile, the first-party data model, and the open-posting anti-abuse stack. · **owner:** Opus · **status:** backend locked.
- **dependencies (up):** M1 (users/systemConfig/**Convex Auth** + email/mobile verify) · M5 (tool registry → the "tools you use" proxy) · **Signal foundation** (`rawEvents` → interest inference; `signalReputation`/trust weighting) · M13 (moderation). **(down):** M4 (post creation gate) · M6 (comment gate) · M8 (revival-vote eligibility, DEC-M8-REVIVAL) · **M9 (cold-start exploration-pool CONTRACT)** · M11 (affiliate ← tools-used) · M12 (Recognition/leaderboard ← completion) · M14 (onboarding UI) · M16 (analytics).
- **Layer Profile:** Backend/Data = **Required** · Jobs (interest-inference cron, completion recompute, rate-limit counters) = **Required** · Integration (Convex Auth verify, moderation) = **Required** · Customer-FE (onboarding tiles, progressive prompts, completion badges) = **DEFERRED → FE phase** · Analytics/Audit = Required.

## 2. Canonical Names & Enums
- Tables (Bible): extend `users` (+ `privateUserData`); `profiles`, `userInterests`, `userSocialAccounts`, `userConsentRecords`, `userInferences`, `trustHistory`, `interestTaxonomy`, `profileCompletionEvents`, `postingEligibilityEvents`.
- Enums: `postingEligibilityState` (not_verified·basic_incomplete·eligible·rate_limited·temporarily_restricted·suspended·deleted), `userInterest.source` (direct·inferred·both), `socialAccount.visibility` (private·public·future_marketplace_only), `consent.purpose`, `profile.roleArchetype`, `profile.ageBand`.
- Functions: `eligibility.check` (server, in post/comment mutation), `profile.upsertBasic`, `profile.setAttribute` (consent-bound), `interests.select/remove`, `interests.inferBatch` (cron), `social.add/verify`, `profile.consentRecord/consentWithdraw` *(renamed from `consent.record/withdraw` — Wave 7A E2; M7 profile scope, distinct from M18 CMP `consent.record/withdraw`)*, `completion.recompute`, `erasure.detachAttribute`.

## 3. Scope & Non-Goals
- **In:** the eligibility model (browse/comment/post); frictionless **basic profile** (unlocks posting); the **asked/inferred/never-inferred** profile schema incl. the **tools-you-use proxy**; interest inference (batch cron over `rawEvents`); **completion → Recognition** (per-field badges, firewalled); consent + erasure (incl. derivation trail); the **open-posting anti-abuse stack**; trust-tier effects (velocity/distribution/sensitive-actions, never existence); the append-only consent/trust/eligibility histories.
- **Non-Goals:** the **explicit income/spend ASK** (Phase 2 — captured via the tools proxy now); OAuth/follower-count import + influence scoring (Phase 3+); marketplace discoverability / seller profile (Phase 4+); Signal-as-currency profile surfaces; the onboarding **visual UI** (FE phase); heavy identity assurance beyond email+mobile (phone ≠ high-assurance identity).

## 4. Domain Context
- **Terminology:** *basic profile* = the minimal completed-decision set that unlocks posting; *proxy field* = a functional question (tools-you-use) that yields demographic/commercial signal without asking it directly; *earned distribution* = reach from Signal/trust, not from a posting gate; *derivation trail* = the source behavioral records that produced an inferred value.
- **Actors:** visitor (browse, anonymous — `rawEvents` by `anonymousSessionId`); verified member (comment; + basic profile → post; manage profile/consent); operator (moderation, taxonomy, rate-limit config); automated (interest-inference cron, completion recompute, rate counters).
- **Invariants:**
  - INV-1 **Browse = anonymous, zero friction.** Comment = email+mobile verified. Post = verified + basic profile complete. **No points/Signal/tier minimum ever gates baseline posting.**
  - INV-2 **"Prefer not to say" / "Decide later" is a COMPLETED decision.** Basic-profile completion = decisions made, NOT data disclosed. Nothing sensitive is ever required to post/comment/react/vote/download.
  - INV-3 **Firewall:** profile/completion data feeds **Recognition only** — never Signal, reach, reaction weight, comment rank, or featuring (DEC-SIGNAL-FIREWALL).
  - INV-4 **Never infer/derive/persist** income/spend/age/gender/revenue/employment/sensitive identity from behavior. Interests/topic affinity may be inferred; **financial data comes ONLY from an explicit banded Phase-2 ask**. `tools you use` is a **direct tool-affinity attribute** (review relevance + affiliate), never a financial proxy.
  - INV-5 **Direct vs inferred are stored separately** and are user-inspectable/correctable/resettable; inference can be disabled.
  - INV-6 **Consent-first + erasure covers the derivation trail** (delete a derived value ⇒ invalidate/detach the source records that produced it; tombstone/identity-detachment; never retain erased values in `auditLog.prev`).
  - INV-7 **Open posting ≠ unmoderated:** every post passes deterministic checks + full safety moderation (fail-closed) before publish; a flat per-account rate-limit caps volume.
  - INV-8 **Trust tiers change velocity/distribution/sensitive-privileges, NEVER existence** (a verified member's first post always allowed).

## 5. Eligibility & Gate
- **R-ELIGIBILITY:** `eligibility.check` runs server-side inside the post/comment mutation. **Comment** requires email+mobile verified + active + not-restricted. **Post** additionally requires `basicProfileComplete` + rate-limit available. Suspension/hold/restriction/rate-limit override. On incomplete → preserve draft, return the missing basic decisions + one CTA ("Complete profile setup"). State machine persisted to `postingEligibilityEvents` (append-only). On a material rules/policy version bump, `eligibility.check` compares the user's last-accepted version vs current and surfaces a **re-acceptance** prompt (consent log is append-only + versioned).
- **R-BASIC (unlocks posting; ~<10s, zero typing):** verified + active + **display name** (auto-filled from Convex Auth profile/email local-part, editable) + **avatar** (default provided) + **≥1 interest tap** + **accept rules** (versioned) + **legal-age/COPPA confirmation** (compliance check, not a profile field, no Recognition). Optional here with prefer-not-to-say: role archetype, account type. Sensitive fields never required.

## 6. Profile — asked / inferred / never-inferred
- **R-PROFILE-ASK (tap-only, progressive, purpose-labelled):** interests (tiles, from `interestTaxonomy`); **role archetype** (solo_creator·small_team·agency·exploring — doubles as community/marketplace routing); **age band** (bands, not birthdate; skippable); **"tools you use"** (tap-select from the M5 tool registry) — a **direct `tool_affinity`/`tool_experience`** attribute for review relevance + affiliate contextualization, **NOT an income/spend proxy** (no financial estimate is derived or persisted — a tool may be free/employer-funded/shared/trial); socials (optional link, stored only, no fetch — Phase-3 use); bio + avatar (progressive nudges). **Governing rule:** never directly ask a self-ranking question (income/spend/success) at signup — prefer functional, immediately-useful questions; any financial data = an explicit optional Phase-2 ask.
- **R-PROFILE-INFER (batch cron over `rawEvents`, never blocking):** topic/category + post-type/tool-category/resource-category + view-mode affinity; engagement archetype; expertise signals (accepted answers/debate/domain reactions). Decayed event-weighted affinity `Σ(eventWeight × recencyDecay × integrityEligibility)` (view/dwell/save/valuable/reply/post; reply & post weighted highest); **≥3 qualifying events across ≥2 sessions** before surfacing; explicit selections always take priority. **Prohibited inferences:** age/gender/income/revenue/purchasing-power/employment/sensitive identity. `userInferences` is versioned (model/rule + evidence window + confidence + expiry). **Provenance = a lightweight manifest** (cron-run id + event-count + hash + reproducible query window), NOT per-event pointers — keeps storage O(users×interests); erasure re-queries `rawEvents` within the window.
- **R-INCOME (Phase-2, deferred):** any explicit income/spend band = a **direct, optional, banded, purpose-framed** ask ("suggest tools in your budget"), **local-relative bands** + country context + band-version + timestamp (global audience; never currency-convert silently); never public, never in ranking/distribution, aggregate-only under a min cohort size. **No income/spend is inferred from `tools you use` or any behavior** (GPT confirmation fix) — Phase-1 simply omits financial data; the tools list serves review relevance + affiliate only.

## 7. Completion, Recognition & Consent
- **R-COMPLETION (per-field badges — DEC-M7-COMPLETION):** completion = **individually-earned Recognition badges per meaningful field** (tools-used, bio, socials, role, interests…), NOT one gamified "100%" bar (avoids junk-fill). Counts **only directly-fillable fields**; **"prefer not to say" earns equal credit** (reward the decision, not the disclosure; `$1000-spend` = same credit as `prefer not to say`). Feeds `recognitionScore` + a private Journal milestone only. **No Signal/reach/reaction-weight/rank/placement.** `profileCompletionEvents` append-only.
- **R-CONSENT (transparency + value + control):** per-field consent flags (interests ON, demographics OFF, behavioral-inference ON, public-visibility ON by default); every optional ask answers *why / who sees it / what changes / can I skip / can I remove later*; inferred fields shown with source ("based on 12 saves"). `userConsentRecords` append-only (purpose, policyVersion, surface, granted/withdrawn). Consent withdrawal overrides analytics/personalization/marketplace/completion use.
- **R-ERASURE:** deleting/withdrawing a field removes/identity-detaches the value **and invalidates dependent inferences + the source derivation records**; writes a non-value-bearing erasure record; overrides completion/Recognition-retention/inference/marketplace. Recognition may persist as "completed under version X" without revealing prior answers. Aggregates survive only if unlinkable.

## 8. Open-posting anti-abuse (INV-7)
- **R-ABUSE (full stack — profanity is only the fast lane):**
  1. **Verification cost** — email+mobile; one active account per verified phone (default); disposable-email/virtual-number controls; verify-attempt throttle. *(Phone ≠ identity proof — SIM-swap/recycling.)*
  2. **Flat per-account rate-limit** — N posts/hour, **tier-independent**, resource/SEO-index/mod-queue protection (rolling counter on user, O(1), compute-at-write). Not a distribution gate.
  3. **Deterministic pre-publish checks** — body-length, no-user-URL, duplicate-hash + near-duplicate vs the same user's recent, repeated-title, nonsense, mention limits, required fields, velocity, account-state.
  4. **Full safety moderation** — profanity (fast lane) + NSFW/illegal + harassment + spam + obfuscated-URL; held-when-uncertain; **fail-closed** (DEC-P02).
  5. **Earned distribution** — low-trust content publishes but isn't amplified; low-trust outbound links `rel="ugc nofollow noopener"` until a trust threshold.
  6. **Cold-start guard → M9 CONTRACT:** M9 MUST reserve a **bounded exploration pool** for new eligible content (New/profile/category/direct-link + exploration inventory) so content never deadlocks (no-history → no-exposure → no-Signal → invisible). Not a posting gate. **Personas / editorial-seeded content are EXCLUDED from the exploration pool and the flat human rate-limit** — they never consume genuine new users' cold-start discovery slots (Sonnet; same seam as featuring/persona-seeding).
  7. **Legibility (no invisible wall):** show new members an honest line — *"new posts start with limited reach; this grows as your posts get engaged with."*
  8. **Retrospective** — report/hide/remove/restriction/suspension + device-session/related-account/duplicate-campaign review.
- **R-TIERS (INV-8):** trust tiers **MAY** change posts-per-day + submission-attempts, comment velocity, reaction weight, revival-vote eligibility, extra-review, manual showcase approval, moderation SLA/priority, repeated-edit, draft-queue size. **Enumerated tier-gated privileges (all format/distribution, NEVER existence):** link-posting, media/image attachment, long-form post-type access, reaction-velocity cap, moderation-queue priority. Trust tiers **MUST NOT** change first-post creation for a verified member, completion Recognition, organic Signal, community-rating, debate-vote result, accepted-answer authority, profile visibility, or the ability to report.

## 9. Config (systemConfig)
- `posting.rateLimitPerHour` (flat) + per-tier post/attempt limits; `profile.basicRequiredDecisions`; `profile.completionBadgeFields`; `interest.inference.{eventWeights, recencyHalfLife, minEvents, minSessions}`; `moderation.failClosed=true`; `links.nofollowBelowTier`; `taxonomy.version`; `consent.policyVersion`; `age.minimumByJurisdiction` (legal review).

## 10. RBAC
- Member: own profile/consent/interests/socials CRUD, erasure. Operator: taxonomy, rate-limit/config, restrictions. **No role** can make Recognition/profile data affect Signal/ranking (firewall enforced structurally — different tables/paths).

## 11. Security & Privacy
- No raw phone/PII in `users` root → `privateUserData` (sensitive verified contact). Server-side eligibility (never trust client). Consent/erasure honored end-to-end incl. derivation trail. Sensitive fields: banded, optional, never public by default, never in ranking/distribution, aggregate-only under min cohort. Age assurance / children's-data = **jurisdictional legal review before launch**. Socials = stored handles only (no fetch without explicit OAuth + disclosure + revocation).

## 12. Acceptance criteria (Given·When·Then)
- G an anonymous visitor · W they browse · T full read access, `rawEvents` by `anonymousSessionId`, no signup wall.
- G a verified member with no profile · W they open the composer · T blocked with the missing basic decisions + "Complete profile setup"; comment still allowed.
- G basic-profile setup · W the user taps one interest + accepts rules + confirms age (name/avatar defaulted) · T posting unlocked in ~seconds, zero typing.
- G a user selects "prefer not to say" on age/tools · W completion recomputes · T that decision earns its badge equally; nothing sensitive was required.
- G profile completion · W badges are awarded · T `recognitionScore` updates; `signalReputation`/reach/rank/feed are unchanged (firewall).
- G a spammer posting 50 items/hour · W the flat rate-limit + deterministic dedup + fail-closed moderation apply · T volume is capped, near-dups rejected, and distribution ≈ 0.
- G a new member's first post · W it publishes · T it enters the M9 bounded exploration pool (not invisible) and shows the "reach grows with engagement" line.
- G a user deletes their derived spend signal · W erasure runs · T the value AND its source derivation records are detached/invalidated; no erased value remains in `auditLog.prev`.

## 13. DEC map
DEC-M7-ELIGIBILITY · DEC-M7-BASIC · DEC-M7-PROFILE · DEC-M7-COMPLETION · DEC-M7-CONSENT · DEC-M7-ABUSE · DEC-M7-TIERS · DEC-M7-SCHEMA · DEC-ROADMAP (`_index` §N). Inherits DEC-SIGNAL-FIREWALL, DEC-RAWEVENTS, DEC-P02 (fail-closed moderation), DEC-M8-REVIVAL (tier-gated), DEC-P06/P17.

## 14. Migration & build order
- Seed `interestTaxonomy` (~20–30 tiles **derived from the post-type / M5 registry** so interests & post types share a taxonomy; versioned). Seed `systemConfig` M7 keys. Extend `users` + add `privateUserData`. Ship eligibility + basic profile + rate-limits + deterministic checks in MVP-1; interest-inference cron reads the already-shipping `rawEvents`.
- **Taxonomy version migration:** when a `taxonomyVersion` renames/merges/retires a selected tag, resolve deterministically — auto-map to a successor tag, or preserve it as a **legacy** tag that still personalizes for that user but isn't offered to new users. Spec before v2 (silent personalization breakage otherwise).
- **Capture-now (cannot backfill):** consent log; interest-graph history (direct+inferred over time); trust-history timeline; `profileVersion`/`completionVersion`; per-answer provenance (prefer-not-to-say ≠ never-asked); **first-tap ORDER** of interests/tools (salience signal). Everything else = non-breaking `v.optional()` additions later (income/spend/socials/seller profile).

## 15. Open / Deferred
- **Deferred:** explicit income/spend ask (Phase 2); OAuth/follower import + influence scoring (Phase 3+); marketplace/seller profile (Phase 4+); Signal-as-currency surfaces; onboarding visual UI (FE phase).
- **Contract owed to M9:** the bounded exploration pool for cold-start content.
- **Legal:** minimum-age + children's-data handling per jurisdiction before launch.

## 16. Forward-compat — the phase roadmap (north star)
Everything above is shaped toward the platform's end-to-end arc (own marketing → sales in one platform): **(1) fundamentals + discussion → (2) ecommerce → (3) community tools → (4) marketplace → (5) social commerce → (6) influencer marketplace → (7) Signal as currency** (`_index` DEC-ROADMAP). The profile's separate-concern tables + versioning + the tools/socials capture are the seeds of the later buyer/seller/creator profiles — addable without a rewrite.
