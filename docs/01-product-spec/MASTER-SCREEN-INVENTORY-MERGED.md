# CREATECONOMY MVP-1 — MASTER SCREEN INVENTORY (RECONCILED)

**Derived from:** `CAPABILITY-REGISTER-MERGED.md` (572 capabilities · M1–M18 · fully resolved) *(count corrected 548 → 568, 2026-08-26 — AUDIT-FINAL F-00d)*
**Base:** Opus's derivation (most rigorous — explicit `_data-model.md` cross-check caught gaps GPT and Fable's own passes missed)
**Merged in:** GPT's coverage catch (CAP-052, CAP-059/060 — folded into existing routes, not new screens) · Fable's admin-panel consolidation (§4, cross-validated, unchanged from Opus's own — both landed the same 5-row Qualification Thresholds panel independently)
**Resolved this pass:** Profile+Distribution merge (founder decision) → CAP-526–529 added to register, `/u/[handle]` replaces the old split `/settings/profile` + `/d/[handle]` ambiguity · Search (`/search`) added, CAP-486's noindex reference now grounded
**Phase:** 1.5 → 2 (surface derivation), now closed. **This is inventory only — no per-screen visual design.**

---

## Derivation rules applied

1. **Every screen traces to a CAP-ID.** If a surface can't be tied to a row in the register, it is cut — not added because a social/SaaS product "usually has one."
2. **`Has UI = YES` ≠ dedicated screen.** 442 rows are `Has-UI=YES` *(corrected from 425, 2026-08-26 — F-00d)*, but many are backend *gates* whose UI is "user sees rejection," "indirect," or "composer open." Those fold into a host screen; they do **not** spawn routes.
3. **Per-type / per-sort rendering collapses into one templated screen.** The 8 active post types render through **one** Post Detail template; the 4 feed sorts render through **one** Feed. This is the single biggest driver of the count delta vs. the stale 265 estimate.
4. **Build Wave** follows the locked dependency order (not reordered). A screen assigned to an early wave may be *enriched* in a later wave (e.g. Post Detail = M4 shell in W2, M6 discussion in W5, M11 product block in W6). Wave = first substantive build; enrichment noted.

---

## MASTER SCREEN INVENTORY

### Wave 1 — Foundation (M1)

| Route | Screen Name | Template archetype | Primary CAP-IDs served | Actor(s) | Wave |
|---|---|---|---|---|---|
| `(root layout)` | App Shell / Providers | App-shell layout (STYLE-KIT §12.1/§10) | CAP-025, CAP-026, CAP-028 | System | 1 |
| `/signin` | Sign In (magic link) | Auth card (420px) | CAP-001, CAP-016, CAP-017, CAP-018, CAP-030 | anonymous | 1 |
| `/waitlist` | Waitlist Join | Form/auth card | CAP-014, CAP-015 | anonymous | 1 |
| `/welcome` | Bootstrap Finalize (timezone chooser) | Onboarding step / modal | CAP-002, CAP-003 | member | 1 |
| `/privacy` · `/dmca` · `/terms` | Legal Pages | Static legal (no ConsentProvider) | CAP-027 | anonymous | 1 |

### Wave 2 — M4 Post System + M5 Tool Registry

| Route | Screen Name | Template archetype | Primary CAP-IDs served | Actor(s) | Wave |
|---|---|---|---|---|---|
| `/compose` · `/compose/[type]` | Post Composer | Block composer / typed form *(+CAP-244 add-products in W6)* | CAP-086, CAP-088, CAP-100, CAP-105 | member | 2 |
| `/p/[slug]` | Post Detail (all 8 active types + mechanics) | Reading column + thread *(+M6 CAP-120–139 W5, +M11 CAP-245 W6)* | CAP-090, CAP-092, CAP-093, CAP-094, CAP-095, CAP-096, CAP-097, CAP-098, CAP-099, CAP-107 | anonymous, member | 2 |
| `/tools` | Tool Directory | Grid/list + filter | CAP-111 | anonymous, member | 2 |
| `/tools/[slug]` | Tool Profile | Profile + two labeled segments + rating form | CAP-110, CAP-112, CAP-113, CAP-117, CAP-118 | member | 2 |

### Wave 3 — M3 Qualification (backend; minimal UI)

| Route | Screen Name | Template archetype | Primary CAP-IDs served | Actor(s) | Wave |
|---|---|---|---|---|---|
| `/admin/rulebook` | Qualification Thresholds & Rules | Admin config panel | CAP-084, CAP-085, CAP-537 *(calibration-set curation, added Wave-3 E4 2026-08-23)* *(absorbs threshold candidates — see §4)* | administrator | 3 |

### Wave 4 — M2 Content Engine (backend; operator UI)

| Route | Screen Name | Template archetype | Primary CAP-IDs served | Actor(s) | Wave |
|---|---|---|---|---|---|
| `/admin/sources` | Source Console | Admin table + form | CAP-031, CAP-538 *(list read, added Wave-4 E1 2026-08-24)* | Publisher | 4 |
| `/admin/editorial` | Editorial Workspace / Candidate Review | Evidence-review + operator queue | CAP-041, CAP-042, CAP-043, CAP-044, CAP-048, CAP-049, CAP-050, CAP-052, CAP-053, CAP-054, CAP-055, CAP-542 *(claim entailment confirm, Wave-4 E5)*, CAP-543 *(manual draft edit, Wave-4 Flag 2 2026-08-24)* | Editor, Publisher | 4 |
| `/admin/affiliate-inventory` | Affiliate Inventory | Admin config panel | CAP-544 *(list read, Wave-4 Flag 1a 2026-08-24)*, CAP-539, CAP-540, CAP-541, CAP-545 *(soft-deactivate cascade, Wave-4B E1 2026-08-24)* | administrator | 4 |

### Wave 5 — M8 Persona → M6 Discussion → M7 Posting Gate

| Route | Screen Name | Template archetype | Primary CAP-IDs served | Actor(s) | Wave |
|---|---|---|---|---|---|
| `/personas` | Population Page | Public roster + lifecycle + revival vote | CAP-179, CAP-176, CAP-177, CAP-181 | anonymous, member | 5 |
| `/personas/[id]` | Persona Profile | Profile + track record + "how this AI thinks" | CAP-180 | anonymous, member | 5 |
| `/admin/personas` | Persona Population Console | Admin lifecycle queue | CAP-159, CAP-160, CAP-161, CAP-162, CAP-163, CAP-164, CAP-165, CAP-166, CAP-167 | Editor, Publisher, Administrator | 5 |
| `/admin/personas/queue` | Persona Comment Review Queue | Operator queue | CAP-172, CAP-173, CAP-174, CAP-175 | Editor, Publisher, Administrator | 5 |
| `/admin/personas/genome` | Persona Genome Config (back-door) | Admin config | CAP-178, CAP-546 *(rollback, Wave 5A E-F 2026-08-24)*, CAP-548 *(preview fixture, Wave 5A E-G 2026-08-24)* | Administrator | 5 |
| *(enriches `/p/[slug]`)* | Discussion / Thread + MAX map | Comment thread + intelligence panel | CAP-120, CAP-121, CAP-122, CAP-123, CAP-124, CAP-125, CAP-126, CAP-127, CAP-128, CAP-131, CAP-139 | member, anonymous | 5 |
| `/setup` | Profile Setup / Basic Profile (posting gate) | Onboarding form | CAP-142, CAP-144, CAP-148 *(gates CAP-140/141)*, CAP-551 *(mobile OTP, Wave 5B E-mobile 2026-08-25 — OTP provider OPEN)* | member | 5 |
| `/settings/profile` | Profile Settings & Privacy | Settings form | CAP-143, CAP-146, CAP-147, CAP-149, CAP-150, CAP-151, CAP-157, CAP-549 *(social revoke, Wave 5B E-settings-2 2026-08-25)*, CAP-552 *(privacy toggles, W5B-AUDIT-1 2026-08-25)* | member | 5 |
| `/u/[handle]` | **Profile** (merged Profile + Distribution — founder decision 2026-08-09) | Entity profile, tabbed (Overview / Journal / Metrics) *(M12 Metrics enrichment W7C — see Primary CAP-IDs)* | CAP-526, CAP-527, CAP-528, CAP-143, CAP-150, CAP-281, CAP-297, CAP-299, CAP-300, CAP-301, CAP-302, CAP-304, CAP-305, CAP-313, CAP-565 *(M12 enrichment W7C via CONTRACT-7-profile-economy addendum; CAP-303 deliberately absent — internal reachFactor, never rendered; CAP-146 removed 2026-08-26 — owned by `/settings/profile`, AUDIT-FINAL F-03)* | anonymous, member | 5 |

\* **Actor(s) column on dense admin screens (Wave 5A E-E; Wave 6B E6):** inventory Actor(s) = **broadest screen access**, not uniform per-action authority. Individual actions gate per their own CAP-ID (e.g. `/admin/personas`: Pause admits Moderator; Wane excludes Administrator, System-triggered. `/admin/resources`: support_operator is in broadest access via CAP-218/225; **CAP-221 Administrator-only UGC kill-switch is a distinct, narrower gate** and is not implied by this column; CAP-220 cron is not a screen-access actor). See per-action Actor column in the screen contract for exact gating.

### Wave 6 — M9 Feed → M10 Store → M11 Affiliate

| Route | Screen Name | Template archetype | Primary CAP-IDs served | Actor(s) | Wave |
|---|---|---|---|---|---|
| `/` (authed) · `/feed` | **Feed / Home** | 3-col app feed (§12.1) | CAP-182, CAP-183, CAP-184, CAP-185, CAP-186, CAP-189, CAP-190, CAP-192, CAP-193, CAP-194, CAP-195, CAP-196, CAP-197, CAP-198, CAP-199, CAP-200, CAP-201, CAP-553 *(unhide/unmute, Wave 6A 2026-08-25)* | anonymous, member | 6 |
| `/admin/curation` | Hero & Featured Management | Admin scheduler | CAP-191, CAP-192, CAP-554 *(Featured emergency-pull, Wave 6A 2026-08-25)* | Editor, Publisher, store_operator, administrator | 6 |
| `/search` | Search Results (posts / tools / profiles) | Search results grid + filters | CAP-529 | anonymous, member | 6 |
| `/resources` | Resource Library | Grid + acquire + quota counts | CAP-224, CAP-212, CAP-213, CAP-215, CAP-229 | anonymous, member | 6 |
| `/resources/[slug]/view` | Resource Viewer | Sandboxed PDF viewer | CAP-211 | anonymous, member | 6 |
| `/contribute` | Contribute / Reference Upload | Upload dropzone — **reachable disabled-render when ugc.enabled=false** (Wave 6B E3; not 404) | CAP-202, CAP-203, CAP-227, CAP-228 | member | 6 |
| `/admin/resources` | Resource Ops Console | Review queues + forge + kill-gate | CAP-205, CAP-206, CAP-207, CAP-209, CAP-210, CAP-218, CAP-219, CAP-220, CAP-221, CAP-222, CAP-225, CAP-226, CAP-555, CAP-556, CAP-557, CAP-558, CAP-559 | Editor, Publisher, store_operator, Moderator, support_operator | 6 |
| `/s/[handle]` | Storefront (public) | Store page + product cards | CAP-269, CAP-246, CAP-252 | anonymous, member | 6 |
| `/s/[handle]/[product]` | Product Detail + Discussion | Product page (reuses M6 thread) | CAP-245, CAP-246, CAP-253, CAP-255, CAP-524, CAP-560, CAP-561 *(shadow-post host + owner-hide, Wave 6 cleanup — added 2026-08-26, AUDIT-FINAL F-02)* | member | 6 |
| `/sell/apply` | Store Application | Multi-step form + data-honesty page | CAP-230, CAP-231, CAP-262 | member | 6 |
| `/sell` | Rocketeer Dashboard (manage · analytics · evidence) | Seller dashboard | CAP-233, CAP-234, CAP-239, CAP-243, CAP-270, CAP-257, CAP-258, CAP-259, CAP-260, CAP-525 | member | 6 |
| `/go/[linkId]` | BUY Interstitial / Redirect | Interstitial (context-aware) | CAP-247, CAP-248, CAP-249 | member, anonymous | 6 |
| `/admin/store` | Store Validation Queue | Operator queue | CAP-232, CAP-237, CAP-238, CAP-263, CAP-264, CAP-265, CAP-266, CAP-267, CAP-268 | store_operator | 6 |

### Wave 7 — M12–M18 Cross-cutting

| Route | Screen Name | Template archetype | Primary CAP-IDs served | Actor(s) | Wave |
|---|---|---|---|---|---|
| `/notifications` | Notifications | Notification list | CAP-378, CAP-379, CAP-382, CAP-386, CAP-568 *(list-read query, Wave 7 final — added 2026-08-26, AUDIT-FINAL F-02)* | member | 7 |
| `/appeal/[actionId]` | Appeal Submission | Form | CAP-340 | member | 7 |
| `/legal/intake` | Legal & Rights Intake (DMCA · counter · grievance · erasure) | Form set | CAP-058, CAP-059, CAP-060, CAP-217, CAP-343, CAP-344, CAP-348, CAP-350 | member, anonymous | 7 |
| `/repeat-infringer` | Repeat-Infringer Policy | Static page | CAP-339 | anonymous | 7 |
| `/how-we-review` · `/editorial-policy` · `/ai-disclosure` · `/about` · `/help` · `/how-we-use-your-store-data` | Trust & Policy Pages | Static content + provenance block | CAP-262, CAP-468, CAP-469, CAP-562, CAP-563 *(`/about` + `/help` backing rows, Wave 7A E4 — added 2026-08-26, AUDIT-FINAL F-02)* | anonymous | 7 |
| `/` (anon) | Landing Page | Landing layout (§12.3) | CAP-464, CAP-465, CAP-478 | anonymous | 7 |
| *(global overlay)* | Consent Management (CMP) | Banner + preferences | CAP-504, CAP-505, CAP-506 | member, anonymous | 7 |
| `/admin` | Admin Shell + Command Palette | Admin layout (§12.4) | CAP-390, CAP-392, CAP-430 | administrator | 7 |
| `/admin/home` | Admin Home | Dashboard + intervention banners | CAP-391, CAP-399, CAP-407, CAP-408, CAP-409, CAP-410, CAP-411, CAP-412 | administrator | 7 |
| `/admin/config` | Config Console (+ STOP + kill-switches) | Typed config forms | CAP-394, CAP-395, CAP-396, CAP-397, CAP-398, CAP-460, CAP-480 | administrator, Founder | 7 |
| `/admin/support` | Support Console | Masked user tools | CAP-402, CAP-403, CAP-404, CAP-405, CAP-406 | support_operator | 7 |
| `/admin/roles` | RBAC & Ops Assignments | Admin forms | CAP-008, CAP-413, CAP-414, CAP-415, CAP-416, CAP-417, CAP-564 *(UI role-revoke, Wave 7B E3 — added 2026-08-26, AUDIT-FINAL F-02)* | Founder, administrator | 7 |
| `/admin/wiki` | Admin Wiki | Sanitized-Markdown reader | CAP-418, CAP-419, CAP-420 | all staff | 7 |
| `/admin/audit` | Audit Log Viewer | Data table | CAP-357, CAP-421, CAP-422 | administrator, Founder | 7 |
| `/admin/readiness` | Launch Readiness | Checklist | CAP-435, CAP-509, CAP-510 | Founder, administrator | 7 |
| `/admin/moderation` | Moderation Console / Case Queue | Case queue + detail | CAP-101, CAP-102, CAP-103, CAP-114, CAP-135, CAP-136, CAP-137, CAP-138, CAP-327, CAP-328, CAP-329, CAP-330, CAP-333, CAP-335, CAP-336, CAP-337, CAP-341, CAP-342, CAP-359 | Moderator, administrator | 7 |
| `/admin/analytics` | Analytics Dashboard (Founder) | Cards + charts | CAP-445, CAP-446, CAP-447, CAP-448, CAP-449, CAP-451, CAP-452, CAP-458, CAP-459, CAP-463 | Founder, administrator | 7 |
| `/admin/reliability` | Reliability / Jobs & Dead-letter | Table + health | CAP-499, CAP-500, CAP-501, CAP-503 | Founder, administrator | 7 |
| `/admin/utm` | UTM Builder | Generator form | CAP-479, CAP-566 *(utmDictionary seed/edit, Wave 7D E1 — added 2026-08-26, AUDIT-FINAL F-02)* | administrator | 7 |
| `/admin/seo` | SEO Health | Health widget | CAP-483, CAP-484, CAP-567 *(admin seoHealth read, Wave 7D E4 — added 2026-08-26, AUDIT-FINAL F-02)* | administrator | 7 |

> **Global overlays (not routes, noted for completeness):** Report modal (CAP-324 — **resolved**, see §2 G5; the stale unclear-entity tag was removed 2026-08-26 per Wave-7A's "correct the inventory" instruction + AUDIT-FINAL F-09), Create-Distribution modal (CAP-299), Newsletter-consent modal (CAP-384/385), Re-acceptance prompt (CAP-157), Coach cards (CAP-369/370), Empty-state renders (CAP-371/372), "Why am I seeing this?" drawer (CAP-199). These attach to host screens above and consume no new route.

> **Enrichment addenda (not separate screens):** `CONTRACT-7-profile-economy-FINAL.md` is a **Wave-7C enrichment addendum to the `/u/[handle]` row** (M12 Metrics tab + Create-Distribution overlay on the Wave-5B base) — one screen, two contract documents; not an unmapped file. Same pattern as the discussion-thread enrichment of `/p/[slug]`. *(Noted 2026-08-26, AUDIT-FINAL F-02/R3.)*

---

## §1 — Total screen count & delta vs. the stale 265 estimate

**Total: 54 distinct screen templates** (≈72 concrete routes once per-type post rendering, the 3 legal routes, and the 6 trust routes are expanded). *(Count reconciliation, 2026-08-26 — AUDIT-FINAL R3: the inventory table above has **55 rows**; 54 is correct because one row — "(enriches `/p/[slug]`)" Discussion/Thread — is an enrichment of the Post Detail template, not a distinct template. Contract files number **56**: the 55 rows' contracts plus `CONTRACT-7-profile-economy-FINAL.md`, an enrichment addendum to `/u/[handle]` with no row of its own.)* Net +2 vs. Opus's original 52: −1 (`/d/[handle]` retired, merged into Profile) +2 (`/u/[handle]` merged Profile+Distribution, `/search`) +1 (`/admin/affiliate-inventory`, Wave-4 E3 2026-08-24 — screen contract in `contracts/wave-4/CONTRACT-4-affiliate-inventory-FINAL.md`, Wave 4B).

**Delta: −212 vs. the old design system's 265-screen estimate.**

The old number was inflated by three things the register does not support:
- **Per-variant screen counting.** The stale system treated each of the 10 post types, each of the 4 feed sorts, each modal, and each state (empty/loading/error) as its own screen. The register makes these **one templated Post Detail** (`post.type` = shape-in-code + extension tables) and **one Feed** (sort = a query param), collapsing ~120+ phantom screens into ~2.
- **Backend-only capability inflation.** Of 425 `Has-UI=YES` rows, a large share are *gates* ("user sees rejection," "indirect," "composer open"). They render **inside** a host screen and were double-counted as standalone screens in the 265.
- **"Usual product" screens with no CAP.** Discovery hubs, per-category landing pages, follower/following lists, DM/inbox, etc. — none are backed by a register row, so they're cut. (See §2 for the ones that *should* exist but genuinely lack a CAP — those I flag, not invent.)

Conversely, the register **adds** surfaces the stale system underweighted: the full M15 admin console (Config, Support, RBAC, Wiki, Audit, Readiness, Moderation, Reliability), the Distribution/Might ladder page, the Population/Persona transparency pages, and the seller/store subsystem.

---

## §2 — Gaps: resolution status

**RESOLVED this pass (register healed, not just screen-placed):**
- **G1 (Profile page)** — CAP-526 added; lands on `/u/[handle]`.
- **G2 (Journal tab)** — CAP-527/528 added; lands on `/u/[handle]` Journal tab.
- **G3 (Search)** — CAP-529 added; lands on `/search`. Basic keyword match across posts/tools/profiles, industry-standard, no ML ranking — per founder direction, this is functional not exploratory. CAP-486's noindex reference is now grounded in a real capability.
- **G4 (saved comments)** — extended into CAP-185 (Fav sort) rather than a new route; no new screen needed.

**RESOLVED (2026-08-09):**
- **G5 — Report target entity.** CAP-127 (in-thread comment flag): `moderationCases.target` = the comment record, matching CAP-135's existing pattern. Parent post reached via the comment's `postId` FK — no redundant reference. The full Report button (CAP-324) was always unambiguous; this only affected the lighter in-thread flag. Report modal's data contract is now unblocked for Phase 3.

**Accepted as-is, no action needed:**
- **G6 (theme toggle)** — folds into `/settings`, no dedicated capability needed, low-risk chrome.

## §3 — Screen archetypes NOT covered by STYLE-KIT's existing component patterns (flag; do NOT invent silently)

STYLE-KIT §11 covers buttons, inputs, cards (post/user/stats/notification/widget), nav, badges/pills/tags, avatar, modals/sheets/toast/tooltip/dropdown, and skeletons. The following archetypes are **required by traced screens but have no defined pattern**:

| # | Missing archetype | Needed by | Note |
|---|---|---|---|
| A1 | **Data table** (dense, sortable, bulk-select) | `/admin/moderation`, `/admin/audit`, `/admin/config`, `/admin/store`, Source Console | §12.4 *mentions* "tables" in the admin layout but §11 defines **no table component**. Highest-priority gap. |
| A2 | **Charts / data-viz** | `/admin/analytics` (L08 funnel, S18, commerce), SEO Health | Only Stats Card + Progress Fill exist. No line/bar/funnel primitive. |
| A3 | **Block / rich composer** | Post Composer (per-type blocks + qualitative grid) | No editor component. |
| A4 | **File upload / dropzone** | Contribute (CAP-202), media upload (CAP-012) | No upload/drop pattern; states (scanning/quarantine/reject) undefined. |
| A5 | **Sandboxed PDF viewer** | Resource Viewer (CAP-211) | Delivery is sandboxed iframe + CSP; no viewer chrome pattern. |
| A6 | **Full-page interstitial** | BUY redirect `/go` (CAP-248/249) | Modal exists, but the context-aware **no-auto-redirect disclosure interstitial** is a distinct pattern. |
| A7 | **Momentum ticker** | Vibing (CAP-189/190) | Scrolling/animated ticker with grounded hook + "Featured" frame — not a defined component. |
| A8 | **Tiered ladder / Level visualization** | Distribution ladder (CAP-313, Orbit→Multiverse, silhouette reveal) | Progress Fill exists but not a multi-tier cosmic ladder with locked/silhouette states. |
| A9 | **Discussion map / MAX viz** | Post Detail thread (CAP-124/132: themes / positions / common-ground + divergence) | No map/cluster/graph component. |
| A10 | **Evidence / diff review panel** | Editorial Workspace (CAP-041: draft + claim evidence + similarity side-by-side) | Reviewer needs synchronized evidence panes; undefined. |
| A11 | **Command palette** | Admin Shell (CAP-390 explicitly lists one) | Not in STYLE-KIT. |
| A12 *(soft)* | **Queue / case board** | Moderation, Persona, Store, Resource queues | Largely composable from cards + A1 table, but the claim/lease/aging affordances are undefined. |
| A13 | **Verified vs. unverified conversion badge** | `/sell` Rocketeer dashboard (CAP-247 network-verified vs CAP-525 interim self-reported) | No STYLE-KIT §11 token exists to visually distinguish CAP-247's network-verified conversions from CAP-525's interim self-reported tier. Needed on /sell's Rocketeer dashboard. Flagged, not designed. *(Wave 6C, 2026-08-25 — CAP-525's "visibly distinct everywhere" mandate; §11.5 Pill alone carries no verified/unverified semantics.)* |

---

## §4 — Admin-Config flagged rows (27): landing confirmation + consolidation

*(2026-08-26 sync, AUDIT-FINAL F-04: count 25 → 27 — CAP-220 and CAP-265, YES-flagged in Waves 6B/6-cleanup, were never added here despite the sync rule below; both now rowed. The phantom `/admin/tools` references are corrected — no such screen exists in the inventory table and no contract surfaces CAP-115/116.)*

All 27 land on an admin surface. **They should NOT become 25 screens** — they collapse into the central **`/admin/config` Config Console** (CAP-395 typed config) organized into namespaced panels, plus two that live on domain admin screens.

*(2026-08-23, Wave-3 E6 refresh: count 23 → 25 to include CAP-533/534 (YES flags added in Wave 2 but never counted); the 5 M3 rows moved Candidates → Confirmed — inventory §4's consolidation verdict had already resolved them onto `/admin/rulebook`, the register column just hadn't caught up.)*

### Confirmed (13)

| CAP-ID | Signal | Lands on |
|---|---|---|
| CAP-008 | Second-Founder gate | `/admin/roles` |
| CAP-115 | Tool aggregate recompute | ⚠️ **No owning screen (corrected 2026-08-26, AUDIT-FINAL F-04):** previously pointed at `/admin/tools`, which exists in no inventory row and no contract; CAP-115 is surfaced by no contract. Placement open — candidate homes: `/admin/config` panel or a widget on an existing admin screen. Founder/PM call. |
| CAP-116 | Aggregate drift monitor | ⚠️ **No owning screen (corrected 2026-08-26, AUDIT-FINAL F-04):** same as CAP-115 — phantom `/admin/tools` removed; surfaced by no contract; placement open. |
| CAP-147 | Social-verify toggle (Phase-3 stub) | `/admin/config` → Feature Flags |
| CAP-524 | Amazon destinations enable/disable | `/admin/config` → Store (M11) |
| CAP-525 | Amazon interim self-report weight | `/admin/config` → Store (M11) |
| **CAP-068** | H-QUOTE caps | **Qualification Thresholds panel** (`/admin/rulebook`) — *confirmed 2026-08-23, Wave 3* |
| **CAP-070** | H-SIM semantic threshold | **Qualification Thresholds panel** (`/admin/rulebook`) — *confirmed 2026-08-23, Wave 3* |
| **CAP-071** | H-DUP threshold | **Qualification Thresholds panel** (`/admin/rulebook`) — *confirmed 2026-08-23, Wave 3* |
| **CAP-072** | H-CAT confidence | **Qualification Thresholds panel** (`/admin/rulebook`) — *confirmed 2026-08-23, Wave 3* |
| **CAP-074** | H-TYPE contract (structural, per-type field list) | **Qualification Thresholds panel** (`/admin/rulebook`) — *confirmed 2026-08-23, Wave 3* |
| **CAP-220** | Constellation pilot kill-gate thresholds (M10) | **`/admin/resources`** kill-gate section (contract States K: "Numeric thresholds are admin-configurable"; keys in `configKeyRegistry` — `/admin/config` typed-key pattern) — *added 2026-08-26, AUDIT-FINAL F-04; YES-flagged Wave 6B, never rowed here* |
| **CAP-265** | Store circuit-breaker N/M thresholds (M11) | **`/admin/config` → Store (M11) panel** — its own Admin-Config cell reads "YES — circuit-breaker N/M thresholds (Store panel)" — *added 2026-08-26, AUDIT-FINAL F-04; YES-flagged Wave-6 cleanup, never rowed here* |

### Candidates (14)

| CAP-ID | Signal | Lands on / Consolidates into |
|---|---|---|
| CAP-051 | SEO generation config | Content-Pipeline panel |
| CAP-062 | Ingest cost budgets | Content-Pipeline panel |
| CAP-063 | Fan-out ceilings | Content-Pipeline panel |
| CAP-155 | Earned-distribution trust threshold | Trust & Signals panel *(non-sealed)* |
| CAP-169 | Persona relevance-gate threshold | Persona-Tuning panel |
| CAP-240 | Link re-scan cadence | Store panel (M11) |
| CAP-250 | Qualified-CTA weight / ceiling | Trust & Signals panel *(non-sealed)* |
| CAP-277 | Reversal display rule | Trust & Signals panel *(non-sealed)* |
| CAP-282 | New-actor grace threshold | Trust & Signals panel *(non-sealed)* |
| CAP-290 | TrustTier composition | Trust & Signals panel *(non-sealed)* |
| CAP-331 | Case aging thresholds | Trust-&-Safety Timers panel (M13) |
| CAP-492 | System job config | Platform/Jobs panel (M18) |
| **CAP-533** | Rating auto-flag threshold (M5) | Threshold key → **`/admin/config`** (typed-key pattern); flagged ratings review surfaces on **`/admin/moderation`** (CAP-114 per tool-profile contract W2-E5 + admin-moderation contract) — *re-pointed 2026-08-26, AUDIT-FINAL F-04: prior "`/admin/tools`" reference was a phantom screen* |
| **CAP-534** | Tag-taxonomy admin editing (M4) | `/admin/config` → Content/Taxonomy panel *(added 2026-08-23, Wave-3 E6 refresh)* |

### Consolidation verdict

- **The 5 M3 rows (CAP-068, 070, 071, 072, 074) → one "Qualification Thresholds" panel** — exactly the merge you called out, and it sits with CAP-084/085 on `/admin/rulebook`. *(Register Admin-Config columns flipped CANDIDATE → CONFIRMED to match, 2026-08-23, Wave-3 E6.)*
- The remaining candidates fold into **~5 `/admin/config` panels**: Content-Pipeline, Persona-Tuning, Trust & Signals *(non-sealed keys only)*, Trust-&-Safety Timers, Platform/Jobs.
- **CAP-115/116** have **no owning screen** (2026-08-26 correction — the previously named `/admin/tools` does not exist in this inventory and no contract surfaces either CAP; placement is an open founder/PM call). CAP-220 lands on `/admin/resources`; CAP-265 on the Store panel.
- ⚠️ **Firewall guard:** the sealed economy keys (`legitimacy.medianTarget`, `signal.eventWeights`, `signal.attributionSplit`, `trust.weightCap`) are **absent from any editor** per CAP-394 — the Trust & Signals panel must expose *only* the non-sealed candidates above, never these.

**Net: 27 config rows → 1 Config Console (≈6 panels) + the Qualification Thresholds panel on `/admin/rulebook` + the `/admin/resources` kill-gate section (all already in the inventory). Zero net-new standalone screens. CAP-115/116 placement is the sole open item (no owning screen — see Confirmed table).**

*(Register↔inventory sync rule, 2026-08-23, Wave-3 E6: any register Admin-Config flag change must update this §4 table in the same pass — see RECONCILIATION-LOG.md §12.)*
