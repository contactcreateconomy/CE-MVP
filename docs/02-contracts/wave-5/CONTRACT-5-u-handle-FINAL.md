# CONTRACT-5-u-handle-FINAL

**Screen:** Profile (merged Profile + Distribution) — `/u/[handle]`
**Wave:** 5B (M7 Profile — read/display surface; M12 Metrics deferred to Wave 7)
**Template archetype:** Entity profile, tabbed (Overview / Journal / Metrics)
**Primary CAP-IDs:** CAP-526 (Overview), CAP-527 (Journal Summary), CAP-528 (Journal Ledger); CAP-550 (System handle reserve — no UI)
**Actors:** anonymous, member
**Reconciliation:** Read-surface framing, Journal-self-only, and Metrics-W7-deferred all locked (unanimous). States: GPT's ~70 sub-states folded. **E-handle-1 CLOSED 2026-08-25** (CAP-550 initial reserve on `username` / `usernameNormalized`). Handle CHANGE deferred as **FUTURE-M7-01**. See RECONCILIATION-5B §4.

---

## 1. Route & Access
- **Path:** `/u/[handle]`. **Dynamic param:** `[handle]`. **Actors:** anonymous, member. Core render CAP-526 (`Gated by: none`, public read).
- **Ownership split (all three agree):** this screen is the **READ/DISPLAY surface** for the shared CAP-IDs. CAP-143/146/549 mutations happen on `/settings/profile`; CAP-150's badge UI renders here from `profileCompletionEvents`-derived state. **This screen owns no profile-data mutation.**
- **Handle resolution (E-handle-1 CLOSED):** **CAP-550** (`handle.reserve`, System, Has-UI NO) resolves and reserves a member's public handle at profile creation by writing **`users.username` / `users.usernameNormalized`**, enforcing uniqueness — same collision discipline as CAP-474 for posts/tools slugs. A missing/unknown handle is a not-found for this route. **Handle CHANGE after initial assignment is not built** — **FUTURE-M7-01** (usernames immutable at MVP-1).
- **Public-Read-Query rule:** two explicit branches (anonymous + member). Known deltas: **Journal tabs are self-only at launch** (CAP-527 register assumption, verbatim: "self-only visibility at launch — flag if public visibility intended"); anonymous/other-member views get Overview only. Per-field anonymous-safe lists otherwise unspecified (Open Question).
- **M12 Metrics content is explicitly Wave 7** (inventory: "Overview / Journal / Metrics, M12 enrichment W7"; CAP-281/297/299–305/313). This contract drafts **Overview + Journal only**; the Metrics tab structure is reserved, content deferred — same layering pattern as `/p/[slug]`.
- **noindex** — `/u/[handle]` is a profile URL, noindex under the growth contract (CAP-486).

## 2. Entities

| Entity | Direction | Detail |
|---|---|---|
| `profiles` | read | identity block: roleArchetype?, toolsUsed[], bio, consentFlags, profileVersion |
| `users` | read (implied by identity) | displayName, username, avatarAssetId; **`profileVisibility {public|private}` exists — private-profile rendering unspecified (Open Question)**. **Never reads `privateUserData` / `mobileNumber`.** |
| `distributions`, `badges` | read (row-level; **content renders W7**) | CAP-526's read set includes them; Reach/Signals/Awards/ladder rendering is the W7 Metrics enrichment — reads exist now, rendering deferred |
| `userProfileAttributes`, `userInterests` | read | per CAP-526 read set; visibility/consent-bound fields must respect per-field `consentStatus` + the anonymous-safe branch |
| `activityLedger` | read (Journal) | `userId, eventType (v1 starter: post_published · comment_created · upvote_given · save_added · resource_acquired · tier_unlocked), targetType, targetId, summary (human text), meta (each field MUST be tagged safe-for-public vs always-private), visibility {private|public} (default private), createdAt` |

- **CAP-526/527/528 all Write: none** (pure reads). No shared-CAP mutation originates here. CAP-550 writes happen at profile creation (System), not on this page.

