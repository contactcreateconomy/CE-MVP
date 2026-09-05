# CONTRACT-2-compose-FINAL

**Screen:** Post Composer — `/compose` · `/compose/[type]`
**Wave:** 2 (M4 Post System)
**Template archetype:** Block composer / typed form (+CAP-244 add-products enrichment deferred to W6)
**Primary CAP-IDs:** CAP-086, CAP-088, CAP-100, CAP-105
**Actor:** member
**Reconciliation:** Route/Access, Entities, Actions locked (all three aligned). Analytics was a 2-1 with **Opus in the minority** (CAP-366) → resolved on register evidence, not Opus's vote. Components had an Opus-only add (CAP-012) → demoted on evidence. See RECONCILIATION-2 §1.

---

## 1. Route & Access
- **Paths:** `/compose` (type selection) and `/compose/[type]` (typed form). **Dynamic param:** `[type]` ∈ the 7 active member-composable `post.type` literals — `review · compare · help · spark · debate · list · showcase` (data-model enum). **News is excluded from the member composer** (resolved W2-E1: platform-injected via M2 ingestion, not member-authored). `launch_pad` / `gigs` exist in the enum but ship **locked** until the ~1000-DAU flip (CAP-104 / CAP-186).
- **Actor:** member. **Auth required** (CAP-086 Notes).
- **Submission gate:** CAP-086 `Gated by: M7 posting eligibility (DEC-P17)`. The submit is a protected customer write under `assertCustomerCapability`, capability key `create_post` (CAP-393; precedence per CAP-005 R-CUSTOMER-GUARD). The create path re-checks eligibility via CAP-140 (`eligibility.check`, post path); on incomplete → **preserve draft + return missing basic decisions**.
- **Edit access:** a member may edit **only their own** post via `posts.update` (CAP-088).
- **Type availability:** composer exposes types returned by `postTypeConfig.list` (CAP-105). Locked types are hidden from the composer; new/unknown types default locked (CAP-104).
- **Redirect rules:** auth/bootstrap routing per the **Platform-Wide Routing Convention** (CONTRACT-1-app-shell §1, 2026-08-26) — unauthenticated → `/signin` (rule 1), pending_context → `/welcome` (rule 2). Post-action success destinations remain unspecified (Open Questions).

## 2. Entities
- **CAP-086** (`posts.create`): Reads `postTypeConfig, roleAssignments, users, postReviews, postCompares, tools` · Writes `posts, postReviews (content fields only — verdictScore excluded), postCompares, postSparks, postDebates, postLists, postShowcases, postHelps` — **posts + matching extension row inserted transactionally (1:1)**. (`postNews` and `postLaunchPads`/`postGigs` are absent from Writes — news is platform-injected via M2 ingestion (W2-E1); launch_pad/gigs are locked types.)
- **CAP-088** (`posts.update`): Reads `posts, postTypeConfig` + all extension tables · Writes `posts, (matching extension row), postRevisions (edited marker)`.
- **CAP-100** (`showcase.submitProjectUrl`): Reads `systemConfig (showcase.allowedDomains), postShowcases` · Writes `postShowcases (approvalStatus=pending)`.
- **CAP-105** (`postTypeConfig.list`): Reads `postTypeConfig` · Writes **none**.
- **Adjacent in-composer gates (register places their UI in the composer; cited, not consolidated):**
  - CAP-087 (R-URL): Reads none · Writes none (reject-only).
  - CAP-140 (eligibility, post path): Reads `users, privateUserData, profiles, postingEligibilityEvents, capabilityRestrictions, systemConfig, roleAssignments` · Writes `postingEligibilityEvents`.
  - CAP-152 (rate limit): Reads `users, systemConfig, rawEvents` · Writes "(block; possibly postingEligibilityEvents)".
  - CAP-153 (deterministic pre-publish): Reads `users, posts, postRevisions (near-dup hash), systemConfig` · Writes "(block; posts stays draft)".
  - CAP-102 (repeated obfuscation): Reads `posts` · Writes `posts (moderationStatus=held)`.
- **Canonical 1:1 invariant:** every successful create inserts `posts` **plus exactly** the matching extension row transactionally (CAP-086).
- **Tags:** canonical tag relations use `postTags` join only (no `tagIds[]`). **Tag setting is functional in Wave 2:** CAP-530 (M4) governs member tag set/edit during compose or edit — Reads `postTags` (edit prefill) · Writes `postTags` (create/update join rows), gated by CAP-086. Post-detail display reads them via CAP-090. *(Resolved W2-E2, founder decision 2026-08-23.)*

## 3. States
**A. Type-select (`/compose`)** — active types from `postTypeConfig.list` (CAP-105); locked types excluded (CAP-104). *(No empty-state defined if all types were locked — Open Questions.)*

