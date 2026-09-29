---
id: CURRENT-STATE
type: GROUND-TRUTH
author-model: Opus
tool: Claude Code (cloud)
round: 1
status: LIVE (R2 2026-09-29: founder decisions applied)
date: 2026-09-29
---

# CURRENT-STATE — what Createconomy actually is today (ground truth for every spec)

**Read this before writing any spec.** It judges the shipped member app against `01-vision/CEY-VISION.md`.
Evidence: `00-control/history/RAW-INVENTORY.md` (facts), `history/SETUP-REPORT-R3.md` (seed + crons),
the 390px baselines in `00-control/baselines/` (seeded local backend, 2026-09-28), and targeted code reads
(file:line cited). A successor should **not** re-derive this from the codebase — only re-check a line when a
spec depends on it.

Legend — **Trust** = first-glance effect on "this is solid, I'll build here". **Valued** = where the creator
feels appreciated. **Thumb** = core action reachable one-handed at 390. States = loading / empty / error.

---

## 0. The verdict in five lines

1. **The engine is real; the skin betrays it.** Data, auth, feed ranking, typed posts, the review verdict and
   a 21-comment thread all work. What a visitor *sees* is a spec document: internal IDs, raw enum keys,
   "honest empty", "Phase 7", "Connect Convex".
2. **Nobody is a person yet.** No avatars (hardcoded null), notifications say "Someone", the public profile
   has no posts and no awards. The vision's one emotional job — make the creator feel valued — has **zero**
   surfaces today.
3. **It's a website, not an app.** No manifest, icons, theme-color, viewport export or service worker;
   the tab bar's centre "Create" label is invisible; four loading patterns; eight core routes have no error state.
4. **Two surfaces fabricate data** — `/category/[slug]` (static fake author, fake badges) and the
   leaderboard's per-category multipliers. For a trust product these are P0.
5. **No rewrite needed.** Stack (Next 16 / React 19 / Tailwind v4 / Radix / motion / TipTap / Convex) is
   right. The redesign is: one foundation (S00) + rebuild ~8 screens on it + 8 small backend CRs.

---

## 1. Shared foundation