## 3. States
*(Tab + viewer + Journal-entry set below. GPT's ~70 sub-states — each field public/private, each ledger event-type as a state — folded to the tab/viewer/entry model.)*

**A. Tab states:** **Overview** (identity, per-field completion badges [CAP-150]; **Awards shelf [CAP-297] + M12 triad Reach·Signals·Awards + ladder [CAP-313] RESERVED for the W7 Metrics enrichment — render empty/placeholder until W7**) · **Journal — Summary** (human-friendly rolled-up aggregates + milestones) · **Journal — Ledger** (raw append-only entries, paginated) · **Metrics** (reserved, W7).
**B. Viewer states:** self (member) — full view incl. Journal tabs · other member — Overview (Journal hidden; ledger private-by-default) · anonymous — Overview, anonymous-safe branch · **handle not-found** (CAP-550 uniqueness/reserve failed to map).
**C. Journal entry states:** per `activityLedger` — eventType set above; visibility private (public-Journey toggle is a **reserved future feature, not built** — the field exists but no CAP governs a public flip → Open Question).
**D. Completion-badge states:** per-field finalized badges render; prefer-not-to-say fields show equally-credited completion (Recognition-firewalled — display only, never Signal/rank/reach).
**E. Profile-visibility states:** public (default ON) vs private — behavior for non-self viewers unspecified (Open Question).

## 4. Actions → API

| Action | Actor | CAP | Reads | Writes |
|---|---|---|---|---|
| View merged profile (Overview) | anonymous, member | CAP-526 (query unnamed — NEW row, no mutation named) | profiles, distributions, badges, userProfileAttributes, userInterests | none |
| View Journal → Summary tab | member (self) | CAP-527 | activityLedger, profiles | none |
| View Journal → Ledger tab | member (self) | CAP-528 | activityLedger | none |
| Reserve/resolve handle at profile creation | System | CAP-550 `handle.reserve` | users (existing username, usernameNormalized) | users (username, usernameNormalized) |

- **No member mutations on this screen.** Profile edits deep-link to `/settings/profile`; ladder/Metrics interactions arrive W7. CAP-550 is System wiring at creation, not a page action.

## 5. Analytics Events
**None named.** CAP-526/527/528 are pure reads; no `rawEvents`. `/u/[handle]` is noindex (CAP-486). A profile-view event does not exist in the register — not invented (note: `rawEvents.targetType` enum includes `user_profile`, so the envelope *anticipates* such events, but no capability emits one — flag, don't assume). `activityLedger` is the authoritative activity history, not an analytics substitute. Profile reads must not expose private Journal metadata or inferred/private profile attributes.

## 6. Components Used
- Entity-profile tabbed layout (§12) · **§11.6 Avatar** (2xl/3xl per self/other) · **§11.5 Pill/Tag** (completion badges — per-field, not a progress bar per CAP-150) · §11.3 card family (identity card; Journal Summary milestones) · **Stats Card** (§11.3 — Metrics W7 placeholder) · **§11.9 Skeleton** · nav tabs · paginated list for Ledger.
- **Archetype gaps:** **A1 Data table** for the Journal Ledger (no §11 table); **A8 Ladder / Level visualization** (W7, deferred, not a this-wave gap); no merged Profile+Distribution shell, Journal Summary, raw Ledger, or privacy-filtered-metadata-row component.

## 7. Open Questions
*(Escalated items in RECONCILIATION-5B. These are unspecified detail.)*
1. **Anonymous-safe vs full-member field lists** for CAP-526 — standing rule requires both branches; only the Journal self-only delta is registered. Which Overview fields (ageBand? toolsUsed? socials?) are anonymous-safe is unspecified. (All three.)
2. **Private-profile rendering** (`profileVisibility=private`) to non-self viewers — register-silent. (GLM + GPT.)
3. **CAP-527's register ASSUMPTION** (self-only Journal at launch) — carried as stated; confirm whether public-Journey was ever intended for MVP-1 (data-model says private for all users now, toggle reserved). (All three.)
4. **`activityLedger.visibility=public` latent contradiction** — the field + a "future public-Journey toggle" exist in the schema, but no CAP builds the toggle; the render must default-private with no capability governing a future public flip. (GLM + Opus.)
5. **W7 seam / empty-state** — CAP-526's read set already includes `distributions`/`badges` which M12 (W7) populates; empty-state rendering for a not-yet-existing Distribution + the reserved Awards shelf is unspecified (M14 R-EMPTY honesty is the nearest governing rule). (GLM + Opus.)
6. **Unknown/extensible ledger event rendering** — unspecified. (GPT.)
7. **Persona vs member handle boundary** — `/u/[handle]` (CAP-526) is for members; personas have a separate `/personas/[id]` (CAP-180) and have `displayName` but no `username`. No CAP states what `/u/[handle]` does if a handle resolves to a persona-backed identity — the boundary is implicit. (Opus.)
8. **Journal append-only correction path** — no member-delete/redaction path if a summary or metadata field is later wrong or becomes sensitive. (GPT.)
9. **Handle CHANGE after CAP-550 initial assignment** — **not built.** **FUTURE-M7-01** (usernames immutable at MVP-1).