**B. Seven typed-form states (`/compose/[type]`)** — extension fields per data-model:
1. **review** → `postReviews`: `toolId`, ~~`verdictScore`~~ *(member-authorship resolved W2-E4: members submit review **content only** — verdictSummary/pros/cons + per-dimension ratings per the fixed N/A rule; `verdictScore` itself is computed or editorially assigned, never a direct member write)*, `verdictSummary`, `pros`, `cons`.
2. **compare** → `postCompares`: `toolIds[]` (2–4), `qualitativeGrid` (author-authored: use-case/workflow/limitations). Numeric rows auto-render live from `tools` aggregates, never stored here.
3. **spark** → `postSparks`: `statement` (short).
4. **debate** → `postDebates`: `proposition`.
5. **list** → `postLists`: `mode {community_ranked|static_creator}`, `intro`. (List *items* are not in `posts.create` Writes — Open Questions.)
6. **showcase** → `postShowcases`: `theThing`, `projectUrl?` — the single controlled outbound field.
7. **help** → `postHelps`: `problemStatement`; `resolvedStatus` starts `open`.

*(The news typed-form state is removed — news is platform-injected via M2 ingestion, not member-composable; resolved W2-E1.)*

**C. Edit mode** — member edits own post; R-URL re-run; "edited" marker set via `postRevisions` (CAP-088).

**D. Submission-gate states (each a separate render branch):**
1. **URL-in-body rejection** — `authorType='user'` body matching `https?://`, `www.`, bare `domain.tld`, or obfuscation (dot / `[.]` / `(.)` / spaced-domain), field ≠ `postShowcases.projectUrl` → **422 `POST_URL_NOT_ALLOWED`**, before persistence and before moderation (CAP-087). Editorial/persona platform links exempt.
2. **Repeated obfuscation** → routed to moderation, `moderationStatus=held` (CAP-102).
3. **Eligibility incomplete** → draft preserved, "missing basic decisions" returned (CAP-140).
4. **Rate-limited** — flat per-account N posts/hour, tier-independent, O(1) rolling counter; block (not a distribution gate) (CAP-152).
5. **Deterministic pre-publish rejection** — inline reason, posts stays draft (CAP-153): body-length, no-user-URL, dup + near-dup vs same user's recent, repeated-title, nonsense, mention limits, required fields, velocity, account-state.
6. **Full safety moderation pre-publish** — fail-closed; post `held`/`rejected` (CAP-154, overlapping M13 — adjacent cite).
7. **Showcase URL submitted → pending** — `approvalStatus=pending` (CAP-100).
8. **Showcase URL rejected server-side** — non-HTTPS, embedded creds, IP literal, localhost/private/reserved, unauthorized subdomain (host not exact-host and not `.endsWith("."+domain)`); **no preview fetch (SSRF)**; **fail-closed if allowlist missing** (CAP-100).

*(GPT enumerated ~40 finer sub-states; the substantive set above is what all three converge on. Per-type-field client error keys are not supplied — CAP-086 runs R-TYP/R-GATE without exposing keys → Open Questions.)*

## 4. Actions → API
1. **Query available post types** — `postTypeConfig.list` (CAP-105, §9 postTypeConfig.list). Returns the 7 member-composable actives; `news` is not listed (W2-E1), locked types hidden (CAP-104).
2. **Submit new post** — `posts.create` (CAP-086, §9 posts.create / R-TYP / INV-1 — runs R-TYP, R-URL, R-GATE, INV-2 before transactional persistence).
3. **Edit own post** — `posts.update` (CAP-088, §9 posts.update / DEC-P04 — re-runs R-URL, persists edited marker).
4. **Submit Showcase projectUrl** — `showcase.submitProjectUrl` (CAP-100, §9 showcase.submitProjectUrl).
5. **URL gate (implicit on create/update)** — R-URL reject → 422 `POST_URL_NOT_ALLOWED` (CAP-087).
6. **Save post as draft** — writes `posts.lifecycleStatus=draft` with partial content allowed (CAP-531, M4; resolved W2-E3). No eligibility gate beyond auth (`Gated by: none`); the full CAP-086 gate chain still applies at publish time.
7. **Set/edit tags on the post** — creates/updates `postTags` join rows during compose or edit, prefilled from existing tags on edit (CAP-530, M4; resolved W2-E2; gated by CAP-086). **Select-from-taxonomy control, not free text:** the picker is constrained to the controlled `tags` taxonomy exposed by CAP-534 (admin-editable reference list) — members select from the list; they cannot invent tags.
8. **Add products** — intentionally unavailable in Wave 2; CAP-244 deferred to Wave 6.