| Area | Today | Judgment → where it's fixed |
|---|---|---|
| **Tokens** | `apps/forum/src/app/globals.css` and `apps/admin/src/app/globals.css`: 1,073 lines each, 394 vars, **identical except one line** (L522 `@apply min-h-screen` forum vs `min-h-0` admin). | Pure copy-paste. **Ruling: single shared source** — move to a `packages/` stylesheet both apps `@import`; the one-line difference becomes an app-local override. S00. |
| **Theme** | Dark default (`layout.tsx:43 defaultTheme="dark" enableSystem`), neutral-grey surfaces, sky-500 brand, dotted background texture. | Coherent and credible — keep dark-first. The dotted texture is decoration (vision rule 2): S00 decides keep/remove. |
| **Typography** | Geist Sans/Mono via next/font/local. Titles bold, body readable at 390. | Good base. Scale is fine; hierarchy is not (every card title same weight as H1s on some pages). S00 type roles. |
| **Layout shell** | Mobile: floating rounded top bar (logo, +, theme toggle, bell, avatar initial) + bottom tab bar (Home, Search, Create, Alerts, Profile). Desktop: 3-column (left sidebar, feed, right widgets) under a full-width hero. | Mobile shell structure is right (matches STYLE-KIT §12.2). Top bar carries a **theme toggle** (not a primary action on iOS — move to Settings) and a **"+" that duplicates Create**. Desktop left sidebar is near-empty. |
| **Navigation** | Tab bar exists (`layout/mobile-tab-bar.tsx`). "Profile" tab → `/profile` → **redirects to `/settings/profile`**. Centre Create = blue circle, **label "Create" rendered blue-on-dark-grey, near invisible**. | Profile tab takes the creator to a form, not their work — kills "feel special". Rule for S00: Profile tab → own public profile (`/users/[me]`), Settings reachable from there. Needs a DECISION (00-ROUTES note). |
| **States** | Loading: 5× inline spinner, 3× `return null` blank, 2× "Loading…" text, 1× `Suspense fallback={null}`, 1× Skeleton (only /notifications). Error UI: only /landing, /signin, /setup. 4 routes show a dev-facing "Connect Convex…" card. | **State kit in S00**: one Skeleton family, one Empty, one Error (with retry), one "offline/not-configured" that never says "Convex". |
| **Motion** | `motion` 12 installed; used mostly in the hero carousel (21 refs). Route "emerge" transitions, glow pulse, 2.5s search-focus spinner ring. | No motion serves a user moment (publish, comment, recognition have none). S00 motion principles: fewer, purposeful, `prefers-reduced-motion` honoured. |
| **App-feel** | **MISSING:** web manifest, icons/apple-touch-icon (`apps/forum/public/` doesn't exist; only `app/favicon.ico`), `export const viewport`, theme-color, standalone mode, service worker. Safe-area used twice. No sheet/drawer primitive (Radix Dialog only). | Whole row is S00. Without it, "Add to Home Screen" gives a generic icon and a browser frame — the first "website-feel" tell. |
| **Brand in UI** | "Createconomy" wordmark + logomark everywhere. No "CEY" in UI. | Correct per D-008. |
| **Dates** | Feed cards `toLocaleDateString()` → `28/9/2026` (`canonical-feed-client.tsx:194`); notifications relative ("48m ago"); discussion "28 Sept 2026". | One relative-time rule in S00 copy rules. |
| **Overlays** | CMP consent overlay + newsletter overlay exist (hidden in baselines by init script). | Unjudged visually; S00 must check they don't stack on first visit. |

---

## 2. The 16 core routes (deep, 390px)

Order = the member journey. "out" = logged-out, "in" = logged-in (devtest, staff roles).

### 2.1 `/landing` — first visit
- **Sees (out = in):** logomark, "Createconomy", one-line pitch ("A discussion and resource platform for creators and small businesses building with AI"), a **"PUBLIC BETA"** pill, primary "Explore free resources →", then *another* "Explore free resources" link, "Browse discussions", a "What makes us different" box ("AI-assisted editorial pipeline — every claim is sourced", "legitimacy-weighted ranking"), footer legal links.
- **Trust:** medium-low. Clean and calm, but reads like a spec summary; duplicate CTA; "Public beta" contradicts the "sign-ups closed" message one tap later. Logged-in users see the identical page with **no path to their feed** (SETUP-R3 obs. 3).
- **Valued:** nowhere — creators are "users" of a pipeline, not the heroes.
- **Thumb:** CTA sits mid-screen; OK.
- **States:** no loading (fail-closed default `"closed"`); error `role=alert`. 
- **Top issues:** duplicate CTA; spec-voice copy ("legitimacy-weighted", "editorial pipeline"); no social proof (real creators, real posts); logged-in dead end.

### 2.2 `/signin` — auth gate
- **Sees (out):** logo, card "Sign in to Createconomy", grey notice **"New sign-ups are currently closed. Check back later."**, button "Already a member? Sign in". (in): redirects into the app (baseline shows feed).
- **Why "closed":** `convex/admission.ts` `effectiveSignupMode` is fail-closed — no `launchReadinessResults` row (or not `ready`) ⇒ `"closed"` regardless of `signup.mode`. So it's a **readiness/config default**, not a UI bug. The same notice heads every auth-gated page for logged-out visitors (new-post, notifications, drafts, profile, settings).
- **Trust:** low — the first thing a visitor is told is "closed". → **D-009 decided 2026-09-29: open sign-up, "closed" never the front door.**
- **Top issues:** gate copy and placement; no waitlist capture on this surface when closed (the `/waitlist` route exists separately); auth modal is the shared `packages/auth-ui` (reference impl — extend, don't fork).

### 2.3 `/welcome` — retired
307 → `/feed` (founder override 2026-09-18). Nothing to design; keep redirect.

### 2.4 `/setup` — onboarding
- **Sees (in):** "Set up your profile" card: display name (pre-filled), interest chips (post types *and* topics mixed in one cloud), consent checkboxes ("Behavioral inference", "Demographics personalization"), "I accept the community rules (version rules.v1)", optional SMS step, "Complete setup" (disabled until valid). Title wraps awkwardly in a 2-column header at 390.
- **Trust:** medium. Honest, but legal/consent vocabulary dominates the first moment of belonging.
- **Valued:** none — the moment someone joins is a form. This is a vision "key moment" candidate (welcome).
- **States:** inline spinner; error `<p>`; "No interest tiles available yet."
- **Top issues:** `rules.v1` leak; consent language; no avatar step (blocked by CR-003); header layout.

### 2.5 `/feed` — home
- **Sees (in/out nearly identical at 390):** 3 hero cards stacked ("Community Top · `community_top`", "Featured · `editorial`" ×2 — **raw slot keys shown next to the pill**), then Top / Hot / New / Fav segmented control (Hot = filled pill with glow), then post cards: type chip (`review`, `list`…), author name (no avatar), absolute date, "1 discussing", bold title, 2-line excerpt, `▲ 4 💬 0 🔖 1` and — logged-in — **`Why this? Hide Mute Report` as text on every card**.
- **Live card:** `FeedCard` inside `components/feed/canonical-feed-client.tsx` (graph: `CanonicalFeedClient` → `FeedCard()` L125). `feed/post-card.tsx` is dead.
- **Long-title clamp:** **broken** — the fixture renders 5 lines; `FeedCard`'s title `<a>` (L199) has no `line-clamp`. SETUP-R3 §5 said "renders" → builder self-acceptance ≠ acceptance.
- **Trust:** medium. Content voice is credible; chrome is noisy (per-card moderation text, raw keys, absolute dates).
- **Valued:** weak — author is a grey name, no face, no reputation cue, no "your post got N valuables".
- **Thumb:** scroll + tap card fine; sort control is at the top of a long hero stack.
- **States:** `Suspense fallback={null}` (blank) → inline spinner; empty "The feed is forming…"; **no error state**.
- **Desktop 1440:** hero carousel (779 LOC) takes the whole first fold with an **empty grey image** and repeats the same 3 items shown as cards below it; left sidebar = one "+ Start Discussion" pill; "What's Vibing" widget.
- **Top issues:** clamp; per-card actions → overflow menu; raw slot keys; hero duplication; dates; no avatars; no error state.

### 2.6 `/discussions/[slug]` — read (reference implementation)
- **Sees:** type chip + date, large title, body, **Verdict** block ("Reviewing: Claude Code ↗", score **4**, per-dimension ratings, pros/cons) with the leak *"display-only, never feeds the community aggregate (`toolRatings` is the sole aggregate feed)"*; "Discussion (21 members' 21 comments)"; sort chips Best/Live/New/Top/Most discussed/Q&A; the leak *"Thread intelligence (themes · positions · Q&A map) renders when the MAX pass ships (Phase 7)."*; reply box "Add to the discussion (no URLs)" + "No label" select + Comment; comment cards with **six text buttons** (Valuable (6), Save, Flag, Needs context, Report, Replies (20)); footer links How we review / Editorial policy / AI disclosure.
- **Trust:** high on content (the Verdict block is a genuine differentiator — Reddit/X have nothing like it), dented by leaks and button clutter.
- **Valued:** "Valuable (6)" is the only appreciation signal; the author block is thin (no face, no level).
- **Thumb:** reply box is inline mid-page, not a bottom composer; six buttons per comment are small targets.
- **States:** loader `return null` (blank) while loading; "Discussion not found"; dev guard "Connect Convex…"; no error UI. Replies collapsed behind "Replies (20)" — the thread is one card deep at first glance.
- **Top issues:** leaks; comment action row → 2 visible + overflow; bottom-anchored reply; thread shows depth; author identity.

### 2.7 `/new-post` — post (composer)
- **Sees (in):** focused layout (no tab bar): logomark, ✕, "Publish". Category grid (Review, Compare, Spark, Debate, List, Showcase — 6 of the 8 types), big "Title"/"Optional subtitle", image dropzone ("Drop an image or browse · Max 1200px wide", "Or paste a URL"), then the typed panel (Review verdict: tool select + 1–5 radio rows per dimension). A floating bottom bar (save icon + send) overlaps content mid-form. (out): "sign-ups closed" gate.
- **Code:** `new-post/new-post-composer.tsx` 774 LOC + `typed-fields-panel.tsx` 375 + `composer-product-block.tsx`; TipTap is present but the body is a hand-rolled area; drafts are **localStorage only**. Error toasts leak `POST_URL_NOT_ALLOWED: … (CAP-087)`.
- **Trust:** medium — capable, but it's a form, not a writing tool.
- **Valued:** **none at publish** — no celebration, no "your post is live, here's who'll see it". The vision's #1 key moment is unaddressed.
- **Thumb:** Publish is top-right (hard reach); the bottom bar has send — two publish affordances.
- **Top issues → Ruling:** **rebuild the experience on TipTap** (S-composer). Keep the typed-field *data contract* (`typed-fields-panel` dimension keys, list modes) — they are backend-authoritative; replace the UI. Type picker becomes step 1 sheet; body is TipTap; typed fields slot in as blocks; one publish action, bottom-reachable; post-publish moment designed.

### 2.8 `/users/[handle]` — someone's profile
- **Sees:** avatar circle with initial "M", "Maya Chen", "@maya", bio; tabs Overview / Metrics; "PROFILE COMPLETION" pills **`email_verified ✓` `basic_profile_complete ✓`** (raw keys); "AWARDS — *Awards shelf arrives with the Wave-7 reputation enrichment (CAP-297) — honest empty for now.*"
- **Backend truth** (`convex/profile/page.ts`): `avatarUrl: null` hardcoded (L98, L166); `awardsShelf: []` hardcoded even though 26 badges are seeded in `badges`; `metrics: null`; **no posts in the projection at all**.
- **Trust:** low — a profile with no work and a note from the spec.
- **Valued:** zero. This should be the creator's home and trophy shelf.
- **States:** `return null` blank while loading; "User not found / No profile matches @{handle}".
- **Top issues:** body of work (CR-008), awards (CR-008), avatar (CR-003), raw keys, leak.

### 2.9 `/profile` — retired → `/settings/profile`
Redirect. **Problem:** the Profile tab lands here (see §1 Navigation). Proposed: Profile tab → own `/users/[handle]`; keep `/profile` as a redirect to that. Needs DECISION (route semantics change).

### 2.10 `/notifications` — recognition moment
- **Sees (in):** "Notifications" card; rows: **"post comment / Someone / 48m ago / Mark read"**, "comment reply", "saved post activity", "signal level changed", "help resolution", "moderation resolved". Unread rows tinted. Header bell badge "3" works.
- **Code truth:** DB rows carry `actorUserIds` (schema L384) but `convex/notifications/reads.ts` list returns only `actorCount`, `notificationType`, `objectId`, `postSlug` — no actor identity, no post title, no snippet. UI prints `"Someone"` and `notificationType.replace(/_/g," ")` (`notifications-page-client.tsx:124,129`).
- **Trust:** low — reads like a log file.
- **Valued:** this is **the** recognition surface in the vision and it is dead.
- **States:** the only Skeleton user; "No notifications yet"; logged-out sign-in card; no error state.
- **Top issues:** CR-004 (actor + object context); human copy per type; rows tappable to the object; grouping.

### 2.11 `/search`
- **Sees:** "Search", subtitle *"Keyword match across posts, tools, and members — no personalization, same results for everyone."*, input + dimmed "Search" button. Empty below. `!configured → null`.
- **Trust:** neutral. The subtitle is a policy statement, not help. No recent/trending, no suggestions.
- **Thumb:** input is at the top (fine with keyboard). Tab bar "Search" tab duplicates top-bar search on desktop.
- **Top issues:** empty-state design; results grouping; submit button unnecessary on mobile.

### 2.12 `/discover`
- **Sees:** "Discover" list of post types with one-line descriptions: Review, Compare, Help, Spark, Debate, List, Showcase, News *(editorial)* — "Platform-injected industry news", Gigs. Rows link to `/category/[slug]`.
- **Trust:** neutral; it's a table of contents. No counts, no activity, no people.
- **States:** `return null` blank while loading; "No categories loaded. Refresh…".
- **Top issues:** it's a menu, not discovery; copy ("Platform-injected") is internal voice.

### 2.13 `/category/[slug]` — **P0 trust**
- **Sees:** a sticky title bar; a card "How I Grew from 0 to 10K Followers in 90 Days Using Only Short-Form Video Funnels" by **"Maya Chen @mayabuilds" with badges "Verified" "Verified" "Top Seller" "Lv 12", "LA, PS", "Social School · Apr 10, 2026 · Updated Apr 24, 2026"**, a "Join" button, then a very long article (page is 14,529 px tall). Author block columns are crushed at 390.
- **Code truth:** `category-preview-loader.tsx` renders a **static seed — zero Convex, zero DB** (RAW-INVENTORY §E). The same fake post appears for every category slug. The "Maya Chen" here is not the seeded @maya.
- **Trust:** **destructive.** Fabricated identity + fake verification badges on a platform whose pitch is "every claim is sourced".
- **Fix without backend:** `feed.list` already accepts `typeFilter` (`convex/feed.ts:130`) → the category page can be a filtered feed. S-level spec, no CR.

### 2.14 `/leaderboard`
- **Sees:** "Leaderboard — The Podium, expanded — 5 categories × 3 windows", tabs Overall / Best Commenter / Best Helper / Best Reviewer / Rising, windows 24H/7D/1M, card **"Podium is forming — Overall · 1M needs 25 eligible contributors to activate — 5 so far."**, footnote *"… computed by the reputation engine (M12) — interim values shown until it ships."*
- **Code truth:** podium derived client-side from `feed.getChrome`; `MIN_CONTRIBUTORS = 25`; per-category scores are **fabricated** — multipliers picked from `userId.charCodeAt(last) % 5` (`leaderboard-page-client.tsx`). Hidden today only because the floor isn't met.
- **Trust:** low (empty + leak); **latent P0** (fabricated rankings the moment 25 members exist).
- **Ruling:** remove the fake per-category derivation (UI, no CR); CR-006 for a real projection or a lower/beta floor.

### 2.15 `/drafts`
- **Sees:** "My Drafts", "No drafts yet. Drafts are saved automatically when you compose a new post.", "Write a post" (plain text button).
- **Code truth:** localStorage only (CAP-531 server drafts pending) → drafts are per-device; a founder on two PCs will "lose" drafts.
- **States:** spinner while `!mounted`; silent try/catch.
- **Top issues:** CR-005; CTA styling; lives as a route but is really a composer sheet section.

### 2.16 `/settings` → `/settings/profile`
- **Sees (in):** banner **"Rules updated (version rules.v1) … Re-accept (rules.v1)"**; "Optional profile fields": Role archetype, "Age band (banded, optional)", "Bio (≤500 chars)", each with its own **Save** button; *"'Prefer not to say' counts as a completed decision, equal credit"*; linked handles (x + @handle + Add) *"We store the handle only — no OAuth or profile fetch in v1."*; Consent *"Complete /setup to record consent preferences … (derivation-trail invalidation)"*; Privacy (Profile visibility "Public — make private", Leaderboard opt-out); **"Erase data (destructive)"** with rows **`roleArchetype` `ageBand` `toolsUsed` `bio`** (camelCase field names) each with a red Erase button.
- **Missing:** display name, avatar, theme (lives in top bar), notification preferences, sign-out placement.
- **Trust:** low — it looks like a database admin form. Rules banner shows even after setup (same `rules.v1`).
- **Top issues:** per-field Save → one form; field names → labels; group into iOS-style sections; leaks.

### 2.17 Core-route scorecard

| Route | Trust | Valued | Thumb | Loading | Empty | Error | Worst issue |
|---|---|---|---|---|---|---|---|
| /landing | ◐ | ✗ | ✓ | n/a | n/a | ✓ | spec-voice + dup CTA + logged-in dead end |
| /signin | ✗ | ✗ | ✓ | text | n/a | ✓ | "sign-ups closed" first (D-009) |
| /welcome | — | — | — | — | — | — | redirect (fine) |
| /setup | ◐ | ✗ | ✓ | spinner | ✓ | ✓ | consent/legal voice at the belonging moment |
| /feed | ◐ | ◐ | ✓ | blank→spinner | ✓ | ✗ | clamp, per-card mod text, raw keys |
| /discussions/[slug] | ◐ | ◐ | ◐ | blank | ✓ | ✗ | leaks + 6-button comment rows |
| /new-post | ◐ | ✗ | ◐ | text | — | toast leak | form not a writing tool; no publish moment |
| /users/[handle] | ✗ | ✗ | ✓ | blank | ✓ | ✗ | no work, no awards, leak |
| /profile | — | — | — | — | — | — | Profile tab lands in settings |
| /notifications | ✗ | ✗ | ✓ | skeleton | ✓ | ✗ | "Someone" + enum labels |
| /search | ◐ | — | ✓ | spinner | per-group | ✗ | empty page, policy copy |
| /discover | ◐ | ✗ | ✓ | blank | ✓ | ✗ | menu, not discovery |
| /category/[slug] | ✗✗ | ✗ | ✓ | n/a | n/a | 404 | **fabricated static content** |
| /leaderboard | ✗ | ✗ | ✓ | — | ✓ | ✗ | empty + fake derivation |
| /drafts | ◐ | — | ✓ | spinner | ✓ | silent | device-local drafts |
| /settings | ✗ | ✗ | ◐ | — | — | ✗ | DB-admin form, raw field names |

✓ fine · ◐ partial · ✗ fails · ✗✗ actively harmful.

---

## 3. Other forum routes (shallow)

| Route | One line |
|---|---|
| `/` | Redirects to `/feed`. Keep. |
| `/waitlist` | Waitlist form (123 LOC). D-009 = open sign-up, so it is an ops fallback only; not linked from the front door. |
| `/kit` | Internal component showcase (268 LOC) with `§11.14 … CAP-175` headings. **Must not be reachable in prod** — hide behind staff/dev flag (S00). |
| `/content`, `/content/spark` | Thin content wrappers. Out of first-wave scope. |
| `/contribute` | Rights-basis upload flow ("Acknowledge contract"). Later spec. |
| `/go/[linkId]` | Affiliate interstitial (founder/legal-owned copy). MVP-1 affiliate suite — own spec after beta line. |
| `/personas`, `/personas/[id]` | AI persona directory. Later spec; labels must stay (AI disclosure). |
| `/resources`, `/resources/[slug]/view` | Free resource library ("Explore free resources" CTA target). Needs a spec — it's landing's primary CTA. |
| `/s/[handle]`, `/s/[handle]/[product]` | Creator storefront (affiliate). MVP-1 affiliate suite spec. |
| `/tools`, `/tools/[slug]` | Tool registry + rating form (9 raw dimension keys). Linked from the Verdict block — spec with reviews. |
| `/sell`, `/sell/apply` + dashboard | Seller dashboard; heavy CAP leaks ("CAP-233 gate", "CAP-270"). Affiliate spec. |
| `/about`, `/ai-disclosure`, `/editorial-policy`, `/help`, `/how-we-review`, `/how-we-use-your-store-data` | Static pages via `LegalDocPage` pattern. One prose template in S00. |
| `/privacy`, `/terms`, `/dmca`, `/repeat-infringer` | Legal docs; `unavailable_pending_legal` until seeded (by design). Copy legal-owned. |
| `/legal/intake`, `/appeal/[actionId]` | Real forms (259 / 138 LOC). Restyle only, later. |
| `/settings/profile` | = §2.16. |

## 4. Admin (`apps/admin`, deferred until member screens ship)

All restyle-only via the shared token source from S00; no redesign specs before the beta line.

| Route | Row |
|---|---|
| /admin, /admin/home | Staff landing + alert home. |
| /admin/editorial, /admin/curation, /admin/sources | Content pipeline (review with evidence, curation, source registry). |
| /admin/moderation, /admin/support, /admin/audit | Trust & safety queue, support, audit log. |
| /admin/personas, /personas/genome, /personas/queue | AI persona management. |
| /admin/readiness | Launch readiness — **controls the "sign-ups closed" state** (D-009). |
| /admin/config, /admin/roles, /admin/rulebook | System config, roles, rules versions. |
| /admin/analytics, /admin/reliability | Metrics (A2 charts unspecified), job health. |
| /admin/store, /admin/affiliate-inventory, /admin/resources, /admin/utm, /admin/seo, /admin/wiki | Commerce/affiliate, resources, growth, docs. |

---

## 5. Component rulings

| Component(s) | LOC | Ruling | Why |
|---|---|---|---|
| `feed/post-card.tsx` (+ `PostCardSkeleton`) | 207 | **Delete** | Dead (0 imports). The live card is `FeedCard` in `canonical-feed-client.tsx`. S-feed extracts `FeedCard` into its own file as the one card. |
| `feed/feed-undo-toast.tsx` | 33 | **Adopt** | Undo after Hide is exactly the purposeful, confirming feedback the vision wants. Wire it when per-card actions move to overflow. |
| `discussion/thread-header.tsx` | 343 | **Delete** | Dead; pre-canonical header. `canonical-thread.tsx` + `post-detail-client.tsx` are the reference impl (extend, don't fork). Mine it for ideas only. |
| `discussion/thread-sidebar.tsx` | 196 | **Delete** | Dead; desktop sidebar for "MAX" related posts. Desktop follows mobile. |
| `discussion/category-bodies.tsx`, `insight-rail-extras.tsx` | 32 / 12 | **Delete** | Dead shims superseded by `categories/registry.ts`. |
| `compose/tag-picker.tsx` | 80 | **Keep for composer spec** | Dead today; the composer rebuild decides adopt/delete. |
| `states/empty-state.tsx`, `states/error-state.tsx`, `states/loading-state.tsx` | 21/20/14 | **Delete; replace by the S00 state kit** | Dead. The live empty state is `ui/empty-state.tsx` (7 importers). Two EmptyStates is the duplication. |
| `ui/empty-state.tsx` | 75 | **Keep → becomes the state-kit Empty** | Already used on 7 surfaces; S00 extends it and adds Error + Skeleton compositions beside it. |
| `ui/dropdown-menu.tsx`, `ui/tabs.tsx`, `ui/switch.tsx` | — | **Keep (adopt)** | Unused Radix wrappers S00/S-feed will need (overflow menu, profile tabs, settings toggles). |
| `ui/interactive-hover-button.tsx` | 40 | **Delete** | Hover-only effect; meaningless on touch. |
| `ui/pdf-viewer.tsx` | 145 | **Keep (parked)** | Needed by resources viewer later; zero cost idle. |
| `ui/glowing-effect.tsx` | 196 | **Remove its uses** (top-nav, left-sidebar); delete file | A continuously animated conic border on chrome — no reason for the blink (D-007). Also carries raw hex (DS open item). |
| `new-post/new-post-composer.tsx` + `typed-fields-panel.tsx` | 774 + 375 | **Rebuild on TipTap** | See §2.7. Keep dimension keys/list modes (backend contract). |
| `feed/top-post-hero-carousel.tsx` | 779 | **Replace** with a small "Top this week" rail (≤150 LOC) | At 390 it degrades into 3 stacked cards that duplicate the feed; at 1440 it's a first fold of empty grey. 779 LOC of touch/motion code for a banner. Keep `heroSlots` data (editorial hero is a valid lever). |
| `layout/top-nav.tsx` | 482 | **Rebuild in S00 shell** | Carries theme toggle, duplicate +, command palette, glow. |

## 6. Copy-leak audit

**Method** (repeatable): grep `apps/forum/src` + `packages/auth-ui/src` TSX (tests excluded, comment lines excluded) for
`CAP-[0-9]|Phase [0-9]|Wave-?[0-9]|MAX pass|honest empty|\(M[0-9]+\)|rules\.v1|toolRatings|derivation-trail|display-only|[Ii]nterim|in v1|Convex` inside strings/JSX text, then hand-filter code identifiers.

**Count:** **~45 literal leaks in ~20 files**, plus **4 data-driven leak classes** (raw keys rendered from data):
notification types (`post_comment` → "post comment"), completion-badge keys (`email_verified`), erase-field names (`roleArchetype`),
hero slot kinds (`community_top`, `editorial`).

**Top offending files**
| File | Hits | Examples |
|---|---|---|
| `components/discussion/post-detail-client.tsx` | 9 | `toolRatings` sole aggregate, `(CAP-092)`, `(CAP-089 tombstone)`, `Accept (CAP-098)`, `accepted comment id (Phase 5)` input |
| `app/(app)/(shell)/leaderboard/leaderboard-page-client.tsx` | 8 | "reputation engine (M12) — interim values", Connect Convex |
| `app/(app)/(shell)/sell/*` | 6 | "CAP-233 gate", "CAP-270", "Data honesty (CAP-262)", `type=self_report` |
| `components/new-post/*` | 5 | `POST_URL_NOT_ALLOWED … (CAP-087)`, "(CAP-100)", "Convex is not configured." |
| `app/(app)/(shell)/settings/profile/settings-profile-client.tsx` | 4 | "no OAuth … in v1", "derivation-trail invalidation", raw field names |
| `components/discussion/canonical-thread.tsx` | 2 | "MAX pass ships (Phase 7)" |
| `components/profile/canonical-profile.tsx` | 1 (+keys) | "Wave-7 … (CAP-297) — honest empty" |
| `components/feed/canonical-feed-client.tsx` | 1 (+keys) | "(CAP-553)" |
| 5 "Connect Convex to load …" guards | 5 | discussion, users, discover, notifications, new-post |
| `app/(app)/kit/page.tsx` | several | internal showcase — hide route |

**Proposed rule for S00 (COPY-1):** *No user-visible string may contain a capability/decision/phase/wave/module ID, a version tag
(`v1`, `rules.v1`), a table/field/enum name, a vendor/infra name (Convex, OAuth), or an explanation of what isn't built.
Enum/field values render only through a label map. "Not built yet" is never shown — the surface is hidden instead.*
Enforce with a Vitest source-scan test (pattern above) in `apps/forum` so it can't regress. Legal/founder-owned copy is exempt from rewriting but not from the ID ban.

## 7. STYLE-KIT vs VISION

STYLE-KIT (`docs/04-design-system/STYLE-KIT.md`) is reconciled to the app (its §2 header, 2026-08-31); identity "Electric Blue" with a glow system.
**Ruling (D-007, founder 2026-09-29): glow and glass stay — "a blink with a reason."** Glow only on brand/interactive moments;
pulse only for live states; glass subtle and on chrome only; reduced-motion stops all glow motion. Per use (10 live glow vars; already `none` in light mode):

| Token / effect | Kit usage today | Ruling | Guardrail it must satisfy |
|---|---|---|---|
| `glow-primary-sm` | card hover, active nav items | **Keep with guardrail** — active tab/nav item only | Active state = interactive moment. Not on card hover. |
| `glow-primary-md` | primary buttons, CTAs, focus | **Keep with guardrail** — primary CTA + Create button only (one per screen) | Brand/interactive moment; never on secondary buttons. |
| `glow-primary-lg` | hero, featured content | **Keep with guardrail** — celebrations only (publish success, level-up, award) | "Blink with a reason": the moment is the reason; transient, not resting. |
| `glow-primary-text` | landing hero headings | **Remove** | Static text glow has no interaction and no reason. |
| `glow-primary-border` | focused inputs, active cards | **Keep** as the focus-visible ring (both themes: solid ring in light) | Focus = purpose (a11y). |
| `glow-primary-pulse` (2 s infinite) | "live indicators, active states" | **Keep with guardrail** — live states only (e.g. someone typing, live thread, unread arriving); stops under reduced-motion | Pulse = something is happening now. Never on idle UI. |
| `glow-primary-pill` / `-pill-hover` | desktop sidebar primary pill | **Remove** (merged into `-md` for the Create/primary CTA) | Duplicate of the CTA glow. |
| `glow-primary-card-hover` | feed card hover | **Remove** | Hover on content isn't a brand moment; touch-irrelevant; feed noise (founder: "nothing disturbing"). |
| `glow-primary-track` | navigation progress bar | **Keep** | Shows the app is working. |
| `glow-primary-halo` | carousel radial background | **Remove** (not in STYLE-KIT — drift; goes with the carousel) | Decoration. |
| `ui/glowing-effect.tsx` conic animated border | top-nav, left-sidebar | **Remove** | Continuous animated border on chrome = "RGB light"; raw hex (DS open item). |
| Search focus 2.5 s spin ring | search input | **Remove** (focus uses `-border`) | Spinning border has no reason beyond focus, already covered. |
| Glass (backdrop-blur) on top bar / tab bar | present, ad-hoc | **Keep with guardrail** — tokenised `glass/subtle` on chrome; `glass/strong` only by spec exception; ≤2 stacked; solid fallback | Threads-level subtle chrome. |
| Sky-500 brand colour | everywhere | **Keep** | Distinct, legible on both themes. |

**App-vs-kit drift since 2026-08-31:** `--glow-primary-halo` exists in the app, not the kit; `glowing-effect.tsx` raw hex stops (DS open item, still open); 3 catalogued arbitrary-px offsets (DS open item); forum/admin CSS differ on one line (L522). No other token drift (same var names in both apps).

**Net:** STYLE-KIT stays the source (D-007). S00 edits it to state the guardrails, adds `glass/*`, sheet, safe-area, theme-color and state-kit tokens, and ships glow/glass as utilities so components can't hand-roll them.

## 8. PM-OBSERVATIONS-S1 — verified

| # | Item | Verdict | Evidence |
|---|---|---|---|
| Keep-1 | Dark theme coherent; density reads well | **CONFIRMED** | feed/discussion 390 baselines |
| Keep-2 | Review verdict block is a differentiator | **CONFIRMED** | discussion-390-in; wrapped in a leak |
| Keep-3 | Tab bar + unread badge work | **PARTIAL** | Badge works (3). Tab bar's "Create" label invisible; Profile tab → settings. |
| Keep-4 | Seed voice credible | **CONFIRMED** | except /category (fabricated static, not the seed) |
| P0-1 | Spec text leaks into UI; likely app-wide | **CONFIRMED** | §6: ~45 literals / ~20 files + 4 data-driven classes. All five quoted strings found verbatim. |
| P0-2 | "Sign-ups closed" first on every gate | **CONFIRMED**, cause identified | `admission.ts` fail-closed: no readiness row ⇒ closed. Config default, not intent-by-design → D-009. |
| P0-3 | Long-title 2-line clamp broken; R3 "renders" was wrong | **CONFIRMED** | 5 lines at 390; no `line-clamp` on `FeedCard` title (L199). |
| P0-4 | Creator has no home; no posts; Awards empty despite 26 badges | **CONFIRMED** | `/profile`→settings; `profile/page.ts` projects no posts, `awardsShelf: []` hardcoded. → CR-008. |
| P0-5 | Notifications anonymous and raw | **CONFIRMED — it's a projection gap (CR), not only UI** | `actorUserIds` stored; `reads.ts` returns only `actorCount`. → CR-004. |
| P0-6 | No avatars (projection hardcodes null) | **CONFIRMED** | `profile/page.ts:98,166`; `users.image` exists; no upload path in UI. → CR-003. |
| P1-7 | Mod actions as text on every card | **CONFIRMED** | feed-390-in |
| P1-8 | Absolute vs relative dates | **CONFIRMED** | `canonical-feed-client.tsx:194` |
| P1-9 | Create label invisible | **CONFIRMED** | tab bar in every 390-in baseline |
| P1-10 | Duplicate landing CTA; logged-in no path to feed | **CONFIRMED** | landing-390-out / -in identical |
| P1-11 | Desktop hero empty grey first fold; sidebar empty; narrow feed | **CONFIRMED** | feed-1440-in; also hero items duplicated as cards below |
| P1-12 | Mixed loading states | **CONFIRMED** | RAW-INVENTORY §E |
| Struct | STYLE-KIT reconciled; live tension is aesthetic (glow) | **CONFIRMED** (RECONCILIATION-NOTE does not exist; STYLE-KIT's own §2 header records it). Resolved by D-007 (glow stays with guardrails). | §7 |
| CR-1 | Six crons fail on `.withIndex` | **CONFIRMED in code** (e.g. `jobs/legitimacy.ts:103` `by_user_time` queried by `occurredAt` only) | → CR-002 |
| CR-2..5 | avatars / follows+streaks / notif context / drafts + podium | **CONFIRMED as CR candidates** | CR-003..CR-007 |
| — | **Missed by PM:** `/category/[slug]` is fabricated static content; leaderboard fabricates per-category scores; `/kit` is publicly routable | **NEW** | §2.13, §2.14, §3 |

## 9. Top 10 gaps (ranked by damage to trust + feel-special)

1. **Fabricated content on a trust product** — `/category/[slug]` static fake author/badges; leaderboard fake derivation. *(UI only — S-discover/category; remove fake derivation now.)*
2. **Internal/spec language in the UI** — ~45 literals + raw keys. *(S00 COPY-1 + cleanup; no backend.)*
3. **No identity: no avatars, "Someone" notifications** — community without faces. *(CR-003, CR-004.)*
4. **The creator has no home** — Profile tab → settings; profile shows no work, no awards. *(CR-008 + S-profile + nav DECISION.)*
5. **Zero feel-special moments** — publish, first comment, recognition have no response. *(S-composer, S-discussion, S-notifications; motion principles in S00.)*
6. **Front door says "closed"** — sign-in gate. *(D-009 decided: open; CR-009 for local seed; S01.)*
7. **Website-feel** — no manifest/icons/theme-color/viewport/SW, invisible Create label, theme toggle in the header. *(S00 app-feel.)*
8. **No state system** — blank screens while loading, 8 core routes with no error state, dev-facing "Connect Convex". *(S00 state kit.)*
9. **Noisy chrome on content** — per-card moderation text, six-button comment rows, broken title clamp, absolute dates. *(S-feed, S-discussion.)*
10. **Composer is a form, not a writing tool** — 1,149 LOC, localStorage drafts, publish top-right. *(S-composer on TipTap + CR-005.)*

## 10. Backend needs → CRs (never folded into a spec silently)

| CR | Ask | Blocks |
|---|---|---|
| CR-001 | `dev/demoSeed` guard hardening (port loopback allowlist or document the cloud-dest exception) | nothing user-facing; safety |
| CR-002 | Fix 6 cron `.withIndex` prefix bugs — incl. `jobs/legitimacy:recompute`, `rankIntegritySweep`, `analytics/projections:*` (future influence-signal jobs) | report-card signals; log noise |
| CR-003 | Avatars: project `users.image` (and an upload mutation → storage) instead of `avatarUrl: null` | S-profile, S-feed, S-notifications, S-setup |
| CR-004 | Notification context: return actor (name, handle, avatar) + object title/snippet in `notifications.reads.list` | S-notifications |
| CR-005 | Server drafts (CAP-531) | S-composer (can ship on localStorage first) |
| CR-006 | Podium: real projection and/or beta floor below 25 | S-leaderboard |
| CR-007 | Follows / streaks — **REJECTED for MVP 1** (2026-09-29) | — |
| CR-009 | Local seed marks readiness `ready` + `signup.mode=open` (D-009) | S01 baselines |
| CR-008 | Profile body of work: author's posts (paginated) + awards shelf from `badges` | S-profile |

Details in `00-control/crs/CR-NNN-REQUEST.md`.
