# CONTRACT-1-signin-FINAL

**Screen:** Sign In (magic link) — `/signin`
**Wave:** 1 (M1 Foundation)
**Template archetype:** Auth card (420px)
**Primary CAP-IDs:** CAP-001, CAP-016, CAP-017, CAP-018, CAP-030
**Actor:** anonymous
**Reconciliation:** Route/Access, Entities, Actions, Analytics locked (all three aligned). Two component points were 2-1 splits **with Opus on the winning side** → resolved on register/STYLE-KIT evidence, not on Opus's vote (Toast, Full logo). See RECONCILIATION-1 §2.

---

## 1. Route & Access
- **Path:** `/signin`. **Dynamic params:** none. **Actor:** anonymous. **Gated by:** none (CAP-001).
- **Admission is branched by `systemConfig.signup.mode`** (CAP-001 / R-ADMISSION / FATAL-M1A-02):
  - **open** → new identity proceeds into the CAP-002 atomic bootstrap.
  - **waitlist** → writes `waitlistEntries` only; **no `users` row, no role.**
  - **closed** → new admission rejected.
- **Effective mode is server-computed before member create:** `effectiveSignupMode = readiness ? signup.mode : closed` (FATAL-M1A-02). `signup.mode` default **open**; **never dual CTAs** (M17).
- **Existing users bypass** new-user admission in every mode (CAP-001 Notes).
- **Waitlist-invite conversion (CAP-030)** re-enters this **same** Auth admission + bootstrap path — not a parallel flow.
- **Post-admission redirect:** open-mode new users enter pending-context bootstrap (inventory represents this as `/welcome`). **Resolved 2026-08-26:** destinations follow the **Platform-Wide Routing Convention** (CONTRACT-1-app-shell §1) — pending_context → `/welcome` (rule 2); already-`complete` user on `/signin` → `/feed` (rule 3).

## 2. Entities
- **CAP-001:** Reads `systemConfig`, `waitlistEntries` · Writes `waitlistEntries` (**waitlist mode only**).
- **CAP-016 / CAP-017 / CAP-018:** rate-limit gates — Reads **none** · Writes **none**.
- **CAP-030:** Reads `waitlistEntries` · Writes **"(delegates to CAP-001/002)"** (register verbatim; no independent write).
- *Cross-screen note:* open-mode `users` / `privateUserData` / `roleAssignments` writes are CAP-002, attributed to `/welcome`.

## 3. States
1. **Open mode / new identity** — magic-link request form active; new identity proceeds to bootstrap (CAP-001 → CAP-002).
2. **Waitlist mode** — email capture only; writes `waitlistEntries` only, no user/role (CAP-001; CAP-478 "no L08 signup_completed").
3. **Closed mode** — new identity rejected (CAP-001; also the effective mode when readiness fails while `signup.mode=open`).
4. **Existing-user sign-in** — bypasses admission in any mode (CAP-001).
5. **Waitlist-invited conversion** — invited identity converts via the identical Auth admission path (CAP-030).
6. **Magic-link requested** — post-submit confirmation (flow-implied; register specifies no copy).
7. **Rate-limited — IP path** — 5 / 15m per `ip_hash` (CAP-016).
8. **Rate-limited — email path** — 3 / 1h per `email_hash` (CAP-017).
9. **Rate-limited — finalize** — `auth.finalize` 10 / 1h per user (CAP-018).

*Not locked as canonical states (register has no error contract): request-loading / request-accepted copy, invalid/expired/already-used magic link, provider/auth-service failure. → Open Questions.*

## 4. Actions → API
1. **Request magic link** — rate keys `auth.magic_link`: CAP-016 (IP) + CAP-017 (email), Source Rule §8. **No mutation name is given in the register** (Convex Auth built-in).
2. **Redeem magic link → finalize auth** — `auth.finalize` (CAP-018, §8 Rate limits).
3. *(System, triggered by finalize)* **Auth callback fires `createOrUpdateUser`** — CAP-001, R-ADMISSION (FATAL-M1A-02); in open mode chains into the CAP-002 bootstrap txn.
4. **Waitlist-mode email capture** — write target is `waitlistEntries` (CAP-001 waitlist branch); **the mutation invoked is not specified** (Open Questions).

