# DECISION — M4: Post System (Build Sheet · BACKEND-LOCKED)

**Status:** BACKEND LOCKED · **Frontend (§10 + visual §11):** DEFERRED → **Frontend round** · **Date:** 2026-07-28
**RACI:** R/A = Opus · Consulted/Informed = GPT/GLM/Sonnet + Founder
**Schema:** fills `Decisions/M0-build-sheet-schema.md`. Canonical names = `Decisions/_data-model.md`. Standing rules R1–R5 apply.
**Pairing:** shares the tool-coupling contract with `Decisions/M5-tool-registry.md`.

---

## 1. Header & Layer Profile
- **id:** M4 · **purpose:** the post engine — 10 structured post types (8 active, 2 locked), each with a unique block, on a shared base; config-driven registry; per-type mechanics. · **owner:** Opus · **status:** backend locked.
- **dependencies (up):** M1 users/roleAssignments/posts base · M5 tools (Review/Compare coupling) · systemConfig. **(down):** M6 Discussion (thread engine plugs into mechanic tables) · M9 Feed · M2 Content Engine (authoring) · M13 Moderation.
- **Layer Profile:** Backend = **Required** · Data = **Required** · Admin-FE (governance/config) = **Required (contracts now; visual DEFERRED)** · Customer-FE = **DEFERRED → Frontend round** · Integration = N-A (no new external calls; content-gen is M2) · Jobs = Supporting · SEO = Required (post detail indexable) · Analytics = Required · Audit = Required.

## 2. Canonical Names & Enums
- Tables: `posts`, `postTypeConfig`, `postNews`, `postReviews`, `postCompares`, `postSparks`, `postDebates`, `postLists`, `postListItems`, `postShowcases`, `postHelps`, `postLaunchPads`, `postGigs`, `debateVotes`, `listItemVotes` (all in Bible).
- `post.type` = `news · review · compare · help · spark · debate · list · showcase · launch_pad · gigs` (8 active + 2 locked).
- Enums (Bible): `post.lifecycleStatus`, `post.moderationStatus`, `post.visibility`, `authorType`, `postTypeConfig.state`, `postList.mode`, `debateVote.choice`, `postHelp.resolvedStatus`, `postShowcase.approvalStatus`.
- Convex functions (this module): `posts.create`, `posts.update`, `posts.softDelete`, `posts.getDetail`, `posts.listByType`, `compare.render`, `debate.cast`, `debate.change`, `listItems.add`, `listItems.remove`, `listItemVotes.toggle`, `help.accept`, `help.reopen`, `postTypeConfig.list`, `postTypeConfig.setState`, `showcase.submitProjectUrl`, `showcase.reviewProjectUrl`.

## 3. Scope & Non-Goals
- **In:** post base + 8 active type extensions + 2 locked skeletons; the code-registry + `postTypeConfig` state toggle; per-type mechanics (debate vote, list item vote, help accept, compare live-render); no-user-URL enforcement; Showcase controlled `projectUrl`.
- **Non-Goals:** comment/thread engine (**M6** — this module only defines the mechanic side-tables + `threadContext` overlay it exposes); tool ratings write path (**M5**); AI authoring pipeline (**M2**); feed ranking (**M9**); reputation (Wave 4). *Reason each: single-owner-per-concern.*
- **No `roast`** type (dropped — no structure whose purpose is negativity; critique lives inside Review/Debate).

## 4. Domain Context
- **Terminology:** *active type* = `postTypeConfig.state=active` (composable + visible); *locked type* = built but `state=locked` (hidden from composer/feed until flipped); *unique block* = per-type extension row + its render/compose contract; *mechanic* = interactive per-type behavior (vote/accept) stored in a side table, not in `comments`.
- **Actors:** primary = member (compose active types, vote, add/vote list items, accept own Help); operator = Editor/Publisher (author editorial/persona posts, accept editorial-Help answers), Moderator (clear abusive accept/vote, hold URL-obfuscated posts), Administrator (toggle `postTypeConfig`, manage Showcase allowlist); automated = M2 content engine (creates editorial/persona posts via same mutations).
- **Invariants (INV):**
  - INV-1 Every `posts` row of an active type has exactly one matching extension row (1:1), created in the same mutation.
  - INV-2 Authorship invariants inherited from Bible (`user`→authorUserId, no personaId; `persona`→personaId + approvingUserId before publish; `editorial`→byline + responsiblePublisherUserId before publish).
  - INV-3 `postDebates` tallies = COUNT of `debateVotes` by choice (excluding persona/editorial authorType); never hand-set.
  - INV-4 `postListItems.voteCount` = COUNT of `listItemVotes` for that item; updated in the same mutation as the vote.
  - INV-5 `postCompares` stores NO numeric scores; numbers are read-time from `tools` aggregate.
  - INV-6 No user-authored URL persists in `posts.body`/`comments.body`; the only user-supplied outbound URL is `postShowcases.projectUrl` (allowlisted + approved).
  - INV-7 A locked type cannot be the `type` of any newly created post (server rejects).
