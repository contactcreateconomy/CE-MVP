# CONTRACT-5-discussion-thread-FINAL

**Screen:** Discussion / Thread + MAX map — enrichment on `/p/[slug]`
**Wave:** 5B (M6 Discussion — layered onto the Wave-2 Post Detail base)
**Template archetype:** Comment thread + intelligence panel (layered on Reading column + thread)
**Primary CAP-IDs:** CAP-120, 121, 122, 123, 124, 125, 126, 127, 128, 131, 139
**Actors:** anonymous, member
**Register basis:** 552-row register, in-scope rows (CAP-120–139) verified directly.
**Reconciliation:** Route/Access, Entities, Actions, Analytics, Components locked. States: GPT's ~150 sub-states folded to the enum-driven compact set (GLM+Opus majority; Opus in majority → vote not used). See RECONCILIATION-5B §1.

---

## 1. Route & Access
- **Layered onto the Wave-2 `/p/[slug]` base** (CAP-090 posts.getDetail + per-type mechanics CAP-092–099 + CAP-107 SEO render — already built, referenced not redrafted). This contract covers **only** the discussion layer.
- **Actors:** member, anonymous. **Read paths are public** (CAP-123 comments.list, CAP-124 comments.getThread — `Gated by: none`); realtime push (CAP-139) reaches anonymous too. **Two explicit branches required** (anonymous-safe vs full member view) per the Public-Read-Query rule; member responses may include actor-specific state (own reaction/save/context-signal/read-position), anonymous responses must not.
- **Write paths are member-only and pre-gated:** comment submit runs the **M7 R-ELIGIBILITY comment check** (CAP-141: email+mobile verified + active + not-restricted — **no basic-profile gate**) and the **M13 auto-mod pass** (CAP-321, per CAP-120's Gated-by). `create_comment` / `react` are in `assertCustomerCapability`'s applies-to list (CAP-393). **CAP-551** writes `users.mobileVerified=true` and `privateUserData.mobileNumber` (number never on the public user row). OTP delivery provider is **FOUNDER-DECISION-M7-01** (not specified here).
- **Reaction eligibility** (CAP-125): additionally excludes self/staff/persona/new-tier + M7 trust-tier gate.
- **CAP-127 target is SETTLED (register-confirmed, not open):** `moderationCases.target` = the comment record (matches CAP-135's pattern); the parent post is reached via the comment's `postId` FK — no redundant post target. *(Verified: CAP-127 Notes "RESOLVED 2026-08-09.")*
- **MAX compute is NOT this screen:** CAP-132 (intelligence.refresh, cron) and CAP-133 (independent entailment pass, System) produce the artifacts this layer renders via CAP-124. Neither is in this batch → the MAX panel renders empty until CAP-132 ships (same layering caveat as the base screen).

## 2. Entities

| Entity | Direction | Detail (verbatim fields in play) |
|---|---|---|
| `comments` | read + write | `postId, parentCommentId?, threadRootCommentId (top-level = own id), replyToCommentId?, depth {0|1}, authorType, authorUserId?, authorPersonaId?, body, authorIntent? {question|answer|evidence|counterpoint|experience}, isQuestion, moderationStatus, editedAt?, deletedAt?, lastActivityAt, createdAt` |
| `commentScores` | write (dirty-flag only) | projection; **this layer only sets dirty-flags — recompute is CAP-129/130 (cron, not this screen)** |
| `threadStats` | write (same-mutation deltas) | `humanCommentCount, personaCommentCount, topLevelCount, replyCount, humanParticipantCount, unresolvedQuestionCount, latestHumanCommentId?, latestActivityAt, threadRevision` |
| `commentReactions` | read + write | `reactionType {valuable|negative}` — mutually exclusive per (userId, commentId), server-enforced; `reason? {disagree|not_useful|needs_evidence|off_topic}` (optional, PRIVATE); `weightAtCast` (signalReputation + legitimacy; NEVER Recognition-derived) |
| `commentSaves` | read + write | private; unique (userId, commentId); separate from post `saves` |
| `commentContextSignals` | write | `signalType {context_needed|outdated}`; hidden until threshold |
| `threadReadStates` | read + write | `lastReadCommentId?, lastReadAt, lastSeenHumanCommentCount, lastSeenThreadRevision`; unique (userId, postId) |
| `userReadingProgress` | write | `topicsViewedCount, postsReadCount, totalReadTimeSeconds` (feeds M7/M12 reading-trust) |
| MAX artifacts (read-only) | read | `threadIntelligenceRuns, threadThemes, threadPositions` (incl. `commonGround?` only when ≥2 genuine stance clusters, never "consensus"), `threadQuestions` |
| `threadPluginConfig`, `postTypeConfig` | read | overlay (allowedSortModes + overlayComponent + pinnedSlotBehavior {none|top-badge|separate-panel}); may NEVER redefine depth/authorship/moderation/URL/persona/pagination |
| `postHelps` | write (via CAP-122) | `acceptedCommentId` cleared same tx on comment delete (CAP-106) |
| `rawEvents` | write | same-mutation atomic append on every write action |
| `users`, `privateUserData`, `posts`, `capabilityRestrictions`, `systemConfig`, `feedSessions` | read | per CAP-120/125/139 read sets |

- **Teardown:** CAP-122 soft-delete (tombstone; replies preserved). No hard-delete / un-tombstone path (consistent with the register's soft-delete-forever pattern; likely intentional).

## 3. States
*(Enum-driven set below. GPT's ~150 per-transition sub-states — each sort as loading/loaded, each eligibility rejection, each hot-window bound as its own state — are folded, since the authoritative state sets are the `comment.sortMode`, `reactionType`, `moderationStatus`, and `authorIntent` enums.)*

**A. Sort modes (`comment.sortMode`, six):** `best` (Bayesian confidence-damped positive; category-scoped prior; NOT Wilson; one numerator) · `live` (engagement × time-decay) · `new` · `top` · `most_discussed` (volume × balance) · `qa` (accepted + Best). Cursor pagination **freezes rankVersion per session** (CAP-123); realtime is **hot-window only, snapshot-stable — never reorder while reading**.
**B. Comment lifecycle:** created → **edited** (editedAt marker, CAP-121) → **soft-deleted** (tombstone; **replies preserved**; clears `postHelps.acceptedCommentId` same tx, CAP-122). Moderator soft-delete = same mutation under moderator RBAC §12.
**C. `moderationStatus` (enum):** not_required · pending · passed · held · rejected · removed. Held/rejected fail-closed (CAP-135 owns moderation, not this screen).
**D. Structure:** `depth {0|1}` — one-reply enforced (INV-1); `threadRootCommentId` = own id on top-level.
**E. Self-labeling:** `authorIntent?` optional + `isQuestion`.
**F. Reaction states (per member per comment):** no reaction · **valuable** (single positive quality signal — only Best numerator) · **negative** (hidden result: no public count, no author notification, NEVER lowers Best) + optional PRIVATE `reason` — valuable/negative **mutually exclusive, server-enforced** · save (orthogonal). `disagree` in a Debate thread is stance-only, permanently barred from any quality-derived term.
**G. Context signal:** context_needed | outdated; **hidden until threshold**; routes to review queue (CAP-137); never cuts rank (INV-3).
**H. Read state (member only):** jump-to-unread / "new since you left" from `lastSeenHumanCommentCount` + `threadRevision`.
**I. Realtime (CAP-139):** "N new" within hot-window bounds — **≤100 live top-level, ≤5 expanded groups, ≤50 replies/group, 30-min sub refresh**; snapshot-stable.
**J. MAX panel (rendered, not computed):** themes + positions (common-ground + divergence) + Q&A; **entailment {supported|contradicted|insufficient}** per claim with claimSpans; any contradicted/insufficient discards the whole artifact revision — **last valid kept** (CAP-133); human-only input, personas excluded; LABELED; presentation-only toggle, one canonical URL.
**K. Persona comments in thread:** render with AI badge (FATAL-M17-02); excluded from rank/human counts (INV-6); `threadStats.personaCommentCount` separate.

## 4. Actions → API

| Action | Actor | CAP / mutation | Writes | Gates |
|---|---|---|---|---|
| Submit comment | member | CAP-120 `comments.create` (R-URL; R-GATE) | comments (+ parent replyCount patch), threadStats, commentScores (dirty), rawEvents | M7 R-ELIGIBILITY; M13 auto-mod; INV-1 depth; INV-2 no user URLs |
| Edit own comment | member | CAP-121 `comments.edit` | comments (edited marker), rawEvents | CAP-120; ownership |
| Soft-delete comment | member, Moderator | CAP-122 `comments.softDelete` | comments (tombstone), postHelps (clear acceptedCommentId same tx), rawEvents | CAP-120; moderator RBAC §12 |
| Paginate by sort | member, anonymous | CAP-123 `comments.list` (R-PAGINATE) | none (index scan) | none; cursor freezes rankVersion |
| Open thread page | member, anonymous | CAP-124 `comments.getThread` | none | none; adds threadContext overlay + MAX refs |
| Toggle valuable | member | CAP-125 `reactions.toggle (valuable)` (R-REACTIONS; R-ELIGIBILITY) | commentReactions, commentScores (dirty), threadStats, rawEvents | CAP-120; R-ELIGIBILITY (self/staff/persona/new-tier); M7 trust tier |
| Toggle negative (+ optional reason) | member | CAP-128 `reactions.toggle (negative)` | commentReactions, rawEvents; commentContextSignals (if needs_evidence); moderationCases (if off_topic) | CAP-120; R-ELIGIBILITY |
| Save comment | member | CAP-126 `saves.toggle` | commentSaves, commentScores (dirty), rawEvents | CAP-120 |
| Signal context | member | CAP-127 `context.signal` | commentContextSignals, rawEvents; possibly reports/moderationCases (target=comment, SETTLED) | CAP-120 |
| Mark read state | member | CAP-131 `readState.mark` | threadReadStates, userReadingProgress | none |
| Realtime push | System | CAP-139 (R-REALTIME hot-window; no mutation) | none | CAP-124 (page open) |

## 5. Analytics Events
Every write action appends `rawEvents` **in the same mutation** (atomic, never fire-and-forget — CAP-120 note; CAP-436 same-mutation capture; CAP-437 catalog gate; CAP-438 stamps isStaff/isPersona/isCountableAtWrite). **No `eventType` literals are named anywhere in the register for these rows — catalog-owned; none invented.** Read paths (123/124/131/139) write no `rawEvents`. Persona-authored comments stamp `isAiPersona` and are excluded from product counters (S18/L08 `excludePersonas`, CAP-434). Cross-wave: **CAP-366 (M14)** — a member's first public comment sets `users.engagedAt` (held contribution does not); that M14 row is not in this batch.

## 6. Components Used
- Base Wave-2 reading column (already built) · §11.3 card family (comment cards) · **§11.6 Avatar** · **§11.5 Pill/Tag** (authorIntent label, AI badge) · **§11.1 Button** (react/save/reply) · **§11.7 Modal/Sheet** (negative-reason capture — private) + Toast · **§11.2 Textarea** (compose/edit) · **§11.7 Dropdown** (sort selector, reaction reason) · **§11.9 Skeleton** · nav tabs for sort modes · threadContext overlay per threadPluginConfig.
- **Archetype gap: A9 Discussion map / MAX viz** — inventory §3 ("no map/cluster/graph component") — do not invent. No §11 nested one-level thread, rank-version pagination indicator, context-signal control, private-negative-reason control, or jump-to-unread component either.

## 7. Open Questions
*(All escalated items in RECONCILIATION-5B. These are unspecified detail.)*
1. **Public-read branch field lists** for `comments.list` / `comments.getThread` — anonymous-safe vs full-member views required by standing rule; no register row enumerates the fields (only registered member delta is CAP-131). (All three.)
2. **`commentReactions.reason` read-scoping** — the reason enum is PRIVATE, but no CAP binds how the thread render suppresses it from other viewers (CAP-128 gives "no public count" for the reaction, not the reason field). (GLM + Opus.)
3. **"Expanded group" semantics** in the hot-window bound (≤5 expanded groups) — undefined anywhere. (GLM.)
4. **MAX absence / stale states** — first-thread (no artifacts) and last-valid-kept-after-discard render states unspecified (CAP-132/133 own compute; not in this batch). (All three.)
5. **Context-signal threshold** — "hidden until threshold": no config key/value named. (GLM.)
6. **Tombstone visible copy** — replies-preserved tombstone confirmed; display text unspecified (none invented). (GLM.)
7. **`authorIntent` input surface** — where the member self-labels is unspecified. (GLM.)
8. **Held vs hard-rejected comment user-facing outcomes** + comment body-length/error codes — unspecified. (GPT.)
9. **Realtime reconnection / missed-event recovery / "N new" loading** — unspecified. (GPT + Opus.)
10. **No un-tombstone / restore path** — consistent with soft-delete-forever pattern; likely intentional, noted per standing rule. (Opus.)
