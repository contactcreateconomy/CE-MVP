---
# Feed / Home

**Route:** `/` (authed) · `/feed`
**Status:** LIVE — PRD/app/apps/forum/src/app/(app)/(shell)/feed/page.tsx (+ screen-specific components at PRD/app/apps/forum/src/components/feed/: feed-client.tsx, feed-route-client.tsx, feed-undo-toast.tsx, post-card.tsx, post-actions-menu.tsx, post-interaction-row.tsx, comments-preview-cycler.tsx, report-post-dialog.tsx, top-post-hero-carousel.tsx, trend-sorter.tsx) — route matches spec
**Route drift:** none
**Contract:** PRD/02-contracts/wave-6/CONTRACT-6-feed-FINAL.md
**Slice(s):** P6-03 (screen); substrate P6-01 (schema), P6-02 (System writers)

## Layout
Derived from contract §6 (Components Used) + inventory Template archetype "3-col app feed (§12.1)". Per STYLE-KIT §12.1 3-col app layout:

```
┌───────────────────────────────────────────────────────────────────────┐
│ App chrome / top header                                                │
├───────────┬────────────────────────────────────────┬──────────────────┤
│           │ HERO BAND (4–6 of 10 managed slots;    │                  │
│           │  hero cards §11.3; ≥2 rotate/24h;      │  Right rail      │
│  Left     │  stale >24h → "Community Top")         │  (Widget Cards   │
│  rail     ├────────────────────────────────────────┤   §11.3)         │
│  (nav)    │ VIBING TICKER (A7 — gap; v1 labeled    │ ┌──────────────┐ │
│           │  list per P6-03, not invented)         │ │ PODIUM (5    │ │
│           ├────────────────────────────────────────┤ │ categories × │ │
│           │ SORT TABS §11.4: Top·Hot·New·Fav       │ │ 3 windows;   │ │
│           │ (Fav member-only)                      │ │ "Podium is   │ │
│           ├────────────────────────────────────────┤ │ forming"     │ │
│           │ POST CARD §11.3 ×N                     │ │ placeholder) │ │
│           │  one-liner (CAP-195) · running comment │ └──────────────┘ │
│           │  engaged avatars §11.6 (≤3) · type     │                  │
│           │  pill / Featured / Rising badges §11.5 │                  │
│           │  CardExtras strip (per-type, 1 line)   │                  │
│           │  "newer material exists" (realtime —   │                  │
│           │  counters only, never live reorder)    │                  │
└───────────┴────────────────────────────────────────┴──────────────────┘
 Per-card menu (CAP-200/553): hide · mute · unhide/unmute · see-fewer* ·
 report (→ Report modal CAP-324) — why-drawer (§11.7 Sheet, member-only)
 * "see-fewer" has no write target (feed OQ3) — fenced, not built
```