- **Source of truth:** post base = `posts`; per-type payload = its extension table; mechanic counts = their vote tables (tallies are derived projections).

## 5. Dependencies & Cross-Module Contracts
| Provider | Consumer | Data shape | Trigger | Failure behavior | Sync | Launch-blocking |
|---|---|---|---|---|---|---|
| M5 `tools` | M4 Review/Compare | toolId + aggregate (ratingSum/Count, dimensionSums/Counts) | render Review/Compare | if tool missing → block create (Review requires valid toolId); Compare drops missing tool, min 2 remain | sync | yes |
| M4 mechanic tables | M6 threads | `threadContext` overlay (type, mechanic state, acceptedCommentId?) | render post detail thread | if overlay absent → M6 renders plain thread | sync | yes (M6) |
| systemConfig | M4 | `showcase.allowedDomains` (string[]) | Showcase URL validate | if key missing → allowlist empty → all projectUrls rejected (fail-closed) | sync | yes |
| M1 roleAssignments + DEC-P17 gate | M4 posts.create | trust/milestone state | user thread creation | gate not met → reject with milestone message | sync | yes |

## 6. Data Model `[DATA][BE]`
Field types are Convex validators. `?` = optional. All tables carry `_id`, `_creationTime` (Convex) + explicit `createdAt` where listed.

- **postTypeConfig** — `type: v.union(<10 literals>)` (unique), `state: v.union('active','locked')`, `sortOrder: v.number()`, `label: v.string()`, `lockedMessage: v.string()`, `updatedByUserId: v.id('users')`, `updatedAt: v.number()`. Seeded rows: 8 active, `launch_pad`+`gigs` locked. Index: `by_type`, `by_state`.
- **postNews** — `postId: v.id('posts')` (unique), `sourceOfTruthUrl: v.string()` *(platform-injected/allowlisted)*, `keyClaims: v.array(v.string())`, `publishedAt: v.number()`. Index `by_post`.
- **postReviews** — `postId` (unique), `toolId: v.id('tools')`, `verdictScore: v.number()` *(1–5; display-only)*, `verdictSummary: v.string()`, `pros: v.array(v.string())`, `cons: v.array(v.string())`. Index `by_post`, `by_tool`.
- **postCompares** — `postId` (unique), `toolIds: v.array(v.id('tools'))` *(len 2–4)*, `qualitativeGrid: v.array(v.object({ toolId, cells: v.array(v.object({ key, value })) }))`. **No numeric fields.** Index `by_post`.
- **postSparks** — `postId` (unique), `statement: v.string()` *(≤280 chars)*. Index `by_post`.
- **postDebates** — `postId` (unique), `proposition: v.string()`, `agreeCount: v.number()`, `disagreeCount: v.number()`, `abstainCount: v.number()` *(all derived)*. Index `by_post`.
- **postLists** — `postId` (unique), `mode: v.union('community_ranked','static_creator')`, `intro: v.string()`. Index `by_post`.
- **postListItems** — `postListId: v.id('postLists')`, `content: v.string()`, `createdByUserId: v.id('users')`, `voteCount: v.number()` *(derived)*, `sortOrder: v.number()`, `createdAt: v.number()`. Index `by_list`, `by_list_votecount`.
- **postShowcases** — `postId` (unique), `theThing: v.string()`, `projectUrl: v.optional(v.string())`, `approvalStatus: v.union('none','pending','approved','rejected')`. Index `by_post`, `by_approvalStatus`.
- **postHelps** — `postId` (unique), `problemStatement: v.string()`, `resolvedStatus: v.union('open','resolved')`, `acceptedCommentId: v.optional(v.id('comments'))`, `acceptedByUserId: v.optional(v.id('users'))`, `acceptedAt: v.optional(v.number())`. Index `by_post`.
- **postLaunchPads** *(locked skeleton)* — `postId` (unique), `interestConfig: v.object({ mode: v.union('button','multi_choice'), options: v.optional(v.array(v.string())) })`, `resultsVisibility: v.literal('creator_private')`.
- **postGigs** *(locked skeleton)* — `postId` (unique), `workDescription: v.string()`, `engagementType: v.string()`.
- **debateVotes** — `postId`, `userId`, `choice: v.union('agree','disagree','abstain')`, `createdAt`. Unique `(userId, postId)` enforced in mutation. Index `by_user_post`, `by_post`.
- **listItemVotes** — `postListItemId`, `userId`, `createdAt`. Unique `(userId, postListItemId)`. Index `by_user_item`, `by_item`.

