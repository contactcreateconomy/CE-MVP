# CONTRACT-1-waitlist-FINAL

**Screen:** Waitlist Join — `/waitlist`
**Wave:** 1 (M1 Foundation)
**Template archetype:** Form / auth card
**Primary CAP-IDs:** CAP-014, CAP-015
**Actor:** anonymous
**Reconciliation:** Route/Access, Entities, Actions, Analytics locked (all three aligned). Feedback-surface (toast vs inline) is register-silent — GPT and GLM independently reached the same "unspecified" conclusion. See RECONCILIATION-1 §3.

---

## 1. Route & Access
- **Path:** `/waitlist`. **Dynamic params:** none. **Actor:** anonymous. **Gated by:** none.
- `waitlist.join` is a **publicMutation** — no auth required (CAP-014).
- **Identity invariant:** joining must **not** create a `users` row or role assignment (CAP-014; data-model M1 "`waitlistEntries` (not a user)").
- **Redirect rules:** none stated in the register.
- The register does **not** state whether `/waitlist` is hidden or redirected when `signup.mode` is open or closed (Open Questions). *Auth-state routing is covered (2026-08-26): an authenticated `complete` user hitting `/waitlist` → `/feed` per rule 3 of the **Platform-Wide Routing Convention** (CONTRACT-1-app-shell §1); the signup.mode display question above remains open.*

## 2. Entities
- **CAP-014:** Reads `waitlistEntries` · Writes `waitlistEntries`.
- **CAP-015:** rate-limit gate — Reads **none** · Writes **none**.
- **Canonical invariant:** `waitlistEntries` is a first-class M1 entity, **not** a user entity — no `users`/`roleAssignments` created.

## 3. States
1. **Form idle** — anonymous user can submit the join form; **email is the only field implied by the register** (CAP-015 keys on email). Anything beyond email is unspecified (Open Questions).
2. **Joined / success** — `waitlistEntries` row written (CAP-014); confirmation presentation unspecified.
3. **Rate-limited — IP** — 10 / h exceeded (CAP-015).
4. **Rate-limited — email** — 3 / 24h exceeded (CAP-015).

*Not locked as canonical states (register silent): field-focus/submitting micro-states, duplicate/existing-entry outcome, network/server failure. → Open Questions. Invited-later conversion is **not** rendered by `/waitlist` — it uses the ordinary Auth admission/bootstrap flow under CAP-030.*

## 4. Actions → API
1. **Submit waitlist join** — `waitlist.join` (**publicMutation**), CAP-014, Source Rule §9 Backend Operations / `waitlist.join`.
2. **Apply rate limits** — CAP-015, §8 Rate limits: reject attempts exceeding **10/hour per IP** or **3/24h per email**.

## 5. Analytics Events
**None identified.** No CAP-436–463 row references `waitlist.join`; no catalog `eventName` exists for it. Waitlist email capture does **not** count as completed signup — it emits no L08 `signup_completed` (CAP-478). If a waitlist event is ever added, M16 requires catalog registration before emission (CAP-436/CAP-437).

## 6. Components Used
- **Form / auth card** — STYLE-KIT §4.3 (Auth cards 420px max) / §12 form layout. *Archetype gap (all panels agree): §11 defines no named Auth Card or general Form Card — only Post/User/Stats/Notification/Widget Card.*
- **Text Input (email)** — §11.2, states Default/Hover/Focused/Error/Disabled.
- **Button Primary** — §11.1, incl. **Loading** state (spinner §11.9) — submit action.
- **Feedback surface — unresolved by register:** CAP-014/CAP-015 do not specify inline vs toast. Text Input **Error** (§11.8) is the only register/style-defined inline surface; Toast (§11.7) is available but not prescribed. → Open Questions.

## 7. Open Questions
1. **Form fields beyond email** are unspecified.
2. **Duplicate-email behavior** is undefined — no idempotent-success, "already joined," update-existing, or rejection contract is stated.
3. **`/waitlist` availability** when `effectiveSignupMode` = open or closed (route hidden? still reachable?) is unspecified.
4. **No redirect / next action** is specified after a successful join.
5. **Rate-limit error keys** — whether IP and email limits return distinct keys or a common throttling response (CAP-015) is unspecified.
6. **Does `waitlist.join` emit a `rawEvent`?** CAP-437 requires catalog registration before any emit; no row addresses `waitlist.join`'s catalog status.
7. **Feedback mechanism** — inline vs toast is register-silent (see §6).
