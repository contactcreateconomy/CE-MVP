# Post Composer

**Status (2026-09-18 screen audit correction):** LIVE at `/new-post`. **Fixed (this pass):** the composer now collects the full typed-field set per post type (toolId, score, pros/cons, qualitativeGrid, etc.) via a new `typed-fields-panel.tsx` — the prior composer never captured these, so `posts.create` always inserted extension rows with `undefined`/empty typed fields. Showcase posts now get `approvalStatus` set and full CAP-100 project-URL allowlist validation on **create** (previously only enforced on update, so create could bypass it).

**Route:** `/new-post` (canonical — adopted 2026-09-04 per `PRD/00-project-status/00-ROUTES.md`, which supersedes this field's spec names; contracts' `/compose` · `/compose/[type]` are historical aliases)
**Status:** LIVE at `/new-post` — `PRD/app/apps/forum/src/app/(compose)/new-post/page.tsx` (plus `new-post-page-client.tsx`). The live flow is the pre-Transition reference composer (writes legacy `forumPosts`); the canonical backend (`convex/posts.ts`, SLICE-P4-02) is built and the typed-forms composer rebuild on it is pending. Tag picker (SLICE-P4-03) embeds when that rebuild lands.
**Route drift:** ~~DECISION NEEDED~~ RESOLVED 2026-09-04 — `00-project-status/00-ROUTES.md` row `/compose` · `/compose/[type]` → `/new-post` (keep live name; spec side updates).
**Contract:** PRD/02-contracts/wave-2/CONTRACT-2-compose-FINAL.md
**Slice(s):** SLICE-P4-02 (posts.create / posts.update + R-URL + draft save + composer UI: type-select + 7 typed forms), SLICE-P4-03 (tag taxonomy exposure + member tag set/edit picker embedded in compose/edit)

## Layout

Layout not specified in contract — agent must infer from the inventory's Template archetype in STYLE-KIT §12.

(The contract's §6 lists only form controls — inputs, radio, buttons, toast, skeleton — with no arrangement, widths, or regions; the inventory's archetype note is "Block composer / typed form *(+CAP-244 add-products in W6)*".)

## Components required

- Text Input (§11.2; states per §11.8) → `PRD/app/apps/forum/src/components/ui/input.tsx`
  - ⚠️ input has zero production usage — expect possible integration friction, report don't silently patch.
- Textarea (§11.2; character counter maps to CAP-095's ≤200-char list-item limit) → MISSING: Textarea does not exist in the library — `ui/input.tsx` is the only text-entry primitive.
- Select (§11.2) → `PRD/app/apps/forum/src/components/ui/select.tsx`
  - ⚠️ select has zero production usage — expect possible integration friction, report don't silently patch.
- Radio (§11.2 — list `mode` selection; also "Radio or Slider" for 1–5 score control, control unspecified by register) → MISSING: Radio does not exist in the library, and no Slider exists either — no 1–5 single-choice primitive (checkbox/select/toggle-switch are the nearest, none equivalent).
- Button Primary (submit — Loading + Disabled) · Button Ghost (cancel) (§11.1) → `PRD/app/apps/forum/src/components/ui/button.tsx`
- Toast (inline rejection reasons, §11.7) → `PRD/app/apps/forum/src/components/ui/toast.tsx`
- Skeleton (Card + Button variants, type-list load, §11.9) → `PRD/app/apps/forum/src/components/ui/skeleton.tsx`
  - ⚠️ skeleton has zero production usage — expect possible integration friction, report don't silently patch.
- Tag picker (CAP-530/534 — select-from-taxonomy, not free text; SLICE-P4-03) → `PRD/app/apps/forum/src/components/ui/select.tsx` or `PRD/app/apps/forum/src/components/ui/combobox.tsx` (both zero-production, see warnings; contract/STYLE-KIT names no tag-picker component)
  - ⚠️ combobox has zero production usage — expect possible integration friction, report don't silently patch.
- MISSING: Block / rich composer (inventory archetype gap A3) does not exist in the library — no editor component for per-type blocks or the `qualitativeGrid` editor.
- MISSING: Multi-select primitive for Compare `toolIds[]` (2–4) does not exist in the library — §11.2 Select is single-select, combobox is single-select.
- MISSING: Tool-search / picker-with-results component does not exist in the library (and no named query for composer tool lookup exists — CAP-086 Reads `tools` but supplies no query name).

## States required

(Copied verbatim from CONTRACT-2-compose-FINAL.md §3)

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

## Component library maturity note

- ⚠️ input has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ select has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ combobox has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ skeleton has zero production usage — expect possible integration friction, report don't silently patch.
- button, toast are production-proven — no warning.
