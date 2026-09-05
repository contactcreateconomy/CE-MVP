# CONTRACT-5-settings-profile-FINAL

**Screen:** Profile Settings & Privacy — `/settings/profile`
**Wave:** 5B (M7 Posting Eligibility & Profile)
**Template archetype:** Settings form
**Primary CAP-IDs:** CAP-143, CAP-146, CAP-147, CAP-149, CAP-150, CAP-151, CAP-157, CAP-549, CAP-552
**Actor:** member (own data only)
**Reconciliation:** Write-surface framing locked (all three). States: GPT's ~60 sub-states folded. **E-settings-1, E-settings-2, E-settings-3, W5B-AUDIT-1 CLOSED 2026-08-25.** See RECONCILIATION-5B §3.

---

## 1. Route & Access
- **Path:** `/settings/profile`. **Dynamic params:** none. **Actor:** member (own data only). No anonymous access; members edit only their own settings.
- **Ownership split (all three agree, stated in both contracts):** this screen is the **WRITE surface** for the three shared CAP-IDs — CAP-143 (set optional attributes) and CAP-146 (add social handle) / **CAP-549 (revoke social handle)** are mutated **here**; **CAP-552** toggles `profileVisibility` / `leaderboardOptOut` here; CAP-150's badge computation is triggered from writes here. **`/u/[handle]` is the READ/DISPLAY surface.**
- **CAP-147** social verification is a **Phase-3 stub** (admin-config toggle exists); V1 may expose its disabled state but must not claim functional verification.
- **CAP-157** re-acceptance prompt is a **global overlay** (inventory overlay list) attaching to this host flow; the member acts on it here via **`consent.reaccept`** (E-settings-3 closed). *(Wave 7A E2: `consent.reaccept` is an M7 PROFILE mutation writing `userConsentRecords` — no longer name-matched to M18's CMP `consent.record`/`consent.withdraw`, which are canonical platform-wide names.)*
- Optional attributes are consent-bound: every CAP-143 field write is gated by the CAP-148 consent flag for that field.

## 2. Entities

| Entity | Direction | Detail |
|---|---|---|
| `profiles` | read + write | `roleArchetype? {solo_creator|small_team|agency|exploring|prefer_not_to_say}, ageBand? (banded, optional), toolsUsed[] (tool ids — direct tool-affinity, NOT a financial proxy), bio, avatar, consentFlags, profileVersion` |
| `userProfileAttributes` | write | optional, versioned, consent-bound — `attributeType, value, valueVersion, visibility, consentStatus, providedAt, updatedAt, deletedAt` ("prefer not to say" MUST be distinguishable from "never asked") |
| `userSocialAccounts` | write (add / verify stub / **revoke**) | `platform, handle, profileUrl, verificationStatus, visibility {private|public|future_marketplace_only}, connectedAt, revokedAt?, deletedAt?` — stored handle only, **no OAuth/fetch in V1**. **E-settings-2 CLOSED:** CAP-549 `social.revoke` writes `revokedAt`, `deletedAt` (soft-delete, CAP-545 precedent). |
| `userConsentRecords` | read + write (append-only) | grants + withdrawals + re-accepts all append |
| `userInferences` | write (invalidate) | erasure path: dependent inferences invalidated (CAP-151) |
| `profileCompletionEvents` | write (append-only) | per-field Recognition history |
| `interestTaxonomy`, `tools` | read | tile reference; tool-affinity picker source |
| `users` | read + write | CAP-157 reads `rulesAcceptedVersion`. **CAP-552 writes `profileVisibility {public\|private}`, `leaderboardOptOut`** (W5B-AUDIT-1 closed). |
| `auditLog` | write | non-value-bearing erasure records (CAP-151) — **erased values never retained in `auditLog.prev`** |

## 3. States
*(Field-decision + consent/erasure set below. GPT's ~60 sub-states — each attribute's set/unset/prefer-not-to-say/erased, each verification sub-state — folded to the per-field decision model + consent/erasure lifecycle.)*

**A. Optional-attribute states (CAP-143's field set):** roleArchetype · ageBand · toolsUsed · socials · bio · avatar — each independently: unset → set → "prefer not to say" (**= a completed decision, equal credit**) → erased (CAP-151 detach). Tap-only, progressive, purpose-labelled.
**B. Social handle states (CAP-146/147/549):** none · added (stored handle only, no fetch) · visibility chosen `{private|public|future_marketplace_only}` · verificationStatus (**Phase-3 stub**, CAP-147) · **revoked/deleted via CAP-549** (soft-delete; row retained).
**C. Consent states (CAP-148/149):** granted → withdrawn (append-only both ways); withdrawal **overrides analytics/personalization/marketplace/completion use** and triggers the CAP-151 erasure cascade.
**D. Erasure states (CAP-151):** member-initiated field erase OR consent-withdrawn cascade → `userInferences` invalidated + `userProfileAttributes` detached + non-value-bearing `auditLog` record; **Recognition persists as "completed under version X" without revealing answers; aggregates survive only if unlinkable.**
**E. Completion-badge recompute (CAP-150):** field completes → recompute; **per-field badges, NOT a gamified 100% bar**; prefer-not-to-say earns equal credit; firewall: Recognition only, never Signal/rank/reach. Badge UI renders on `/u/[handle]`.
**F. Re-acceptance prompt (CAP-157):** System detects material rules/policy version bump (last-accepted vs current) → prompt surfaced; **no write until the member acts**; re-acceptance is **`consent.reaccept`** (append-only versioned consent log). *(Wave 7A E2: M7 profile mutation; M18 CMP names unaffected.)*
**G. Privacy toggles (CAP-552):** `profileVisibility {public|private}` (default public) · `leaderboardOptOut` (boolean, bootstrap default false) — independent toggles, same mutation. These are `users` self-preference fields, **not** CMP/`consentRecords` (FATAL-M18-02 lives on M18 consent, not here).

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| Set optional attribute | member | CAP-143 `profile.setAttribute` (R-PROFILE-ASK) | profiles / userProfileAttributes, userConsentRecords, profileCompletionEvents | CAP-148 (consent flag for field) |
| Add social handle | member | CAP-146 `social.add` | userSocialAccounts, userConsentRecords | CAP-148 |
| Verify social (stub) | member | CAP-147 `social.verify` | userSocialAccounts (verificationStatus) | CAP-146; Phase-3 |
| Revoke / remove social handle | member | CAP-549 `social.revoke` | userSocialAccounts (revokedAt, deletedAt) | none |
| Withdraw consent | member | CAP-149 `profile.consentWithdraw` (R-CONSENT; renamed Wave 7A E2 from `consent.withdraw` — M7 profile consent, distinct from M18 CMP names) | userConsentRecords (append-only); triggers **CAP-151** erasure cascade | CAP-148 |
| Erase field / attribution detach | member, System | CAP-151 `erasure.detachAttribute` (R-ERASURE) | userInferences (invalidate), userProfileAttributes (detach), auditLog (non-value-bearing) | CAP-149 or direct erasure request |
| Recompute completion badges | System | CAP-150 `completion.recompute` (R-COMPLETION) | profileCompletionEvents (append-only); recognitionScore via M12 | CAP-143 or CAP-144 |
| Re-accept rules/policy | member (prompt System-triggered) | CAP-157 `consent.reaccept` | userConsentRecords (append) | CAP-140 |
| Toggle profile visibility | member | CAP-552 `profile.togglePrivacy` | users (profileVisibility) | none |
| Toggle leaderboard opt-out | member | CAP-552 `profile.togglePrivacy` | users (leaderboardOptOut) | none |

## 5. Analytics Events
**None named.** CAP-143/146/147/149/150/151/157/549/552 write no `rawEvents`. Accountability trails = `userConsentRecords` (append-only), `profileCompletionEvents` (append-only), `auditLog` (erasure records). CAP-149's consent withdrawal *overrides* analytics use — a governance effect on M16, not an emitted event. The inference read-side (CAP-145, cron over rawEvents) is M7 System-side, not this screen.

## 6. Components Used
- Settings-form archetype (§12) · **§11.2** Text Input (bio, handle) · Select (banded enums: roleArchetype, ageBand) · tap-target pickers (toolsUsed tool-affinity) · Checkbox/Toggle (consent flags, visibility) · **§11.1** Button (save/withdraw/erase/revoke — Destructive for erase and revoke) · **§11.7 Modal** (erase confirm; re-acceptance overlay; revoke confirm) + Toast · **§11.9 Skeleton** · inline Error §11.8 (available-not-prescribed).
- **Archetype gaps:** no consent-history, erasure-impact, inferred-vs-declared, social-handle-stub, or versioned-reacceptance component in §11.

## 7. Open Questions
*(Escalated items in RECONCILIATION-5B. These are unspecified detail.)*
1. **Interest editing on this screen** — CAP-144 (tiles) is assigned to `/setup`; whether post-setup tile edits live here or route back is unpinned (CAP-143's field list doesn't include interests). (GLM.)
2. **Attribute-specific purpose-consent mapping** is incomplete in the capability rows. (GPT.)
3. **Consequences of declining CAP-157 re-acceptance** — unspecified. (GPT.)
4. **Erasure outcome/timing per optional field** — not fully specified. (GPT.)
5. **Age-band income/spend are Phase-2** (data-model) — the composer here must not offer them. (GLM.)
