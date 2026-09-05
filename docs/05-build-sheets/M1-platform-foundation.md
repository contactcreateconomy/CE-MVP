# DECISION — M1: Platform Foundation (Build Sheet · CONFIRMED + CLOSED)

**Status:** **CONFIRMED + CLOSED** · Design HIT A~91 / B~92 / C~96 · Confirm HIT mean ~98 (GPT 99 / Sonnet 98 / Opus 96) · Founder consented Rounds A–C · Confirm **no FATAL** · Hardenings baked · **Date:** 2026-08-07  
**RACI:** R/A = PM · Consulted = GPT/GLM/Sonnet/Opus + Founder  
**Schema:** `M0-build-sheet-schema.md`. Bible = `_data-model.md`. Aggregates = `Aggregated/m1a-*` · `m1b-*` · `m1c-*` · `m1-confirm.md`. Auth = **DEC-AUTH (Convex Auth)**.

**North star:** Wiring layer that makes locked M2–M18 executable — identity creation, default membership, and admission are **server facts**; browser context finalizes under fail-closed `bootstrapState`; M1 does **not** re-own M15 chrome or M18 jobs/CMP/readiness.

**Disambiguation:** N0 Domain Bible = DONE. **M1 = Platform Foundation** (this sheet).

---

## 1. Header & Layer Profile
- **id:** M1 · **purpose:** Convex Auth wiring · user bootstrap · shared authz · schema spine · config/flag seeds · providers/shell contracts · rate-limit · SSRF · media bounds · Founder runbook · Auth→M18 probes. · **owner:** PM · **status:** confirmed + closed.
- **dependencies (up):** N0 Bible · DEC-AUTH. **(down):** All M2–M18 (consume).
- **Layer Profile:** Backend/Data = **Required** · Jobs = Supporting (seed/Founder internal only) · Integration = **Required** (Auth, SSRF, storage) · Customer-FE = **Supporting** (contracts only; polish deferred) · Admin-FE = Supporting (gate only) · Audit = **Required**.

## 2. Canonical Names & Enums
- **Tables (FULL):** users *(Convex Auth deepen)* · privateUserData · roleAssignments · waitlistEntries · identityJoins · auditLog · mediaAssets · categories · tags · postTags · toolTags · resourceTags · systemConfig · configKeyRegistry · userConsentRecords · consentRecords · capabilityRestrictions · authorizedCommands · bootstrapRuns · *(rate-limit via `@convex-dev/rate-limiter` — do not dual-write custom buckets)*
- **SPINE (FK shells only):** posts · comments · tools · resources · personas  
- **Never create:** systemJobs · clerk* · parallel appUsers · visitor role · tagIds[] · sealed M12 as editable config
- **Enums:**
  - `bootstrapState`: pending_context · complete
  - `accountStatus`: active · deleted
  - `accountStanding`: good · warned · restricted · suspended · terminated
  - `trustTier`: t1 · t2 · t3 *(bootstrap t1)*
  - `postingEligibilityState`: not_verified · basic_incomplete · eligible · rate_limited · temporarily_restricted · suspended · deleted
  - `profileVisibility`: public · private *(soft-beta default public)*
  - `roleAssignments.role`: member · editor · publisher · moderator · store_operator · support_operator · administrator
  - `signup.mode` / effectiveSignupMode: open · waitlist · closed
- **Helpers:** `createOrUpdateUser` · `finalizeBootstrap` · `getCurrentUser` · `requireBootstrappedUser` · `assertCustomerCapability` · `assertAdminPermission` · `assertOperationalCapability` · `getFlag` · `safeFetch` · `checkRateLimit` · `grantFounder` *(internal)*
- **Routes:** `(public)` · `(auth)` · `(onboard)` /start/timezone · `(app)` · `(admin)` · legal shells · `/api/auth/*`

## 3. Scope & Non-Goals
- **In:** Auth · bootstrap · authz lib · schema tiers · seeds · CI · providers · route gates · rate literals · SSRF · media bounds · Founder runbook · M18 probes · Beta label · legal route shells.
- **Non-Goals:** M15 Admin UI/STOP/Wiki · M18 jobs/CMP impl/readiness machine/legal copy · M16 catalog · M17 SEO · M7 profile UX · M14 coach · full DS FE · Redis · Clerk · inventing Legal names.

## 4. Domain Context
- **Invariants (INV-M1-01…32):** Convex Auth users only · tokenIdentifier lookup · bootstrap fail-closed · default member role · visitor≠role · isStaff false default · persona isolation · one authz impl · next-request revoke · server admission · separate consent tables · PostHog deferred · actorUserId≠authz · no Clerk · append-only audit · accountStanding default+fail-closed · waitlist≠user · analyticsSubjectId crypto-random · schema tiers · no systemJobs · idempotent seeds · seed internal-only · sealed by absence · getFlag throws on unknown · usernameNormalized · public allowlist · middleware≠authz · no non-essential SDK in root · CMP degrade · typed rate subjects · safeFetch only · media checks flag+capability · legal routes 200 · preview≠prod secrets.
- **Actors:** system · Convex Auth · member · Founder · Admin · Support · M18 readiness consumer.