## 5. Analytics Events
- **Signup / identify (CAP-441, R-POSTHOG-ID):** the server-side `rawEvents` signup write (CAP-004) is `strictly_necessary` and fires **unconditionally, regardless of consent state**. The **vendor-side `identify()` call is gated behind CMP consent (FATAL-M18-02 / CAP-504):** if consent is not yet granted at admission time, `identify()` is deferred/queued for replay once consent flips to granted, via the CMP/consent mechanism M18 owns (the slot App Shell reserves). `/signin` does not implement this mechanism itself — it only defers to it. Key = `analyticsSubjectId` (crypto-random opaque, written on `users` in the CAP-002 txn). `identify(analyticsSubjectId)` **only** — never `tokenIdentifier`/email/phone/name/IP to vendors; reset on logout before next identity (dual-browser reset CAP-457).
- **PostHog mirror (CAP-442, R-MIRROR):** any `rawEvents` committed with `posthogMirror=true` schedule a best-effort mirror; failure does not roll back domain/rawEvents.
- **The signup `rawEvents` row is written at `finalizeBootstrap` completion (CAP-004) — i.e. on `/welcome`, not at `/signin`.** The L08 `signup_completed` stage (CAP-445) fires at finalize.
- **Waitlist-mode exclusion (CAP-478):** waitlist capture emits **no** L08 `signup_completed`.
- **No dedicated magic-link-request event** is named. Any captured event must be catalog-registered (CAP-436/CAP-437).

## 6. Components Used
- **Auth card container** — STYLE-KIT §4.3 "Auth cards: 420px max." *Archetype gap (all panels agree): §11 has no dedicated Auth Card component — it is a layout width, composed from primitives.*
- **Text Input** — §11.2, states Default/Hover/Focused/Error/Disabled (§11.8) — sign-in identifier.
- **Button Primary** — §11.1, incl. **Loading** (spinner) + Disabled — the magic-link request action.
- **Full logo** — §10.2 (usage list explicitly includes "auth"). *[Evidence-resolved: GLM+Opus listed it, GPT omitted; STYLE-KIT §10.2 confirms "auth" as a Full-logo usage → included on evidence.]*
- **Feedback surface — unresolved by register:** Toast (§11.7) and inline Text Input **Error** (§11.8) are both available; **the register does not prescribe which** sign-in outcomes surface via toast vs inline. *[2-1 with Opus on the include side → Opus's vote dropped → 1-1 → register is silent → listed as available, not prescribed.]* → Open Questions.

## 7. Open Questions
1. **Post-finalize redirect** (new users → `/welcome`? existing users → ?) is not stated anywhere in the register.
2. ~~Behavior when an **already-authenticated user visits `/signin`** — redirect ownership is unspecified (no CAP governs it). → relates to ESCALATION E3.~~ **→ CLOSED (2026-08-26, E3/X1): Platform-Wide Routing Convention, CONTRACT-1-app-shell §1 — complete → `/feed` (rule 3), pending_context → `/welcome` (rule 2).**
3. **Waitlist-mode capture on `/signin`** — does it call `waitlist.join` (CAP-014 publicMutation) or a distinct mutation? Register gives the write target, not the call.
4. **CAP-030 invite mechanism** (delivery channel, token, landing) is undefined — how an invited waitlisted user *arrives* at conversion is unspecified.
5. **Closed-mode presentation** (message vs. removed CTA) — no behavior/copy beyond "reject / no capture."
6. **Error contracts** — invalid / expired / already-used magic link and provider-failure codes are undefined.
7. **Form field schema** — the identifier is implied by the email-hash rate limit, but field schema, normalization, and validation errors are undefined.
8. **Feedback mechanism** — toast vs inline for request success/throttle/failure is register-silent (see §6).
9. No named analytics event exists for magic-link request, success, throttle, or auth failure.