*Worked example (Debate):* `posts{type:'debate', authorType:'editorial', title:'Is prompt engineering a real skill?', lifecycleStatus:'published', moderationStatus:'not_required', visibility:'public'}` + `postDebates{proposition:'Prompt engineering is a durable skill', agreeCount:12, disagreeCount:9, abstainCount:2}` + 23 `debateVotes` rows.

## 7. Domain States & Lifecycle
- **Post lifecycle/moderation/visibility:** per Bible (unchanged) — `lifecycleStatus` (draft→…→published→archived), `moderationStatus` (DEC-P02 staged fail-closed), `visibility`.
- **Help resolution:** `open → resolved` (accept) → `open` (reopen). Guard: only post author (user-Help) or Editor/Publisher (editorial-Help); moderator may force-clear.
- **Showcase projectUrl:** `none → pending` (user submits) → `approved | rejected` (operator). Only `approved` renders the outbound button.
- **postTypeConfig.state:** `active ↔ locked` (admin toggle). Flipping `locked→active` makes the type composable + feed-eligible immediately; `active→locked` hides from composer/feed but preserves existing posts (read-only).
- **Precedence:** moderation `held`/`rejected` overrides visibility (a held post is never public regardless of type state).

## 8. Rules, Algorithms & Limits `[BE]`
- **R-URL** (no user URLs): TRIGGER `posts.create`/`posts.update`/`comments.*` (M6) → CONDITION `authorType='user'` AND body matches URL pattern *(https?://, `www.`, bare `domain.tld`, or obfuscation: `dot`/`[.]`/`(.)`/space-in-domain)* AND field ≠ `postShowcases.projectUrl` → ACTION **reject** write (do not strip) → FEEDBACK httpStatus 422, errorCode `POST_URL_NOT_ALLOWED`, userMessage "Links aren't allowed here. Name the tool — we'll link it for you.", uiState inline error on body → RECOVERY user removes link, resubmits → PRECEDENCE runs before persistence + before moderation → EDGE editorial/persona may carry platform links (`postNews.sourceOfTruthUrl`, `postSources`); repeated obfuscation attempts → flag to Moderator (`held`).
- **R-DBV** (debate vote): TRIGGER `debate.cast(postId, choice)` → CONDITION type=`debate` + active + verified member + no existing vote → ACTION insert `debateVotes` + increment matching tally on `postDebates` (same mutation) → FEEDBACK 200, optimistic tally → RECOVERY `debate.change` decrements old + increments new atomically → PRECEDENCE unique (userId,postId) → EDGE persona/editorial-authored votes excluded from tallies.
- **R-LST** (list): community_ranked → any verified member may `listItems.add` + `listItemVotes.toggle`; static_creator → only author edits; `voteCount` maintained with the vote; ordering by voteCount desc then createdAt asc.
- **R-HLP** (help accept): per §7 guard; accepting a new answer replaces the prior (single accepted); sets resolvedStatus=`resolved`.
- **R-CMP** (compare render): `compare.render(postId)` reads `postCompares.toolIds` → for each tool computes `overall = ratingSum/ratingCount`, per-dim `dimensionSums[d]/dimensionCounts[d]` (skip if count 0 → honest "—"); merges with `qualitativeGrid`; enforces `2 ≤ toolIds ≤ 4`.
- **R-TYP** (type gate): create rejects if target `postTypeConfig.state≠active` (errorCode `POST_TYPE_LOCKED`).
- **R-GATE** (posting eligibility): user thread creation obeys DEC-P17 milestone ladder; comment/vote/list-vote available immediately after auto-mod.
- **Limits:** Spark statement ≤280 chars; Compare toolIds 2–4; list item content ≤200 chars; one debate vote + one vote per list item per user (unique). Rate limits (create/vote) = GLOBAL NFR baseline.

## 9. Backend Operations `[BE]`
- `posts.create` **(mutation)** — args `{type, title, body, categoryId?, toolIds?, typePayload}`; auth required; runs R-TYP, R-URL, R-GATE, INV-2; inserts `posts` + the matching extension row transactionally; returns `{postId}`. Rationale: transactional multi-table write.
- `posts.update` **(mutation)** — edits base + extension; R-URL re-run; sets "edited" marker (DEC-P04).
- `posts.softDelete` **(mutation)** — tombstone (DEC-P07); comments preserved.
- `posts.getDetail` **(query)** — returns `{post, extension, threadContext}` where `threadContext = {type, mechanic state, acceptedCommentId?, userVote?}` for M6.
- `posts.listByType` **(query)** — paginated by active type (feed/topic use).
- `compare.render` **(query)** — R-CMP.
- `debate.cast` / `debate.change` **(mutation)** — R-DBV.
- `listItems.add` / `listItems.remove` **(mutation)** · `listItemVotes.toggle` **(mutation)** — R-LST.
- `help.accept` / `help.reopen` **(mutation)** — R-HLP.
- `showcase.submitProjectUrl` **(mutation)** — **server-side pre-write** validation: parse the URL → take the **normalized hostname** → require HTTPS → match allowlist by exact host OR `.endsWith("."+domain)` (no substring); **reject** embedded credentials, IP literals, localhost/private/reserved ranges, unauthorized subdomains; **no server-side preview fetch** (SSRF). On pass → `approvalStatus='pending'`; fail-closed if `showcase.allowedDomains` missing.
- `showcase.reviewProjectUrl` **(mutation, operator)** — approve/reject.
- `postTypeConfig.list` **(query)** · `postTypeConfig.setState` **(mutation, admin)** — toggle active/locked; writes `auditLog`.
- **No new env vars.** No `action` (no external calls in M4).

## 10. Customer Frontend `[FE]` — **DEFERRED → Frontend round**
Pages this module governs (inventory for the FE round; founder leads UX to the Apple-grade standard + design system):
1. Feed card variants (8 active types) · 2. Post detail (1 template, 8 unique-block variants) · 3. Composer (type picker + 8 block editors) · plus per-type interactive states (debate vote widget, help accept/resolved banner, list add+vote, showcase project button). Interaction contracts, UI-state matrix, responsive & a11y = produced in the Frontend round. **State/copy rigor (R1–R5) applies then.**

## 11. Admin & Governance `[ADMIN]`
- **Governance contracts (LOCKED now):**
  - Post-type toggle — role `administrator`; action `postTypeConfig.setState`; confirm required; reversible; audit (`auditLog`); consequence: locking hides type from composer/feed, existing posts read-only.
  - Showcase URL approval — role `moderator`/`operator`; approve/reject `postShowcases.projectUrl`; audit.
  - Debate/List/Help abuse — Moderator may clear an abusive accepted answer or vote (audited).
  - URL-obfuscation hold — repeated attempts route the post to the moderation queue (`held`).
- **Configuration registry:** `showcase.allowedDomains` (string[], default `['github.com','vercel.app','netlify.app','figma.com','behance.net','dribbble.com','notion.site','youtube.com','youtu.be']`, admin-edits, effective immediately, fallback = empty ⇒ reject all). `postTypeConfig` seed states. **New-type default:** a newly registered type's `postTypeConfig` row is created `state='locked'`; the admin console seeds any missing rows (from the code registry) as `locked` — a half-wired type can never auto-go-live.
- **Visual admin layout (queues/tables):** DEFERRED → Frontend round; **registers to M15 Admin console.**

## 12. RBAC (authoritative for M4 actions)
| Action | visitor | member | operator (Editor/Publisher) | moderator | administrator |
|---|---|---|---|---|---|
| compose active user-type post | ✗ | ✓ (DEC-P17 gate) | ✓ | ✓ | ✓ |
| author editorial/persona post | ✗ | ✗ | ✓ | ✗ | ✓ |
| debate vote / list vote | ✗ | ✓ | ✓ | ✓ | ✓ |
| accept Help answer | ✗ | ✓ (own post) | ✓ (editorial) | force-clear | ✓ |
| submit Showcase projectUrl | ✗ | ✓ | ✓ | ✓ | ✓ |
| approve Showcase projectUrl | ✗ | ✗ | ✓ | ✓ | ✓ |
| toggle postTypeConfig | ✗ | ✗ | ✗ | ✗ | ✓ |

## 13. Integrations
N-A — M4 makes no external calls. (Content generation = M2 `action`s; tool data = M5.)

## 14. Analytics, Audit & Observability
- Events (source server unless noted): `post_created{type,authorType}`, `post_published`, `debate_vote_cast{choice}`, `list_item_added`, `list_item_voted`, `help_answer_accepted`, `showcase_url_submitted`, `post_url_rejected` *(abuse signal)*, `post_type_toggled{type,state}`.
- Audit: `postTypeConfig.setState`, Showcase approve/reject, moderator force-clear → `auditLog`.
- Monitoring: URL-rejection rate + obfuscation flags (spam signal); locked-type create attempts.

## 15. Content & Copy Contract
- Provisional (finalize in FE round): empty/zero states per type ("No votes yet — be the first"), Help "Accepted answer" badge, locked-type composer message (from `postTypeConfig.lockedMessage`).
- **R4 (no-invent):** the no-URL rejection message + AI-disclosure/byline copy are **fixed** here / inherited from DEC-A01 — coding agent must not reword.

## 16. Edge Cases & Failure Recovery
- Extension write fails after base insert → whole mutation rolls back (single transaction) — no orphan post.
- Compare tool deleted post-publish → render drops it; if <2 remain, show "Comparison unavailable" honest state.
- Debate vote race (double submit) → unique (userId,postId) rejects the second; UI reconciles to server tally.
- Type locked while a draft of that type exists → draft cannot publish (R-TYP at publish), author sees locked message.
- Accepted Help answer deleted (via M6): **M6's comment-delete clears `postHelps.acceptedCommentId`** (cross-module contract); M4 read tolerates a cleared ref → Help reverts to `open` (no stale "Accepted" badge).

## 17. NFR / Security / Privacy / SEO
- Security: R-URL is a server boundary (defense against affiliate-spam injection / SSRF via links); Showcase `projectUrl` validated **server-side** by normalized-hostname parse (HTTPS-only; reject creds/IP/localhost/private/reserved/unauthorized-subdomain; no preview fetch); allowlist fail-closed; all mutations authz-checked (`ctx.auth`). **Forward constraint:** if post bodies ever render markdown/HTML, the R-URL sanitizer must run AFTER HTML-entity decode + Unicode normalization (moot for v1 plain text).
- SEO: post detail SSR + indexable when `visibility=public` & `moderationStatus∈{not_required,passed}`; held/rejected/private = `noindex` (GLOBAL baseline).
- Privacy: Launch Pad results `creator_private` (no cross-user exposure) — locked type, enforced when unlocked.

## 18. Fixtures, Tests & Acceptance Criteria
- Fixtures: 1 published post per active type (+ extension row); a Debate with mixed votes; a community_ranked List with items+votes; a Help with accepted answer; a Showcase with approved + pending URLs; `postTypeConfig` with launch_pad/gigs locked.
- Tests (happy/boundary/unauthorized/failure): create each active type; reject locked-type create; reject user URL in body (+ obfuscation); Showcase allowlist pass/fail; debate vote uniqueness + change; list vote uniqueness; help accept/reopen guard; compare render with a missing tool; admin toggle flips composability.
- **AC (Given-When-Then, testable):**
  - G published Debate + 12 agree/9 disagree/2 abstain · W `posts.getDetail` · T `threadContext` returns those tallies and the caller's own vote.
  - G a member · W they `posts.create` a body containing "visit example dot com" · T write rejected `POST_URL_NOT_ALLOWED`, nothing persisted.
  - G `launch_pad` state=locked · W any create with type=launch_pad · T rejected `POST_TYPE_LOCKED`.
  - G admin flips `launch_pad`→active · W a member opens the composer · T launch_pad is now selectable (no deploy).

## 19. Release, Migration & Rollback
- Feature flags (DEC-L06): `userPosting`, per-type via `postTypeConfig`. Initial: 8 active, launch_pad/gigs locked.
- Migration: enum change (roast/guide/discussion/launch → new set) — no production data yet (pre-launch); seed `postTypeConfig` (8 active, launch_pad/gigs locked); **new/unknown types default `locked` until an admin activates.**
- Rollback: Vercel + Convex; toggling a type off is instant and non-destructive.

## 20. Global Projections & Open Decisions
- **Projects to:** global data model (extension + mechanic tables), RBAC matrix (§12), Admin console (M15: type-toggle, Showcase-approval, URL-hold queues), analytics plan (§14), audit (`auditLog`).
- **Open (DEC):** `DEC-M4-URL` supersedes DEC-P03 (no user URLs; recorded in `_index`). `DEC-M4-CATFIX` (open): the v2.0 design system labels post-*types* as "categories" and paywalls Launch Pad/Debate — reconcile in the Frontend round (categories≠post.type; Debate is active; Launch Pad/Gigs are DAU-locked, not point-paywalled; add Spark; drop roast). **M6 contract (confluence):** M6 comment-delete MUST clear `postHelps.acceptedCommentId`; new/unknown post types default `locked`.