## 5. Dependencies & Cross-Module Contracts
| Consumer | M1 provides | Failure |
|----------|-------------|---------|
| M7 | Auth, privateUserData, eligibility defaults, rate primitive | — |
| M14 | timezone write-once, onboarding defaults | — |
| M15 | roles, permission seeds, guards, isStaff; UI stays M15 | — |
| M16 | analyticsSubjectId, identityJoins | — |
| M17 | effectiveSignupMode, waitlist isolation | — |
| M18 | probes, executionAuthority types, CMP/legal slots | GATE blocks open |
| M2/M11 | safeFetch modes | probe disabled if no pin |
| M13 | capabilityRestrictions table shape; standing fields | M13 writes |

## 6. Data Model
- **users** — deepen Convex Auth: tokenIdentifier · email? · emailVerified · mobileVerified=false · accountStatus=active · accountStanding=good · trustTier=t1 · isStaff=false · analyticsSubjectId · bootstrapState · leaderboardOptOut=false · counters=0 · basicProfileComplete=false · postingEligibilityState *(basic_incomplete if emailVerified else not_verified)* · profileVisibility=public · profileVersion · onboardingState · username=null · timezone=null until finalize · … Indexes: by_tokenIdentifier · by_analyticsSubjectId · by_usernameNormalized · by_accountStatus. Unique: tokenIdentifier · analyticsSubjectId · non-null usernameNormalized.
- **privateUserData** — one per user; empty at create.
- **roleAssignments** — default member/global/active at create.
- **waitlistEntries** — not a users row; no role; not L08 signup.
- **identityJoins** — unique active per anonymousSessionId.
- **systemConfig / configKeyRegistry** — seeds per Round B; sealed M12 absent.
- **categories** — DEC-C01 five by slug.
- **capabilityRestrictions** — FULL empty; M13 writes.
- **authorizedCommands** — skeleton for M18.

## 7. Domain States & Lifecycle
- bootstrap: pending_context → complete (finalize) | stuck pending until timezone+joins OK.
- admission: effectiveSignupMode gates **new** members only; existing users sign in subject to standing.
- accountStanding / accountStatus: distinct; missing standing → ACCOUNT_STANDING_UNKNOWN reject.
- waitlist: waiting → invited → converted *(conversion uses same Auth admission+bootstrap)* | withdrawn | blocked.

## 8. Rules, Algorithms & Limits

### R-ADMISSION (FATAL-M1A-02)
TRIGGER: createOrUpdateUser for new identity.  
CONDITION: readiness ready ∧ signup.mode=open ∧ no conflict.  
ACTION: atomic core create. waitlist→waitlistEntries only. closed→reject.  
EDGE: readiness fail → treat as closed for **new** accounts; existing users may sign in.

### R-BOOTSTRAP-CORE (FATAL-M1A-01 / M1B-01)
TRIGGER: createOrUpdateUser new admitted user.  
ACTION: one txn — users + privateUserData + member role + bootstrapState=pending_context + analyticsSubjectId (crypto-random, never derived) + accountStanding=good + isStaff=false.  
No scheduler fill-in.

### R-FINALIZE
TRIGGER: authenticated pending_context + valid IANA timezone.  
ACTION: write timezone once · identityJoins · verify member/private · bootstrapState=complete.  
EDGE: skip chooser → stay pending (no silent UTC). Support correction = M15 audited.

### R-CUSTOMER-GUARD (FATAL-M15-01 placement)
TRIGGER: protected customer write.  
CONDITION: bootstrapState=complete · standing allowlist.  
ACTION: TERMINATED > SUSPENDED > restrictions > STOP > flag > eligibility.  
Allowlist-shaped; missing standing fail-closed.

### R-GETFLAG (FATAL-M1B-04)
Unregistered key → throw. Missing value → registry safeDefault (enable flags fail closed). Never `?? true`.

### R-FOUNDER (FATAL-M1B-03)
internal grantFounder only; audit; fail if admin exists unless allowSecondFounder; persisted **environment-scoped** `founder_bootstrap_completed` (preview completion ≠ production); never in seed.bootstrap; never systemConfig nonce. Second Founder GATE includes **tested** `/admin` + Tier-3 flip (untested recovery ≠ recovery).

### R-SSRF (FATAL-M1C-02)
trusted_source_fetch · external_destination_probe · pin IP · max 3 redirects revalidated · no pin ⇒ disable arbitrary probe.

### Rate limits (soft beta)
| Action | Subject | Limit |
|--------|---------|-------|
| auth.magic_link | ip_hash | 5 / 15m |
| auth.magic_link | email_hash | 3 / 1h |
| auth.finalize | user | 10 / 1h |
| waitlist.join | ip / email | 10/h · 3/24h |
| admin.write | operator | 60 / 1m |
| media.upload | user | 5 / 1h |
| support.action | operator | 30 / 1h |
| report | user | M13 10/d · 30/w |
| post/comment | user | M7/M6 |
| acquire | — | **M10 quota only** |

Staff **not** rate-exempt. Personas use M8 budgets only.