## Components required
- §12.1 3-col app feed layout — layout pattern; no single library file
- Post card / Widget Card (Podium, Vibing) / hero cards (§11.3 card family) → apps/forum/src/components/ui/card.tsx (generic card base; no dedicated post-card in ui/ — the LIVE screen has its own at src/components/feed/post-card.tsx)
- Engaged avatars (§11.6, ≤3, stack) → apps/forum/src/components/ui/avatar.tsx · MISSING: Avatar stack — no stack component exists in the library (avatar.tsx is single-avatar; report, don't silently patch)
- Pills/tags (§11.5: type nav, Featured badge, Rising badge) → apps/forum/src/components/ui/badge.tsx
- Nav/sort tabs (§11.4) → apps/forum/src/components/ui/tabs.tsx
- §11.1 Button → apps/forum/src/components/ui/button.tsx
- §11.7 Sheet (why-drawer nearest pattern) / Report modal → apps/forum/src/components/ui/dialog.tsx (nearest library pattern; no dedicated sheet/drawer component)
- Toast §11.7 (available-not-prescribed) → apps/forum/src/components/ui/toast.tsx
- §11.9 Skeleton (stagger-load) → apps/forum/src/components/ui/skeleton.tsx
- Empty state (State N; interim behavior unspecified, feed OQ7) → apps/forum/src/components/ui/empty-state.tsx (available; contract's governor CAP-371 is Wave 7)
- MISSING: Momentum ticker (A7) does not exist in the library — inventory §3 archetype gap; P6-03 degrades to a labeled list, do not invent a ticker component
- MISSING (also named undefined in contract §6): Hero rotator, Podium category/window matrix, reason drawer, realtime-new-material indicator — none exist in the library

## States required
*(Enum-backed states enumerated below. GPT's ~90 transient micro-states — each threshold-fail, each Podium cell as its own state, each post-snapshot eligibility change — are folded, since they are behaviors/derived conditions, not enum-backed screen states. Per RECONCILIATION-6A §1, this wave's enum-backed set is genuinely rich, so the enumerated list is larger than prior waves.)*

**A. Sort modes (`feed.sortMode`, four — genuinely distinct):**
1. **Top** (CAP-182) — **Bayesian confidence-damped positive score; NOT Wilson** (no trials denominator; Wilson variant deferred pending qualified-exposure trials); per-type normalized; 7-day rolling by interaction; evergreen protected.
2. **Hot** (CAP-183) — momentum formula; **anonymous default landing**; quality floor kills comment-farming; velocity anomaly → integrity review (**never viral bonus**).
3. **New** (CAP-184) — reverse-chron + interleaved exploration; cold-start author boost; anti-bubble cross-injection; dynamic rate (launch-high, taper); personas excluded from exploration injection.
4. **Fav** (CAP-185, member-only) — Saved + Your Discussions (participated); unread-activity → latest human activity; **saved comments (commentSaves) surface alongside saved posts** (2026-08-09 extension; E5 Reads column caught up).

**B. Post-type nav (CAP-186):** active types only (8: news·review·compare·help·spark·debate·list·showcase); **launch_pad + gigs hidden** until ~1000-DAU flip (admin CAP-104, not deploy). Reads `postTypeConfig.state`.

**C. Vibing ticker — qualification (CAP-189):** unqualified → **qualified** (≥3 distinct humans + ≥2 human interaction types + anti-domination + min duration) → active → **cooldown** (cooldownUntil) → exit. `objectType {post·tool·category·theme}`. **Personas contribute ZERO** to velocity/acceleration/type-count/confidence/threshold/rank; persona participation = display-only context **after** human qualification (M9 CONFIRMED). Integrity multiplier applied.

**D. Vibing hook (CAP-190) — `valence {tension·curiosity·informational·positive}`:** valence-drift guard (tension-cap ~35% rolling + ≥1 curiosity + ≥1 positive per cycle + question-over-contempt scorer + drift audit); representativeness (min distinct-human/cluster-support + supporting+opposing spans + **no emotion attributed to a named user** + neutral fallback); entailment-verified via M6 MAX (sourceIntelligenceRunId); `groundingStatus=insufficient`/`stale` → regenerate or **fall back to neutral title**.

**E. Featured overlay (render of CAP-191 bookings):** time-bound window; labeled "Featured", **visually unmistakable**; cadence ≤1/cycle, ≤1–2 active; **NEVER mutates trendScore**; empty slot → next algorithmic item; **CAP-554 `status=pulled`** removes the item before natural expiry (admin write on `/admin/curation`).

**F. Hero band — `hero.status {draft·scheduled·active·expired·paused·archived}`:** 10 managed (slotOrder 0–9), **4–6 rendered**, **≥2 rotate per 24h**; desktopEnabled/mobileEnabled; overrides (headlineOverride?/textOverride?/mediaAssetId?/ctaLabel?); fallbackPostId?; **stale >24h with no fresh slots → CAP-193 auto-fill from TOP labeled "Community Top"**; **never Recognition-selected**.

**G. Podium widget (CAP-194) — 5 categories × 3 windows (15 cells):** Overall · Best Commenter · Best Helper · Best Reviewer · Rising × 24H · 7D · 1M. Min activation 25 contributors *(updated 2026-08-26, Wave 7C L25 — matches data-model `leaderboard≥25`; register CAP-194/294 amended)*; below → `minThresholdMet=false` → **"Podium is forming"** (per CAP-294). Personas/staff excluded. Rising = period-over-period growth + baseline + eligible-event floor. Reads M12 projections only (renders empty/"forming" until M12 ships — deferred, not a gap).

**H. Card assembly (CAP-195/196/197):**
- **One-liner (CAP-195):** 90–160 chars, neutral/factual, M2-grounded (supportingClaimIds); **stale on material revision → excerpt fallback**; member posts only, not persona. **E3 CLOSED:** Gated-by is `none` (stale CAP-173 removed).
- **Running comment (CAP-196):** pre-computed onto `cardSummaries.runningCommentRef`; same trust-weighted Best score as M6 (register's "M6 Best/Wilson" phrasing is legacy — authoritative = Bayesian); **freeze ≥15min anti-flicker**; personas excluded; **empty → "Start the discussion"**.
- **Engaged avatars (CAP-197):** pre-computed onto `cardSummaries.avatarUserIds[]` + `discussingCount`; up to **3 distinct recent genuine human engagers**; **savers counted but NOT shown**; personas/staff/suspended/opted-out excluded.
- **Per-type CardExtras (LOCKED 2026-08-31 — product-fit review; this ships):** each post-type card may render one compact, type-specific extension strip beneath the one-liner, dispatched by `post.type` (registry pattern): **review** → score dial (verdict + weighted score preview) · **debate** → stance chip (motion + current agree/disagree split) · **gigs** → gig chips (role · budget · duration) · compare → winner-row preview · list → top-3 preview · showcase → media thumb · help → solved/unsolved state · spark → none (statement is the card) · news → corroboration count. Rules: **max 1 line, no images except the showcase thumb; no interactive controls on the card** (weight sliders / re-ranking are archived — see FUTURE-M5-01/02); extras are display-only projections of per-type extension data — they must not write rank/score fields, and the uniform-card firewall (§3M) applies unchanged. Absent extension data → no strip (never a placeholder).
- **E4 CLOSED:** these are stored projections, not live render queries. Display only — must not write `postDistributionScores`.

**I. Realtime (CAP-198):** snapshot feed; **only visible-card counters + "newer material exists" pushed** — never a live reorder. **E1 CLOSED:** gated by CAP-182/183/184/185 (feed open).

**J. Per-card session controls (CAP-200 / CAP-553):** hide (feedSessions) · mute (feedSessions) · **unhide/unmute (CAP-553 `feed.unhide`)** · see-fewer (⚠️ no distinct write target — Open Question) · report (→ reports).

**K. "Why am I seeing this?" drawer (CAP-199):** per-card reason render from postDistributionScores/feedExplorationState/cardSummaries/rawEvents. Founder-picked MVP feature.

**L. Rising badge (CAP-201):** card badge → routes to Podium (**E2 CLOSED:** CAP-194, not CAP-175).

**M. Firewall invariants (govern every state):** personas/staff ZERO in core ranking; controlled participation display-only; Recognition/featuring never boost organic; exploration never operator curation (INV-4); velocity anomaly → integrity review, never viral bonus; **cardSummaries display projections never write rank**.

**N. Empty state:** governed by M14 CAP-371 R-EMPTY (honest empty; feed uses Hot/Top/New before empty; personas never count as human activity) — ⚠️ that governor is Wave 7 (Open Question).

## Component library maturity note
- ⚠️ tabs has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ badge has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ dialog has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ skeleton has zero production usage — expect possible integration friction, report don't silently patch.
- ⚠️ empty-state has zero production usage — expect possible integration friction, report don't silently patch.
- Production-proven, no warning needed: button, card, avatar, toast.
---