## 5. Analytics Events
**None identified within Wave-2 scope.** No `rawEvents` write appears in CAP-086/088/100 Writes lists, and no posting/composer `eventName` appears in the visible M16 catalog rows. Whether post creation is captured at all is an open eventCatalog question: CAP-437 requires catalog registration before any emit, and CAP-436's same-mutation rule would bind capture to `posts.create` if a catalog entry existed.

*Deferred (evidence-resolved, not a Wave-2 event):* **CAP-366 (M14, Wave 7)** — a member's first public post (**after M13 publish**) sets `users.engagedAt` and writes `rawEvents`; a held contribution does **not** set the engage bit. *[Opus alone cited this in Wave 2; register confirms the row is real but M14/Wave-7 and downstream of M13 publish → out of Wave-2 scope. Recorded as the eventual writer so the composer isn't treated as permanently analytics-silent.]*

## 6. Components Used
- **Text Input / Textarea / Select** (states per §11.8) — §11.2. Textarea character counter maps to CAP-095's ≤200-char list-item limit.
- **Radio** — list `mode` selection; **Radio or Slider** for `verdictScore` 1–5 (control unspecified by register; both are §11.2 primitives).
- **Button Primary** (submit — Loading + Disabled) · **Button Ghost** (cancel) — §11.1.
- **Toast** (inline rejection reasons) — §11.7.
- **Skeleton** (Card + Button variants) for type-list load — §11.9.
- **Archetype gaps — flag, not invented:**
  - **A3 Block / rich composer** (inventory §3): §11 has no editor component for per-type blocks or the `qualitativeGrid` editor.
  - **No multi-select primitive** for Compare `toolIds[]` (2–4) — §11.2 Select is single-select.
  - **No tool-search/picker-with-results** component, and **no named query** for composer tool lookup (CAP-086 Reads `tools` but supplies no query name).

## 7. Open Questions
1. ~~**News composer has no path to its required field.**~~ **RESOLVED (W2-E1, 2026-08-23):** `news` removed from the member composer type list — news originates from M2 ingestion only (platform-injected `sourceOfTruthUrl`), not member authorship. A member "submit news tip" capability, if wanted later, is a distinct unspecified capability, not a composer variant.
2. ~~**Tag-setting path absent.**~~ **RESOLVED (W2-E2, 2026-08-23):** CAP-530 (M4) added — member sets/edits `postTags` join rows during compose/edit; post detail (CAP-090) reads them for display. Tags are functional, not open questions.
3. ~~**Member Review verdict semantics.**~~ **RESOLVED (W2-E4, 2026-08-23):** data-model wins — members submit review **content only** (verdictSummary/pros/cons + per-dimension ratings per the fixed N/A rule); `verdictScore` is computed or editorially assigned, never a direct member write (self-serving score-inflation risk; protects M3 qualification signal integrity).
4. ~~**No draft-save capability exists.**~~ **RESOLVED (W2-E3, 2026-08-23):** CAP-531 (draft save) and CAP-532 (My Drafts list) added. Draft-save is a specified action (§4 Action 6); "My Drafts" sidebar entry is grounded via CAP-532. **Open sub-question (explicitly flagged, not silently decided):** whether "My Drafts" needs its own row in `MASTER-SCREEN-INVENTORY-MERGED.md` (a new screen) or is a filtered view within an existing screen — founder/PM call.
5. **Media upload in the composer is ungoverned.** *[Opus alone added a file-upload/dropzone component (CAP-012, inventory gap A4). Evidence: no Wave-2 composer CAP (086/088/100/105) reads/writes `mediaAssets` → demoted from Components to this Open Question.]* Whether the Wave-2 composer supports media, and via which CAP, is unspecified.
6. **`/compose/[type]` param validation** — no CAP defines what renders for an invalid or locked `[type]` (e.g. `/compose/launch_pad`) reached by direct URL; CAP-105 lists actives and CAP-104 locks, but neither governs the direct-param case.
7. **Redirect destinations** — *partially closed 2026-08-26:* unauthenticated → `/signin` per the Platform-Wide Routing Convention (CONTRACT-1-app-shell §1, rule 1). Still open: posting-ineligible members (M7 state, outside the convention's auth/bootstrap scope), successful create, and successful update destinations.
8. **Per-post-type client validation schema / error keys** — CAP-086 runs R-TYP and R-GATE but does not expose them.
9. **Edit-load query** — no named query loads an existing post into the edit form; only `posts.getDetail` exists (belongs to `/p/[slug]`).
10. **List-item seeding at creation** — `postListItems` is not in `posts.create` Writes; author seeding presumably occurs post-publish via `listItems.add` (CAP-095), but the register does not state this.
11. **Showcase base-post ↔ `submitProjectUrl` sequencing** — the relationship between saving the base Showcase post and separately invoking `showcase.submitProjectUrl` is undefined.
