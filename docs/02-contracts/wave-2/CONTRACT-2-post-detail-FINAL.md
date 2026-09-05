# CONTRACT-2-post-detail-FINAL

**Screen:** Post Detail — `/p/[slug]`
**Wave:** 2 (M4 Post System) — **Wave-2-owned CAPs only:** CAP-090, CAP-092–099, CAP-107
**Template archetype:** Reading column + thread *(+M6 CAP-120–139 enrichment W5, +M11 CAP-245 W6)*
**Primary CAP-IDs:** CAP-090, CAP-092, CAP-093, CAP-094, CAP-095, CAP-096, CAP-097, CAP-098, CAP-099, CAP-107
**Actor:** anonymous, member
**Reconciliation:** GLM+Opus both scoped to Wave-2-owned CAPs (majority) → adopted; GPT's W5/W6 content moved to deferred Open Questions. `unlisted → noindex` resolved on the CAP-107 predicate. See RECONCILIATION-2 §2.

---

## 1. Route & Access
- **Path:** `/p/[slug]`. **Dynamic param:** `[slug]` (unique per `postSeoMeta.slug`). **Actors:** anonymous, member (inventory).
- **Interactive detail load:** `posts.getDetail` (CAP-090, actor **member**). ⚠️ CAP-090's actor column says member while the inventory lists anonymous+member — anonymous query authorization is not stated (Open Questions).
- **Gating chain:** CAP-090 `Gated by: CAP-086`; CAP-092–098 chain-gated as listed; CAP-107 `Gated by: CAP-090`.
- **Debate:** cast = verified member, no existing vote (CAP-093); change = member with existing vote (CAP-094).
- **List:** community-ranked add = verified member (CAP-095); remove = own item (CAP-096); vote = member (CAP-097).
- **Help:** accept — user-Help by post author only; editorial-Help by Editor/Publisher (CAP-098); reopen by post author (CAP-099).
- **Indexability (CAP-107, §17 NFR/SEO):** SSR + indexable when `visibility=public` **AND** `moderationStatus ∈ {not_required, passed}`; **held / rejected / private → noindex**. **`unlisted` → noindex** (rule-derived: `unlisted` fails the public-only predicate). *[Evidence-resolved: GLM derived this; GPT called it "unspecified." CAP-107's predicate is `public AND passed/not_required`, so any non-public visibility is excluded → noindex.]* **noindex (Wave 2 default, flips at Wave 7 per CAP-468)** — indexability is gated behind CAP-468 (provenance block: /how-we-review, /editorial-policy, /ai-disclosure links + provenance metadata); FATAL-M17-01 requires same-wave pairing, never separated (founder decision 2026-08-23).
- **Redirect rules:** none stated in the register.

## 2. Entities
- **CAP-090** (`posts.getDetail`): Reads `posts, postNews, postReviews, postCompares, postSparks, postDebates, postLists, postShowcases, postHelps, postTags, debateVotes, listItemVotes` · Writes **none**. *Audit note: the register previously listed `postHelps` twice in this row's Reads (verbatim duplication); deduped here and in the register (W2-E2 pass, 2026-08-23). `postTags` added to Reads for tag display (CAP-530 write target).*
- **CAP-092** (`compare.render`): Reads `postCompares, tools` · Writes **none**.
- **CAP-093** (`debate.cast`): Reads `posts, postDebates, debateVotes` · Writes `debateVotes, postDebates (tally increment)`.
- **CAP-094** (`debate.change`): Reads `debateVotes, postDebates` · Writes `debateVotes, postDebates (decrement old + increment new)`.
- **CAP-095** (`listItems.add`): Reads `postLists, postListItems` · Writes `postListItems`.
- **CAP-096** (`listItems.remove`): Reads `postListItems` · Writes `postListItems (delete), postListItems (voteCount recompute)`.
- **CAP-097** (`listItemVotes.toggle`): Reads `postListItems, listItemVotes` · Writes `listItemVotes, postListItems (voteCount)`.
- **CAP-098** (`help.accept`): Reads `postHelps, comments` · Writes `postHelps (resolvedStatus=resolved, acceptedCommentId, acceptedByUserId, acceptedAt)`.
- **CAP-099** (`help.reopen`): Reads `postHelps` · Writes `postHelps (resolvedStatus=open)`.
- **CAP-107** (SEO render): Reads `posts, postTypeConfig` · Writes **none**.

## 3. States
**A. Per-type render states** — `posts.getDetail` returns `{post, extension, threadContext}`; `threadContext = {type, mechanic state, acceptedCommentId?, userVote?}` (CAP-090 Notes):
1. **news** — `postNews` block: `sourceOfTruthUrl` (platform-injected), `keyClaims`, `publishedAt`.
2. **review** — `postReviews` block: `toolId`, `verdictScore` (**display-only, never feeds the `tools` aggregate**), `verdictSummary`, `pros`, `cons`.
3. **compare** — `qualitativeGrid` merged with **live-computed** numeric rows: per tool, overall = `ratingSum/ratingCount`; per-dimension = `dimensionSums/dimensionCounts`; **count 0 → "—"** (skip); 2 ≤ `toolIds` ≤ 4 enforced; **no numeric scores stored in `postCompares`** (CAP-092).
4. **spark** — `postSparks.statement`.
5. **debate** — `proposition` + `agreeCount/disagreeCount/abstainCount` (derived tallies; source of truth = `debateVotes`; persona/editorial votes excluded).
6. **list, `community_ranked`** — items votable (CAP-097); verified members add (CAP-095); members remove own (CAP-096); `voteCount` displayed (derived from `listItemVotes`).
7. **list, `static_creator`** — only the author edits items (CAP-095). *(Whether vote-toggle is disabled in this mode is unstated — Open Questions.)*
8. **showcase** — `theThing` + projectUrl button rendered **only when `approvalStatus=approved`** (render rule per CAP-101; the approve/reject action lives on `/admin/moderation`, W7). Sub-states per `approvalStatus {none|pending|approved|rejected}`: pending/rejected render without the button; approved button is platform-rendered with `rel="ugc nofollow noopener noreferrer"`.
9. **help** — `problemStatement`; **open** vs **resolved** (`resolvedStatus {open|resolved}`); resolved shows the accepted marker (`acceptedCommentId`).

**B. Debate vote interaction states:** no vote → cast affordance (`agree|disagree|abstain`, verified member, type=debate, active, unique (userId, postId), CAP-093) · vote exists → change affordance (atomic decrement-old + increment-new, CAP-094; `userVote?` in `threadContext` powers the branch) · cast rejected (existing vote uniqueness or unverified member, CAP-093).

**C. List interaction states:** add item (content ≤200 chars, CAP-095) · remove own item with `voteCount` recompute (CAP-096) · toggle vote (unique (userId, postListItemId), `voteCount` maintained same-mutation, CAP-097 / INV-4).

**D. Help interaction states:** author accepts (single accepted, **replaces prior**; user-Help → author only, editorial-Help → Editor/Publisher, CAP-098) · author reopens (`resolvedStatus=open`, CAP-099) · **cleared-reference edge (CAP-106):** when the accepted comment is deleted, `postHelps.acceptedCommentId` is cleared and the M4 read **tolerates the cleared ref → Help reverts to open**.

**E. SEO render states (CAP-107):** indexable (public + passed/not_required, SSR) · noindex (held / rejected / private / unlisted).

*(GPT also enumerated missing-extension and archived-post states; register specifies no behavior for either → Open Questions.)*

## 4. Actions → API
1. **Open post detail** — `posts.getDetail` (CAP-090, §9 posts.getDetail).
2. **Render Compare** — `compare.render` (CAP-092, §9 compare.render / R-CMP).
3. **Cast debate vote** — `debate.cast` (CAP-093, §9 debate.cast / R-DBV).
4. **Change debate vote** — `debate.change` (CAP-094, §9 debate.change / R-DBV).
5. **Add list item** — `listItems.add` (CAP-095, §9 listItems.add / R-LST).
6. **Remove own list item** — `listItems.remove` (CAP-096, §9 listItems.remove / R-LST).
7. **Toggle list-item vote** — `listItemVotes.toggle` (CAP-097, §9 listItemVotes.toggle / R-LST / INV-4).
8. **Accept Help answer** — `help.accept` (CAP-098, §9 help.accept / R-HLP).
9. **Reopen Help** — `help.reopen` (CAP-099, §9 help.reopen / R-HLP).
10. *(System)* **SSR render** — CAP-107 (§17 NFR / SEO; no query/mutation name).

## 5. Analytics Events
**None identified within Wave-2 scope.** CAP-090 writes none, and no mechanic mutation (093–099) lists a `rawEvents` write; the visible M16 catalog names no post-detail view/vote event. If these mutations later emit authoritative events they must use same-mutation `rawEvents` capture (CAP-436) + an active catalog entry (CAP-437). A post-detail page-view, if implemented as an observational client event, must satisfy CAP-444's catalog/capture-mode/consent gates and cannot mutate domain state.

## 6. Components Used
- **Reading column (max 720px)** — STYLE-KIT §4.3 (post content).
- **Category pill + Time badge** (🔥Hot / ⏰Recent / 💎Ever) — §11.5.
- **Avatar** (author row) — §11.6.
- **Button Primary / Secondary / Ghost** — debate `agree|disagree|abstain`, list-vote affordances, and the Showcase outbound button (`rel="ugc nofollow noopener noreferrer"`). Icon-only list-vote requires `aria-label` + tooltip (§9.4).
- **Text Input** (list-item entry) · **Radio** (debate choices) — §11.2.
- **Toast / Tooltip** — §11.7.
- **Skeleton** (Text-line / Heading variants) — §11.9. Tallies/counts in `code/sm` (Geist Mono, §3.3).
- **Archetype gaps — flag, not invented:**
  - **No comparison-table / data-grid primitive** for the Compare `qualitativeGrid` + live numeric rows (§11 defines no table component; related to but distinct from admin gap A1).
  - **No three-way single-select (debate) control** — §11 has no segmented three-way choice component.
  - Accepted-Help-answer highlight pattern is undefined (intertwined with the W5 thread).
  - **No named reading-column article component** — §11 has cards/inputs/nav only.

## 7. Open Questions
1. **Intentionally deferred — NOT Wave-2 gaps (per inventory annotations):** CAP-120–139 (comments, reactions, saves, read states, MAX intelligence, realtime "N new") → **Wave 5**; CAP-245 (live affiliate product block) → **Wave 6**. ~~M17 render contracts attach in Wave 7: provenance block (CAP-468), AI-disclosure label (CAP-469), FAQ/HowTo schema from Help accepted answers (CAP-472), SSR link-rel rules (CAP-485), OG immutable keys (CAP-488), post-edit similarity re-run (CAP-475).~~ **RESOLVED (FATAL-M17-01, 2026-08-23):** indexability is now **noindex by default in Wave 2** and flips to indexable only when CAP-468 ships in Wave 7 (same-wave pairing; CAP-107 Notes amended). The other Wave-7 M17 items (AI-disclosure CAP-469, FAQ/HowTo CAP-472, link-rel CAP-485, OG keys CAP-488, post-edit similarity CAP-475) remain deferred to Wave 7 as scheduled.
2. **`posts.getDetail` lookup key** — slug vs. id — is not stated; the route param is `[slug]` and `postSeoMeta.slug` is unique, but the register never names the lookup.
3. **Anonymous interactive access** — CAP-090 (getDetail) and CAP-092 (compare.render) are actor member; only CAP-107 (SSR) is anonymous-facing. Whether an anonymous visitor gets the live Compare computation and full extension render, or only the SSR shell, is unstated.
4. ~~**`postTags` absent from CAP-090 Reads**~~ **RESOLVED (W2-E2, 2026-08-23):** `postTags` added to CAP-090 Reads for tag display; CAP-530 (M4) is the write path set in the composer. Tag rendering on post detail now has a register basis.
5. **Author's view of own non-published post** (draft/held/archived lifecycle) at `/p/[slug]` is unspecified.
6. **W2/W5 sequencing (CAP-106):** the "Help reverts to open" read tolerance ships in Wave 2, but its only writer — M6 comment-delete clearing `acceptedCommentId` (CAP-122) — is Wave 5. Likewise `help.accept` (CAP-098, W2-owned) targets a `comments` row while the comment list is W5, so the accept affordance presumably arrives with the W5 thread. Confirm the W2 ship carries the mutation with no visible target. → surfaced to founder (see RECONCILIATION-2 §2).
7. **`static_creator` list vote behavior** — CAP-095 states only "static_creator → only author edits"; whether `listItemVotes.toggle` is suppressed in that mode is unstated.
8. **News `sourceOfTruthUrl` link rel/safety** — Showcase has an explicit `rel` rule, but no CAP defines outbound-link treatment for a News post's source block.
9. **Compare against an archived tool** — CAP-119 freezes an archived tool's aggregate + shows a banner on the tool profile, but no CAP defines how a Compare post's live numeric row (CAP-092) renders when a referenced tool is archived.
10. **Missing / mismatched extension row** — no behavior specified despite the 1:1 post/extension invariant.