## 9. Backend Operations
| Function | Type | Notes |
|----------|------|-------|
| createOrUpdateUser | Auth callback | Atomic core |
| finalizeBootstrap | mutation | Timezone + joins |
| waitlist.join | publicMutation | Rate-limited |
| grantFounder / revokeRole | internalMutation | CLI |
| seed.bootstrap | internalMutation | Categories/config only — no Founder |
| getAuthHealthProbes | internalQuery | M18 GATE |
| generateUploadUrl | capabilityMutation | Flag+MIME+size |
| safeFetch | action helper | M2/M11 |

**Env:** SITE_URL · JWT · email provider · GLM · storage · PostHog server · FOUNDER_BOOTSTRAP_SECRET · WATCHDOG · HASHING · ENCRYPTION — **no credential NEXT_PUBLIC_**. Public: NEXT_PUBLIC_CONVEX_URL · SITE · APP_ENV · APP_ORIGIN.

**CI:** typecheck · clerk grep · systemJobs ban · api.* schedule · crons.ts · NEXT_PUBLIC_ secrets · protected-mutation wrappers · PostHog-in-layout ban · preview≠prod.

## 10. Customer Frontend
**Providers (FATAL-M1C-01):**  
`ConvexAuthNextjsServerProvider` → client `ConvexAuthNextjsProvider` → ErrorBoundary → CMP slot (M18) → BetaBanner → children.  
**FATAL-M1C-03:** ErrorBoundary above CMP; legal layout **without** ConsentProvider.  
Routes: public browse · auth magic-link · onboard timezone · app · admin gate · waitlist · legal shells (`unavailable_pending_legal`+noindex until M18 publish).  
FE polish deferred. Beta label on shared shell.

## 11. Admin & Governance
M1 owns gate query + permission seeds. M15 owns chrome. Founder runbook CLI. Support timezone.correct audited.

## 12. RBAC
Default member. Founder-only above administrator for role.assign / staff.set. Visitor request-state only.

## 13. Integrations
Convex Auth (magic link P0; Google P1) · `@convex-dev/rate-limiter` · Convex file storage · M18 CMP/readiness.

## 14. Analytics / Audit
Mint analyticsSubjectId at create · never tokenIdentifier to vendors · auditLog on grants · rawEvents signup on finalize (same-mutation when applicable).

## 15. Content & Copy
R4: Legal owns page copy. Beta label product constant. No invent Legal officers.

## 16. Edge Cases
| Trigger | Behavior |
|---------|----------|
| Auth session, no bootstrap | BOOTSTRAP_INCOMPLETE |
| Waitlist mode | waitlistEntries only |
| CMP crash | App up; analytics denied; legal still up |
| Preview prod secrets | CI fail |
| Redeploy | Founder grant not re-armed |

## 17. NFR / Security
OWASP · SSRF · preview isolation · public projection allowlist · email never in public queries.

## 18. Fixtures & AC
- New user: users+private+member+analyticsSubjectId+standing=good+bootstrap pending  
- Waitlist: entry only, no users  
- Finalize: timezone once; complete  
- pending write → reject **every** protected capability (not only post/comment)  
- getFlag unknown → throw  
- ugc/avatar absent → safeDefault false  
- Admin without role → forbidden  
- SSRF: private IP · rebind · mixed A/AAAA · redirect-to-private · decimal/hex IP · DNS answer change → reject  
- Legal route without content → noindex unavailable; open beta blocked until M18 active versions  
- CI clerk/systemJobs/api.*/PostHog-layout fail  
- Public queries never serialize raw users row (allowlist only)  
- Preview founder_bootstrap_completed does not satisfy production probe  

## 19. Release
Expand-only soft beta. Seed then Founder then second Founder GATE (tested). Readiness must see M1 probes + legal **content** published.  
If `external_destination_probe` disabled (no IP pin): M11 affiliate validation → **manual review** (designed degrade, not bug).  
Legal `/privacy` · `/dmca`: prefer static fallback if Convex unreachable (P1 harden).  
Staff rate-limit hits: raise literal via config — never add staff exemption.

## 20. Global Projections & Open
**Projects to:** Bible Platform Foundation · `_index` §Y · all modules Auth/authz/schema.  
**GATE:** Legal bundle (book as one engagement) · DEC-L05 · opsAssignments · second Founder tested · India GO/NCMEC/USCO · legal content publish.  
**Park:** Full DS FE · SSO · Redis · status page · multi-org · MoR.  
**Docs:** Bible `systemJobs` (if mentioned) = deprecated → M18 `jobCatalog` only.

### Soft-beta cut
**P0:** All A+B+C FATALs + providers + routes + rate + SSRF + media + probes + Founder runbook + CI + Beta + legal shells.  
**P1:** Waitlist polish · devices · Google OAuth · legal static fallback.  
**Park:** as above.

---

**Consent stamp:** Founder accepted Rounds A–C (FATAL-M1A/B/C) on 2026-08-07.  
**Confirm stamp:** No FATAL · HIT ~98 · hardenings baked · M1 **CONFIRMED + CLOSED** 2026-08-07.
