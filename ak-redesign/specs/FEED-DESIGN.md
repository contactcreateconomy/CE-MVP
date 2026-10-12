---
id: FEED-DESIGN
type: LIVING SPEC (feed page — design, system, admin, build plan)
author: Claude (PM / council), session 3
date: 2026-10-04
status: ACTIVE — single source of truth for the feed page
supersedes: FEED-REDESIGN-FIRESTARTER §5–§8 (its §1–§4 history stays valid)
read_with: CEY-VISION.md · PM-HANDOFF-S2.md · STYLE-KIT.md · module sheets M1–M18 (foundation, not bible)
---

# Createconomy Feed — Design & Build Spec (living)

## 0. How to use this document
- This is the **living doc** for everything about the feed. Every decision has an ID (L = locked, P = provisional, E = experiment, O = open, R = rejected, K = parked).
- **Change rule:** new decision → add a row to §2 with reason + date; changed decision → amend the row (never delete), note "amended by L-xx". Add one line to §17 Change log.
- Module sheets remain the foundation. Where this doc and a module disagree, **this doc wins for the feed** and the module gets a note.
- Builders (Opus/GLM) read §1–§13 for *what*, §16 for *how to build*. Reviewers (Grok) check against §2 IDs.

---

## 1. North star and the organism

**North star question:** "Would this make a user say: *this place understands what I need, and I discovered something I wouldn't have found elsewhere*?"

**What the feed is (L-04):** a loop that turns **attention into evidence, and evidence into fair distribution.** It is also the evidence engine for the influence report card (CEY-VISION).

**Two loops joined at one hinge:**
```
READER:   arrive → scent → open → gain → REACT/SAVE → return
                                          ║ (same act)
CREATOR:  publish → fair first look → FEEDBACK (seen, valued) → recognition → publish again
```
A reader's Valuable *is* the creator's "I was seen". Most design energy belongs at the hinge (the card's reaction moment and the author's feedback moment).

**Three reasons a nerd stays** (every widget must make at least one visible):
1. **I get seen** — fair first look for new posts.
2. **My work compounds** — visible recognition (Level, Rising, Podium, Earned topics).
3. **I find signal here** — knowledge at a glance (facets, community answers, scores).

**Objective (L-11):** maximize **useful outcomes per attention-minute** under a fairness floor. Useful outcome = legitimate Valuable, accepted answer, save followed by return, a reply that gets valued, tool click-through. Not time-on-site.

**Spine principles (govern every decision):**
1. **Solid while reading, fluid between moments.** Nothing reorders under the user's eyes.
2. **You change instantly; others change only through aggregated projections.**
3. **A widget morphs only when it has real data to show** (data sufficiency gate).
4. **Invisible by default, explainable on demand** ("Why am I seeing this?").
5. **The hinge first:** reacting must feel worth it to both sides.
6. **Every pixel expresses a projection or produces a signal** — otherwise it goes.
7. **Feeds end:** "caught up", not an infinite slot machine.
8. **Manual gates bypass, never bend:** switch off or label-pin; never adjust ranking by hand.

**Architecture in one picture (L-05, L-06):**
```
action → event {who, what, where shown, position, why shown, lens, ranking version, variant}
   ├─ instant, you only   → session state (seen, ignored, hidden)
   ├─ minutes, everyone   → MOMENTUM projection (Hot, Vibing, "rising")
   └─ days, everyone      → QUALITY / RECOGNITION projections (Top, Hero auto-fill, Podium, Level, affinity)
                                ↓
            widgets = query(projection, lens) — re-read at the next boundary
```
The **lens** = subject (all / type / tool / topic) × time (New·24H / Hot·7D / Top·1M) × viewer (visitor / member / author, Fav = "you"). It is the only shared state; no widget talks to another.

**Five layers:** Observe → Interpret → Decide → Express → Learn (→ Observe).

---

## 2. Decision register

### 2.1 Locked
| ID | Decision | Type | Notes |
|---|---|---|---|
| L-01 | MVP 1 personalization = session memory + light topic affinity from explicit actions, shrunk toward global; log everything Phase 2 needs | C | |
| L-02 | Feed gates + feed health ship *with* the feed; rest of admin stays in S14 | B | |
| L-03 | Build prompts include backend; Opus writes, the dev reviews + deploys | B | confirm with dev before build |
| L-04 | Organism = attention → evidence → fair distribution; two loops, one hinge | C | |
| L-05 | One bus: widgets read only the lens + their own projection | B | |
| L-06 | Three propagation speeds; you instantly, others via projections | C | |
| L-07 | Sorter = page time axis: **New·24H · Hot·7D · Top·1M**; Podium/Vibing/Hero follow; windows NOT printed on tabs — desktop hover note, mobile first-use tooltip; labels read from config | B | amended (symmetry) |
| L-08 | Top window 7D → 30D so the label is true | B | |
| L-09 | Fav = 4th tab, the "you" view (saved + joined), ordered by fresh activity | A | amended by L-44 |
| L-10 | (superseded by L-23) lens subjects = types + tools | C | |
| L-11 | Objective = useful outcomes per attention-minute under a fairness floor | C | |
| L-12 | Event envelope adds: **why shown** (organic · exploration · pinned · featured · hero_autofill · editorial), **lens**, **ranking version**, **variant stamp** | C | |
| L-13 | Qualified exposure = ≥50% visible ≥1s, once per post per session | C | |
| L-14 | Log feed controls (hide, see fewer, mute, caught-up reached, return after caught-up). Never log scroll/hover/mouse/replay. "Ignored" and scroll depth are derived | B | |
| L-14a | One intentional **reveal** event (hover ≥500ms or tap on an indicator) | B | needed to judge the depth layer |
| L-15 | Only high-confidence signal combinations reach others' feeds | C | |
| L-16 | Public: Valuable (hidden at 0), discussing + faces, facets, life stage, Level. Author-only: views, saves. Never: negatives, scores, legitimacy, weights. Why-shown on demand | B | |
| L-17 | **Two engines:** Momentum (speed) → Hot, Vibing, rising; Quality (distance) → Top, Hero auto-fill, established/evergreen. Podium reads M12 Recognition | C | "Hot is speed, Top is distance" |
| L-18 | Exploration slots in Hot (~1 in 8, shown as "new") and New; per-author daily exploration cap | B | |
| L-19 | Caught up = since your last visit (not "all 24h") | B | |
| L-20 | Life stage = projection field; thin-lens fallback; diversity type-cap off under a type lens; anti-bubble cross-injection parked | B | |
| L-21 | Admin gets global dials (audited), never per-post rank | B | |
| L-22 | Profile completion meter where every gap names its payoff | A | overrides M7 "no bar"; onboarding screens |
| L-23 | One shared topic taxonomy (20–30 topics, year one: AI · creator business · tech) across interests, posts, tools. Lens subjects = types + tools + topics | C | unifies M1 categories/tags + M7 interestTaxonomy |
| L-24 | Post topics: author taps 1–3 from AI suggestions; operator can correct | B | |
| L-25 | Topic sources: StellarMap (highest) > search (curiosity, fast decay) > behaviour (slow). **Preferential** (what enters) = StellarMap + search; **sequential** (order) = behaviour. Exploration untouched | C | |
| L-26 | StellarMap private by default; opt-in shareable snapshot; history removable, never fakeable; UI ships with S05 Profile | B | |
| L-27 | Earned layer: threshold + "emerging"; feeds Help routing only, never boosts own reach | B | |
| L-28 | **Top Personas** = one Podium dimension, ranked only by human interaction with them; personas never in human dimensions | B | |
| L-29 | Debate: vote first, then the split appears (feed, hero, everywhere) | B | herding evidence |
| L-30 | Featured: 20% random holdout; engines score outcomes **per exposure, split by why shown**; max 1 Featured in Hero + 1 in Vibing; never in Podium; always labelled | C | future monetization data |
| L-31 | Hero = trailer: no auto-rotate, ≤5 frames, 6 kinds, tease → reveal once in frame 1 | B | |
| L-32 | Podium dimension registry; full leaderboard page; users pin up to 3 dimensions; MVP defaults by lens | B | |
| L-33 | Card "why care now" line morphs by life stage; relationship beats life stage | B | |
| L-34 | Start Discussion: one job, no morph, expands into the publisher on click. Vibing: no morph | A | |
| L-35 | "Updated" marker when a post is revised after reactions | A | |
| L-36 | Persona avatars: illustrated, clearly non-human, English pet names; allowed in faces rows | A | check M8 naming |
| L-37 | Binary choices weigh equally; colour only after the choice | A | user testing |
| L-38 | Glow on hover/press only, never at rest (except glow/active + focus). CTA arrow pulses 3× after reveal, then rests | A | amends D-007 |
| L-39 | Uniform frost language: real backdrop blur on chrome, hero, rail widgets, sheets; feed cards get the frost *look* without live blur | B | amends D-007; perf on mid Android |
| L-40 | Hero frame ≤3 text lines; side frames dim + scale, never blur; **neutral frost, no colour bleed** | A | amended after test 2 |
| L-41 | Real photos for covers + human avatars; personas illustrated | A | |
| L-42 | Dark-mode logo variant with gaps widened ~15% (irradiation) | A | |
| L-43 | Hero large = v2 centred cover-flow with text overlaid on the active card; compact = v2 cascade; lens header = slim band | A | compact + lens approved |
| L-44 | Sorter: 4 equal tabs, no divider; Fav differs only by its glow | A | |
| L-45 | Vibing = v2 layout; rotation sequential (out, then in), never overlapping; no progress line; pause on hover/focus | A | |
| L-46 | Morph grammar (§7): 5 triggers, 6 rules | B | |
| L-47 | Fav glow: steady soft glow in the letters on new *human* activity on saved/joined posts; clears on open; no pulse | A | |
| L-48 | Featured: publisher drafts, founder approves; labelled + holdout-measured | B | |
| L-49 | Support gets per-user Explain at launch (masked, reasoned, audited) | B | |
| L-50 | Admin console is built from M15's kit; no Make prototype | A | |
| L-51 | Canonical display layer = s02 `feed-*` components (`feed-page-view`, `feed-card`, `feed-hero-carousel`, `feed-tabs`, `feed-left-nav`, `feed-rail`, `feed-avatar`, `feed-display-types`, `feed-post-type-meta`). Retire `post-card`, `post-interaction-row`, `comments-preview-cycler`, `post-actions-menu` (B5); `trend-sorter` → `feed-tabs` (B6); `top-post-hero-carousel` + `layout/top-post-hero-section` → `feed-hero-carousel` (B7) | B | FEED-GAP F-1 |
| L-52 | New = `publishedAt` inside the config window (24H); Hot/Top candidates bounded by their windows (7D/30D) | B | FEED-GAP F-3; additive index |
| L-53 | Editorial posts never enter organic ranking; they appear only as labelled placements (hero, pinned) | B | FEED-GAP F-4 |
| L-54 | D-14 = the BETA-SWITCH removal (demo world deleted before beta) is the exclusion switch; no read-time filter. Base seed + admin fixtures must also be covered by removal (register them) | B | FEED-GAP F-5; prod is loopback-guarded |
| L-55 | Post saves get a `toggleSavePost` mutation in B2 | B | FEED-GAP F-7 |
| L-56 | Every Opus session queries the code graph via a committed helper (`scripts/graph-explain.mjs`) plus a generated table-access index (`graphify-out/tables.json`: which functions read/write each table); GLM regenerates both locally after every merged phase | B | graph indexes functions only |
| L-57 | AI persona posts appear in organic sorts: labelled, ranked only by human reactions, max 1 per page, never in exploration slots | B | closes O-11 |
| L-58 | Dev reviews only at the end (security audit, final code review, prod deploy). Until then backend branches are gated by Grok review + RED/GREEN + additive-only, each with a CR-RESPONSE note so the final review is fast | B | closes O-03; amends L-03 |
| L-59 | **Gravity** replaces "Valuable": a reader gives Gravity to a post or a comment (one per member per item, legitimacy-weighted, never counted from personas/staff). Lucide `Orbit` icon; tap = a particle falls into the orb, the ring tightens once, count ticks (one celebrate glow, dark only); reduced motion = fill only. Final look judged in the lab (B5) | B | closes O-10 |
| L-60 | Two layers: **public Gravity** starts at 0 and never drops because of others; **hidden mass** (internal only) = per-post prior (type rubric: structure, specificity, completeness + originality as a near-duplicate test, plain code, no AI scoring) updated by evidence (Gravity, saves, returns, type outcomes; quick-exit patterns and hides can lower it). Topic scarcity/momentum used for routing only. Never in the prior: author reach, Level, demography | C | Quality engine input |
| L-61 | **Author flux** (author-only): the author sees how their post's Gravity and reach moved over time with plain-language causes, plus a structure checklist for their post type. Never the hidden mass number or weights (Goodhart). Card: author line "412 saw · 18G ↗" → tap opens the flux panel | B | needs B2 buckets/exposure |
| L-62 | Gravity is written as a unit, never the word: **"18G"** (Geist Mono, capital G). Full digits up to 9,999 ("1,240G"); above that "12.4K G" with a thin space so it never reads as kilograms. Button = Orbit icon; tooltip "Add Gravity" | A | amends L-59 copy |
| L-63 | **G-switch** replaces the Orbit icon: at rest a "G" mark; once the viewer has added Gravity in any way, a capsule slides in from the left and docks into the G (switch "on" — "you've slid into this post"), echoing the logo geometry. Tap G = appreciate (like). Comment, save or a qualified share also slide it on. Tooltip/SR names why ("You appreciated and saved this"). Reduced motion: instant state | B | amends L-59 icon |
| L-64 | Interactions: appreciate (tap G) · Not for me (in ⋯, private) · save · share · comment. **Public numbers on card and post: only G and Strings.** Gravity = legitimacy-weighted sum of positive interactions, each member counted at most once per kind: appreciate 1 · save 3 · qualified share 2 (counts only when someone arrives via the link) · comment 1 per distinct human (not per comment). Not-for-me never adds or subtracts publicly; it feeds hidden mass only. Personas/staff weigh 0 | C | Quality engine input; weights in config |
| L-65 | **Strings** = comments (threads are made of strings). Card shows "24 strings"; empty = "No strings attached · start one" | A | |
| L-66 | Author-only breakdown (appreciations, saves, shares, strings, not-for-me, reach) inside author flux; **no switch to make it public** (keeps G the single public currency, avoids vanity/farming). Precedent: YouTube hid public dislikes in 2021 but creators still see them | B | extends L-16, L-61 |
| L-67 | Theme switch candidates: **Iris** = new theme opens as a circle from the toggle; **Horizon** = dark falls from the top (dusk), light rises from the bottom (dawn); 500ms, reduced motion = 200ms crossfade. **Founder picked Iris** (2026-10-12) | A | B1; closes O-04 |
| L-68 | Founder confirmed frosted glass for the shell: B6 moves the shell from `glass-*` to `frost-*` and retires `glass-*` (one glass family, no saturate bleed) | A | B1 |
| L-69 | L-38 supersedes S00-SPEC §8: the mobile Create tab has no glow at rest | A | B1 |
| L-70 | Sorter active pill = solid brand, **no glow** (§9.4 wins over glow/active), so Fav's glow (L-47) stays the only glow on the sorter and keeps its meaning | A | B1 |
| L-71 | **DESIGN-BIBLE.md is the design foundation.** Precedence: CEY-VISION > DESIGN-BIBLE > screen specs > STYLE-KIT tokens. Every spec, prompt and review cites the bible section it follows | B | 2026-10-12 |
| L-72 | Taps are critically damped: `feedback` spring damping raised so it does not overshoot (ratio ≈1.0); springs may be expressed as `{bounce, duration}`. Bounce (≈0.8 ratio) only when a gesture carried momentum | A | Bible §9.3 |

### 2.2 Provisional / experiments
| ID | Item | How we validate |
|---|---|---|
| P-01 | First principles: content life stage, session end, data sufficiency gate, exposure as a primitive | detailed per build phase |
| P-02 | Cover: right thumbnail (desktop); mobile right thumbnail vs full width | founder in browser |
| P-03 | Card height ≤ ~⅓ of a 390 screen (2–3 cards visible) | founder in browser |
| P-04 | Gem icon for Valuable | founder in browser |
| E-01 | Exploration rate + taper; exploration share in Hot | demo sim + beta |
| E-02 | Affinity strength; Hot gravity | beta |
| E-03 | Depth layer kill criteria: reveal on <2% of exposures **and** no downstream lift → simplify | beta |
| E-04 | Hero kinds compared by useful outcomes per exposure | beta |
| E-05 | "First look · be one of the first" invite increases early engagement | beta |

### 2.3 Rejected (do not reopen without new evidence)
| ID | Rejected | Why |
|---|---|---|
| R-01 | Solid/Flow toggle | replaced by the timing rule (principle 1) |
| R-02 | Start Discussion morphing on card hover | peripheral motion = noise |
| R-03 | Hover-only information | invisible on phones; every hover depth has a tap twin |
| R-04 | Posts as a Podium dimension | that's Top·1M |
| R-05 | Ambient picture colour in the hero frost | read as "movie site", less robust |
| R-06 | Auto-rotating hero | ~1% carousel engagement; accessibility |
| R-07 | Blur on waiting hero slides | reads as unbuilt |
| R-08 | Glow at rest on CTAs | "screaming"; glow = feedback |
| R-09 | Fav divider | breaks symmetry |
| R-10 | Opaque points ("46,887 pts") | replaced by what the person did + Level |
| R-11 | Showing the debate split before voting | herding |
| R-12 | Public view counts / save counts | cold-start shame; save-farming |
| R-13 | Hand-placing anyone on Podium or hand-picking exploration / running comments | firewall |

### 2.4 Parked
K-01 free-form topics beyond the taxonomy · K-02 follows (CR-007) · K-03 anti-bubble cross-injection · K-04 affiliate-store ranking dimension (data gate + money in recognition) · K-05 "Top poster" (folded into Overall) · K-06 StellarMap constellation visual (after S05 v1) · K-07 explicit income ask (M7 Phase 2) · K-08 Launch Pad + Gigs (until ~1,000 DAU) · K-09 per-user personalization beyond L-01 (Phase 2, on the logged data).

---

## 3. People we design for (behavioural scenarios)
| Person | Says | Feed response |
|---|---|---|
| New visitor | "What is this site?" | Lands on **Hot**; hero large (everything is new); facets show knowledge at a glance |
| Returning member | "What changed?" | Discover counts "new since last visit"; caught-up divider; Fav glow |
| Cold-start creator | "Why is nobody seeing my work?" | Guaranteed first look (New + Hot exploration), relevant first audience (topic match), "First look" invite on the card, author-only reach line |
| Power creator | "How do I get more distribution?" | Useful outcomes per exposure is the only lever; Earned topics route questions to them |
| Skeptic | "Why am I seeing this?" | ⋯ → plain-language reasons → "see less" in one tap |
| Overwhelmed | "Too much happening" | One focus at a time; nothing moves outside focus; feeds end |
| Goal-driven | "I came for something specific" | Search (high-intent signal), Discover drill-down, tool lens |
| Distracted (2 min) | "Quick" | Facets + why-care line make the value scannable without opening |

**Day-one test:** at 50 users exploration dominates, Top·1M is nearly everything, Hot is quiet — honest and fine if life-stage labels read "young and alive". Demo world (actual: 517 members / 1,560 posts / ~15k comments / ~30k reactions; snapshot 2026-10-11, 133 MB) is the simulation bed; it proves mechanics, fairness math, latency, gaming resistance — **never human psychology**.

---

## 4. Signals

### 4.1 Already in the modules (do not re-invent)
M16 `rawEvents` envelope (surface, placement, position, session, sequence, persona/staff flags) · M6 reactions (Valuable, hidden negative + private reason, save) · M12 outcome values + legitimacy + reciprocity sweep · M7 interest inference (decayed, integrity-eligible) · M14 `sinceLastVisit`, onboarding events.

### 4.2 Added by this spec
L-12 envelope fields · L-13 qualified exposure · L-14 feed controls · L-14a reveal · search → topic signal (L-25) · Fav activity · caught-up reached/return.

### 4.3 Grammar (meaning comes from combinations)
| Combination | Likely meaning | Confidence | Reaches |
|---|---|---|---|
| Exposed, no action, 3+ sessions | not for me | medium | your feed only (soft demote, decays) |
| Open → exit <10s | mismatch / bait | low alone; high as a pattern on a post | post quality (aggregated) |
| Open → read → Valuable/save | real value | high | everything, at its speed |
| Save → return to it | utility | very high | Top, affinity, report card |
| Search → open → save | intent satisfied | very high | search quality, affinity |
| See fewer / hide | explicit no | certain for you, weak for the post | you instantly; post only when many do |
| Same subject picked repeatedly | active interest | high, short-lived | session + affinity |

### 4.4 Visibility policy (L-16)
Public: Valuable (hidden at 0), discussing + 3 faces, facets, life stage, Level, Updated. Author-only: views (exposures), saves. Never: negative reactions/reasons, scores, legitimacy, weights. On demand: why shown.

---

## 5. Algorithm

### 5.1 Two engines (L-17)
| Engine | Measures | Feeds |
|---|---|---|
| **Momentum** — legitimacy-weighted rate of change vs the post's own baseline | speed | Hot·7D, Vibing, "rising" |
| **Quality** — Bayesian-damped Valuable/save/reply/return, per-type normalized | distance | Top·1M, Hero auto-fill, "established/evergreen" |
| (M12 Recognition) | people | Podium, Level, Earned |
Both engines score **outcomes per exposure, split by why shown** (L-30), so promotion never leaks into organic rank.

### 5.2 Sorts
| Sort | Candidates | Order | Ending |
|---|---|---|---|
| New·24H | posted last 24h | newest + exploration slots | "Caught up since your last visit" |
| Hot·7D | eligible human activity in last 7D | momentum; quality floor blocks comment-farming; exploration ~1 in 8 | bounded pages |
| Top·1M | interactions in last 30D (evergreen stays while used) | damped quality, per-type normalized | bounded pages |
| Fav | saved + joined | newest activity | "Nothing new in your favs" |
Visitors land on Hot. Fav for visitors → sign-in invitation.

### 5.3 Rules (KEEP from M9 unless noted)
Legitimacy weighting · integrity multiplier · personas/staff = 0 · firewall · quality floor in Hot · activity-tick aging · exposure-deficit exploration with launch-high taper (E-01) · no reorder while reading · per-type normalization · diversity rules (type-cap off under a type lens) · per-author exploration cap (new) · light affinity rerank within top candidates, members only, page boundaries, shrunk to global until ≥3 events across ≥2 sessions; explicit StellarMap/interest picks count from first visit (L-01, L-25).

### 5.4 Life stage (projection field)
new → building → rising → hot → established → evergreen → resurfacing. Computed from the two engines; carries its "why" numbers (e.g. "14 valued in 3h").

### 5.5 Data sufficiency fallback
A lens/window too thin to fill a page shows what exists, then "That's all in Debate · here's all of Createconomy". Same for Vibing ("Quiet in Debate today") and Podium ("Forming · needs 25 contributors (12 so far)").

### 5.6 Gaming check
| Attack | Defence |
|---|---|
| Ring bursts Valuables to fake Hot | ≥3 distinct legitimate humans · legitimacy weights · M12 reciprocity sweep · velocity spike → review, not reward |
| "Controversy gets Hot" | comments alone don't count; quality floor needs Valuables; Debate "disagree" never counts as quality |
| Spark spam to farm exploration | queue prefers low-recent-exposure authors + per-author daily cap |
| Promotion leaking into organic | per-exposure scoring split by why shown |
| Persona inflation | personas weigh 0 in human rankings; own dimension ranked by human reactions only |

---

## 6. Topics, StellarMap, Earned
- **One taxonomy (L-23)** shared by interests, post topics, tool tags. 20–30 curated topics, versioned (M7 migration rules).
- **Post topics (L-24):** author taps 1–3 from AI suggestions (M2 reads post + tools); operator corrects.
- **Sources (L-25):** StellarMap (explicit, no decay until edited) > search (curiosity, decays in days; promoted to the map only after open → save/Valuable) > behaviour (slow, thresholded).
- **Preferential vs sequential:** what enters your feed (dialled per topic: more / less / hide) comes from StellarMap + search; the order inside the page comes from behaviour. Exploration is never dialled away.
- **StellarMap (profile, S05):** private by default; two layers — **Explored** (what you consumed; removable, never fakeable) and **Earned** (topics where others valued your work; threshold + "emerging"; first crossing = "You earned your first star in Agents"). Opt-in shareable snapshot. External validation: Instagram "Your Algorithm" (Dec 2025) and TikTok "Manage Topics" — our differentiators are history, the map form, search as a source, and the Earned layer (= report card per topic).
- **Feed tie-ins:** why-shown can say "Because Agents is on your StellarMap" + "See less"; Earned routes unanswered Help to experts (card relationship line), never boosts the expert's own reach.
- **Completion (L-22):** meter where each gap names its payoff ("Add tools you use → see reviews from people who use them").

---

## 7. Morph grammar (L-46)
**Triggers (only these):** 1 lens · 2 scroll position · 3 data state (forming / quiet / live) · 4 viewer (visitor / member / author) · 5 moment (new since last visit, Featured, first-use tooltip).

**Rules:**
1. Same family, different depth — a morph never changes what the thing *is*.
2. User-caused morphs animate instantly; system-caused morphs wait for a boundary.
3. Deterministic — same inputs, same state (admin can reproduce any screen).
4. Hover adds depth, never layout.
5. Every hover depth has a tap twin on mobile.
6. Nothing animates outside the user's point of focus.

**Where morphs live:** card why-care line (life stage / relationship) · debate vote-to-reveal · Discover drill-down · hero states · Podium dimensions · Fav glow · lens chip. **No morph:** Start Discussion, Vibing, sorter labels.

---

## 8. Page layout and real estate
| Slot | Desktop (≥1024) | Mobile (390) |
|---|---|---|
| Menu bar | floating frosted island, sticky, container width | frosted island top bar |
| Hero | full container width above columns | none (D-017); compact lens header when a subject is active |
| Start Discussion | left rail top | centre Create in tab bar |
| Discover | left rail card | horizontal chip row under the top bar (+ sub-chip row) |
| Sorter | centre column top | sticky under the top island |
| Feed | centre column | single column |
| Vibing | right rail top | one-line ticker under the sorter |
| Podium | right rail | in-feed card after the 5th post |
| Tab bar | — | full-width frosted: Home · Search · Create · Alerts · Profile |
Proportions follow the founder's v2 (centred container ~1000px: left ~170, centre fluid ~530, right ~226, gaps ~22) — v2 wins over STYLE-KIT's 240/320 rails. Background: canvas + faint dot grid (approved).

---

## 9. Widgets (each: job · states · lens · manual · kill · edge cases · analytics)

### 9.1 Menu bar
- **Job:** orientation + entry points. **States:** visitor (Login) / member (avatar menu); bell unread dot; search focus (widens, recent searches); subject chip ("Review ×") when a lens is active; announcement strip above the island (admin).
- **Manual:** announcement strip, pinned search suggestions. **Analytics:** zero-result searches, search → open → save.

### 9.2 Hero (desktop) — the trailer (L-31, L-40, L-43)
- **Job:** a trailer for what's best right now.
- **States:** **Large** (v2 centred cover-flow; used when something is new for this viewer since last visit) · **Compact** (v2 cascade; nothing new; user-toggleable; never changes on scroll) · **Lens header** (slim band: subject icon + name + 3 live numbers + its top item) · Loading (skeleton) · Absent (no frames or killed → page starts at columns).
- **Frames:** 1–5, user-advanced (arrows, ← →, trackpad with wheel lockout), counter "2 / 5". Frame 1 plays tease → reveal once per session.
- **Six kinds (≤3 text lines each):** Post · Live debate (equal-weight Agree/Disagree; split only after vote) · Tool (score counts up once; pricing) · Topic surge ("Agents +340% this week", sparkline draws once) · Milestone (earned only) · **Community answer** (flagship: question + "214 creators weighed in" → the discussion map lives behind the button; only exists where real discussion exists).
- **Labels (always):** "Community top" (earned) · "Picked by Createconomy" (editorial) · "Featured" (promoted; max 1; border/active frame).
- **Layout rules:** large = text overlaid on the active card's bottom; split layouts = text block shares the picture's top and bottom edges. Side frames: scale ~0.8, brightness ~0.45, slight 3D turn, **no blur**. Neutral frost, no colour bleed. CTA: no glow at rest; ↗ pulses 3× after reveal; glow on hover.
- **Manual:** frame count, kinds on/off, schedule, Featured frame (founder-approved), kill item, pause auto-fill. **Kill:** off → page starts at columns.
- **Edge cases:** community answer misreads thread → kill item/kind · auto-filled post later moderated → auto-removed · sensitive world event → pause hero · Featured gets reports → auto-pulled.
- **Analytics:** exposure per frame (kind, position, why shown) · reveal · advance · open · useful outcomes per exposure by kind · Featured lift (holdout).

### 9.3 Start Discussion (L-34)
- **Job:** one — start. Static "+ Start Discussion". Hover: glow/cta (dark) + 1px lift. **Click: the pill expands into the publisher** (shared-element, glide spring); close reverses. Visitor → same sheet with sign-in. Mobile: centre Create grows into a bottom sheet.
- **Manual:** post types on/off in publisher, campaign prompt. **Analytics:** start vs finish per type and subject.

### 9.4 Sorter + Fav (L-07, L-44, L-47)
- Four equal tabs Top · Hot · New · Fav; v2 sliding pill, solid brand, **no glow at rest**. Windows via hover note (desktop, 400ms) / first-use tooltip (mobile, once per tab): "Top · best of the last month", "Hot · accelerating this week", "New · last 24 hours", "Fav · new activity on what you saved or joined".
- **Fav glow:** steady soft glow in the letters on new human activity (replies to you, replies in joined threads, your question answered, a debate you voted in flipping); no own/persona-only activity; clears on open; SR text "Fav, new activity".
- Visitor taps Fav → popover "Sign in to keep your favourites". Mobile sorter docks under the top island.
- **Manual:** default tab per viewer type, disable a sort (fallback Top). **Analytics:** sort picks, outcomes per sort, glow → open.

### 9.5 What's Vibing (L-45)
- **Job:** "what is moving right now" (momentum engine). v2 layout: outer frosted card, inner card with context line ("Trending in Review"), semibold hook ≤3 lines grounded in real numbers, meta row ("1,189 ENGAGED ↗") at the bottom; fixed inner height.
- Rotates every 6s, **sequential** (out: fade + soft blur 180ms; in: focus pull context → hook → meta). Pause on hover/focus/touch; pause button on hover/focus only (WCAG 2.2.2).
- Quiet fallback under a thin lens; Featured hook (max 1, labelled). Mobile: one-line ticker, same sequence.
- **Manual:** Featured hook, kill item, tone balance, per-topic cap. **Kill:** rail starts at Podium. **Edge:** wrong AI hook → kill; ring momentum → hold; topic flood → cap. **Analytics:** exposure, clicks, outcomes per hook.

### 9.6 Discover
- Frosted rail card "DISCOVER": All · Spark · News · Review · Compare · Debate · Help · List · Showcase, then "Your topics" (5, from interests/StellarMap order). Mono counts of new since last visit (none at 0). Launch Pad + Gigs hidden (K-08).
- **Drill-down:** choosing a subject sets the lens (menu chip + hero lens header + widgets) and the rail morphs one level deeper: "‹ All", subject title, sub-map (Review → tools reviewed this week; topic → related topics by co-occurrence). Mobile: chosen chip expands a sub-chip row.
- **Manual:** lock/unlock types/topics, order, labels; topics with <5 posts auto-hidden. **Analytics:** subject picks, drill depth, outcomes per subject.

### 9.7 Podium (L-28, L-32)
- **Job:** recognition of people and contributions. Window follows the sorter ("Podium · this week"). Header dimension picker ("Top helpers ▾").
- **MVP dimensions:** Overall · Top commenters · Top helpers · Top reviewers · Top solutions (answer excerpts) · Rising · Top tools (community ★) · Top AI personas (ranked by human reactions). Lens picks the default (Review → reviewers, Help → helpers).
- **Rows (5):** rank mark (crowns 1–3) · avatar · name · **what they did** ("38 answers valued") · Level name. Member: pinned "You · #14 · 3 valued from the top 10". Forming state under minimum count.
- **Profile peek** (frosted): Level, top Earned topics, 3 recent valued contributions, View profile. **Expand ↗ → Leaderboard page:** dimension × time window (24H / 7D / 1M explicit here), top 50, "Add to my Podium" (max 3 pinned). Mobile: in-feed card with dimension chips + top 3.
- **Manual (full, minus insertion):** dimension on/off, freeze (serve last good), hold person/persona/tool in review, exclude with reason, opt-out from public ranking. Never hand-place.
- **Edge:** collusion → auto-hold · suspended/deleted → removed · staff excluded · ties shown as tied · legal complaint → hold. **Analytics:** exposure per dimension, peeks, pins/unpins, leaderboard picks.

### 9.8 Page states (centre)
New-posts pill ("12 new posts ↑", content never jumps in) · caught-up divider · thin-subject fallback · loading skeletons (first load + pagination only; no animation while scrolling) · offline banner · safe mode (chronological) invisible to users except ordering.

---

## 10. Card information architecture

### 10.1 Skeleton (every type)
1. **Identity:** avatar · name · Level icon · label ("AI persona" illustrated / "Createconomy" editorial) · time · Updated · ⋯
2. **Kind chip:** "Review · Agents" (type + main topic; both tappable into the lens)
3. **Title** (Spark: the statement is the title, larger)
4. **Facet** (per type)
5. **Why-care-now line** (one fixed-height line)
6. **Footer:** G-switch + "18G" (hidden at 0) · "24 strings" · Save · Share — right: 3 faces (L-63–L-65)
Optional cover: real photo, right thumbnail desktop (P-02 for mobile). Surface: frost look without live blur (L-39). Height target ≤ ~⅓ of 390 without cover (P-03).

### 10.2 Facets (from M4 fields)
| Type | Facet | Trust | Economic | Inline action |
|---|---|---|---|---|
| Review | tool chip · author ★ · 1 pro / 1 con | community ★ (M5) beside author's | pricing ("$20/mo") | — |
| Compare | 2–4 tool chips + the most-different grid row | community ★ per tool (no numbers in the compare, INV-5) | pricing per tool | — |
| Debate | proposition · "214 voted" | — | — | Agree / Disagree (equal) → split |
| Help | problem · Open / Resolved ✓ by @x | resolved status | — | Answer → thread, composer open |
| List | top 3 items + votes · "+12 more" · mode | — | — | — |
| Showcase | the thing | approved link ✓ | — | — |
| News | strongest key claim | source domain (platform-injected) | — | — |
| Spark | — (statement is the title) | — | — | — |
AI one-liner only where the facet is thin (Showcase, long News), labelled; never on Debate or Spark.

### 10.3 Why-care-now line (L-33; relationship beats life stage)
New "First look · be one of the first to weigh in" · Rising "↗ Rising · 14 valued in the last 3h" · Established = best human comment (tap expands to 3 lines in place) · Evergreen "Still valued 3 months later" · Resurfacing "Back in discussion · 9 new replies" · You commented "3 replies since you left" · Author "412 saw this · 18 valued · 3 saved" · Expert "Unanswered · in your topic".

### 10.4 Interactions
Desktop hover: lift 1px, shadow sm → md, why line reveals detail (no height change) · Valuable: fill + count tick + one glow/celebrate (dark, 600ms, once) · Save: fill · ⋯: Why am I seeing this? (plain-language sheet + "See less of X") · See fewer · Hide · Mute @author · Report · Hide/See fewer collapse to "Hidden · Undo" · Pinned label "Pinned by Createconomy".

### 10.5 Never on the card
Ranking scores, legitimacy, why-shown (except on demand), public views/saves, negative signals, extra topic tags, buy buttons (affiliate links live on tool pages/threads with disclosure, M11 ≤40% cap).

---

## 11. Visual and motion language

### 11.1 Look
- Tokens: STYLE-KIT §2–§9 only (dark default, light ships, D-013). No ad-hoc colour/radius/shadow.
- **Frost (L-39):** real backdrop blur on menu bar, tab bar, hero, rail widgets, sheets (glass/strong for the island; fallbacks to solid). Feed cards: translucent surface (~85%) + 1px top-edge highlight, no live blur. Neutral frost — no colour bleed (L-40).
- **Glow (L-38):** dark only; at rest only glow/active + focus; CTA glow on hover/press; one glow moment on screen at a time; glow/celebrate once on Valuable.
- **Photos (L-41):** real photos for covers and humans; personas illustrated, non-human, pet names (L-36).
- **Logo (L-42):** dark variant with gaps widened ~15%; 3-segment reveal on first load (approved).
- Numbers in Geist Mono. Copy: no internal words in UI (COPY-1).

### 11.2 Motion
Character: elegant, calm, cinematic (Apple-like springs). **Signature = focus pull:** {opacity 0, blur 10px, scale 0.985, y 6px} → sharp; children stagger 50ms.
| Family | When | Spring / duration |
|---|---|---|
| Feedback | presses, toggles | stiffness 520 / damping 34 (≤150ms feel) |
| Transition (settle) | user-caused state changes | 260 / 30 (200–300ms) |
| Reveal (glide) | large surfaces, one-time data reveals | 140 / 22 (400–800ms, once) |
Rules: §1 principles + §7 morph rules; `prefers-reduced-motion` → crossfades only. Skeleton shimmer 1500ms diagonal (approved). Theme switch: variant A "Iris" vs B "Horizon" — founder pick pending (O-04).

### 11.3 Prototype verdicts (Figma Make, 2026-10-04)
Approved: loading screen · dot grid · menu bar island (after fix) · hero compact · hero lens header · debate interaction · overall premium frost language. Fixed after feedback: hero large layout, Vibing layout + rotation, Fav divider, CTA glow, colour bleed, side-slide blur, Agree weighting, logo gap. Round 4 (cards, Discover, Podium) **not prototyped** — founder chose to build directly; the founder judges those in the browser during build.

---

## 12. Admin and observability (L-02, L-21, L-48–L-50)
Plugs into **M15** (shell, widget registry, kill_switch / config_group / monitor widgets, typed config with CAS, STOP, roles, audit, Wiki, `failDirection` on every flag) and **M16** (event catalog, projections, PostHog as exploration lens only, weekly founder review ending in ≤3 owned decisions).

| Surface | Contains | Roles |
|---|---|---|
| Feed control | per-widget on/off · safe mode (chronological) · ranking rollback (pin version) · global dials (exploration rate, gravity, affinity strength) | founder, administrator |
| Placements | hero editorial frames + schedule · Featured (1 hero + 1 Vibing; publisher drafts, founder approves; holdout automatic) · pins · announcement strip · Start Discussion prompts | publisher, editor, founder |
| Podium review | holds, freeze, exclusions, opt-outs, M12 collusion flags | moderator, administrator |
| Feed health | the 5 numbers + per-widget panels | founder, administrator |
| Explain | per post: exposures by why-shown, life stage history, scores over time · per user (support only): masked, reasoned, audited | support_operator, administrator |
| Experiments | variant registry, holdout results, ranking-version comparison | founder |

**Five health numbers:** useful outcomes per active member/week · new-creator first-look rate · exposure concentration (top 10% creators' share) · ignore rate per widget · return after caught-up.
**Per-widget panels:** hero outcomes per exposure by kind/position · Vibing per hook · Podium pins per dimension · outcomes per sort · subject picks + drill depth · Fav glow → open · card outcomes per exposure by type + reveal rate · topic demand vs supply.
**Alerts (in-console intervention banner):** bloodstream stalled (projections stale / counters not moving — highest priority) · first-look rate drop · concentration spike · collusion hold · widget on fallback/forming >24h · Featured anomaly.
**Causality:** every event stamped (L-12); compare variant vs control (holdout) and version N vs N-1 (same weekday window). No "win" without holdout.
**Every flip:** reason + audit + failDirection. Killed widget collapses cleanly (no hole). Admin motion: fade only.
**Privacy:** no per-user browsing views in analytics; StellarMap only as aggregate demand; per-user Explain = support only, audited.
**Cost:** aggregate on write, sample raw exposures, projections for the five numbers.

---

## 13. Backend and data needs (for the dev + build phases)
| # | Need | Source |
|---|---|---|
| D-01 | **CR-013** write `postDistributionBuckets` (Vibing, trend are dead in prod) | firestarter §6 |
| D-02 | **CR-014** write post engagement counters (Top/Hot never move in prod) | firestarter §6 |
| D-03 | CR-010 card payload: covers (`postSeoMeta.ogImageAssetId`), avatars (`users.avatarAssetId`), handles, comment preview + participants, viewer state, raw Valuable, hero summary/image/type, Vibing title/link, Podium links, review stars, debate votes | CR-010 |
| D-04 | Envelope fields L-12 + qualified exposure L-13 + controls L-14 + reveal L-14a | this doc |
| D-05 | Momentum + Quality projections, per exposure split by why-shown; windows from config (24H / 7D / 30D) | L-17, L-30 |
| D-06 | Life stage field + its "why" numbers | §5.4 |
| D-07 | Exploration in Hot + per-author daily cap; ranking version stamp; safe mode; rollback | L-18, §12 |
| D-08 | Caught-up since last visit (reuse M14 `sinceLastVisit`) | L-19 |
| D-09 | Unified topic taxonomy + post topics + tool topics; search → topic signal; light affinity rerank; StellarMap data layer (Explored/Earned) | §6 |
| D-10 | Card payload additions: Level, persona/editorial flag, main topic, per-type facet fields, tool pricing + community score, best human comment, 3 faces + discussing, life stage + why, viewer relation (voted/commented/author/earned), author-only reach | §10 |
| D-11 | Hero slots: kind + lens + label class + holdout; community answer from M6 discussion map | §9.2 |
| D-12 | Podium dimension registry + projections incl. top comments/solutions, tools, personas by human reactions; pins per user | §9.7 |
| D-13 | Fav activity query (human activity on saved/joined since last Fav open) | L-47 |
| D-14 | Demo exclusion = BETA-SWITCH removal covering world + base seed + admin fixtures (L-54) | D-012 |
| D-15 | Feed admin: config keys, kill switches, placements, health projections, explain queries, experiments registry | §12 |

---

## 14. Learnings log (what this session taught us)
- **Start from the organism, not the card.** Cards designed before the spine get redesigned.
- **The founder decides by seeing.** Text can't carry motion or density; a prototype round settles in minutes what text can't settle in hours.
- **Strangers are meticulous.** Two non-TAM testers surfaced 10+ precise issues. Sort feedback into **universal** (alignment, equal-weight choices, unbuilt-looking blur, logo optics, density) — adopt; and **taste** (glow, photos, ambient) — adopt, then recheck with real creators.
- **Big prompts degrade output, even with Opus.** Build in small, verifiable phases (§15).
- **Figma Make credits are a daily budget.** Pace rounds; stop when the feel is learned.
- **Polymorphism ≠ animation.** A slot morphs when the *useful answer* changes (age, relationship), not when the cursor moves.
- **Evidence over taste where evidence exists:** herding (Muchnik et al. 2013), popularity inequality (Salganik et al. 2006), leaderboard demotivation (Hanus & Fox 2015), carousel engagement (~1%), hidden-content discoverability, information foraging (Pirolli & Card).
- **Big apps validated the transparency move** (Instagram "Your Algorithm", TikTok "Manage Topics").
- Testers' meta-comment: "I'd use it if it gives value and the value grows over time" — that is the report-card thesis in a user's words.

---

## 15. Open items
| ID | Item | Owner / when |
|---|---|---|
| O-04 | Theme switch variant (Iris vs Horizon) | founder in browser, B1 |
| O-05 | Gem icon (P-04), mobile cover (P-02), card height (P-03) | founder in browser, B5 |
| O-06 | Taxonomy list (20–30 topics) — founder approves | before B4 |
| O-07 | Exact thresholds: Earned "emerging", Podium minimums, exploration rate/taper, Hot gravity | B3/B10 config + demo sim |
| O-08 | Auth confirmations from firestarter §4 (forgot password, socials, remember me, Terms links) | S01, not feed |
| O-09 | Office laptop `setx DEV_TEST_USER_PASSWORD`; forum tests 973/975 TZ issue (S2 handoff §7) | founder Monday |

---

## 16. Build plan — small phases, Opus does the heavy lifting

### 16.1 Where we start from (build on top, never from scratch)
- **Live route `/feed`:** `CanonicalFeedClient` over `postDistributionScores` + `cardSummaries` with `api.feed.list` (sortMode, typeFilter, cursor), `api.feed.getChrome` (hero/featured/vibing/podium), `api.feed.getWhy`, `api.feed.cardAction` (hide/mute/report), `api.feed.unhide`. Visitors land on Hot. Its card is a plain admin-looking card — to be replaced by the display components.
- **Display components (canonical, L-51):** `apps/forum/src/components/feed/feed-*` (s02 v2 port @ `c77e6d4`): `feed-page-view`, `feed-card`, `feed-hero-carousel`, `feed-tabs`, `feed-left-nav`, `feed-rail`, `feed-avatar`, `feed-display-types`, `feed-post-type-meta`, plus `feed-undo-toast`; lab `/lab/feed` (`?theme=light`, `?state=loading|empty`, `?type=`, `?v=a|b`). Legacy (retire per L-51): `post-card`, `post-interaction-row`, `comments-preview-cycler`, `post-actions-menu`, `trend-sorter`, `top-post-hero-carousel`. Ground truth: `ak-redesign/specs/FEED-GAP.md` (B0).
- **Design reference:** founder v2 in CEMVP (`localhost:3004`), Figma Make prototype (rounds 1–3) screenshots in `ak-redesign/specs/S02-refs/make/` (founder to drop them there).
- **Tokens:** `packages/design-tokens/utilities.css` (glow utilities only here), STYLE-KIT, `globals.css`. Known bug: `cn()` drops custom size tokens → fix via `extendTailwindMerge` (S2 handoff §7.2).
- **Modules:** M9 feed, M6 reactions/discussion map, M12 recognition, M5 tools, M7 profile/interests, M14 sinceLastVisit, M15 admin shell, M16 analytics.

### 16.2 Standing rules (paste once per Opus session; every phase prompt assumes them)
```
STANDING RULES — CREATECONOMY FEED BUILD
Read first: ak-redesign/specs/DESIGN-BIBLE.md (how it must feel),
ak-redesign/specs/FEED-DESIGN.md (the living spec; decision IDs
L-xx are binding), ak-redesign/00-control/STATUS.md, DECISIONS.md,
TEAM-WORKFLOW.md, templates/BUILD.md. Find code with node scripts/graph-explain.mjs <name> and
graphify-out/tables.json (who reads/writes each table) BEFORE reading
files; if either is missing or stale, say so in your report.
1. BUILD ON WHAT EXISTS. Extend the files named in the phase prompt.
   Never create a parallel version of an existing component or query.
   If you think a rewrite is needed, STOP and explain why first.
2. ONE PHASE = ONE BRANCH (feed-bNN-<slug>), small commits, push, no
   merge. Grok reviews every phase; the founder approves in the browser.
3. DISPLAY vs DATA: display components take props, no Convex (D-016).
   Data wiring lives in the page/container. Lab fixtures may show any
   value; product routes show only database rows (D-012).
4. BACKEND (convex/): additive only (v.optional fields, new tables,
   new functions). No destructive migration. Backend work goes on its
   own branch and gets a CR-RESPONSE note for the dev to review (L-03).
5. RED/GREEN: every new check must be shown failing first, then passing
   (templates/BUILD.md). A check that cannot fail = BLOCK.
6. Tokens only (STYLE-KIT). Glow only via utilities.css. COPY-1: no
   internal words in UI. Both themes. 390 and 1440. Reduced motion.
7. Gate per phase: typecheck + lint + forum tests + the phase's new
   tests green. Report honestly: never "pre-existing" or "renders"
   without proof (screenshots at 390 + 1440, dark + light).
8. When the spec is silent or contradicts code, STOP and ask; propose
   the decision as "PROPOSED L-xx" for the PM to record.
9. End every phase with: what changed, files touched, proofs, open
   questions, and the exact lines to append to FEED-DESIGN.md §17.
```

### 16.3 Phases
Order is fixed by dependency: truth → bloodstream → engines → payload → surfaces → admin → simulation → polish. Each prompt below is pasted **after** the standing rules.

**B0 — Ground truth audit (no code)**
```
[FEED-B0][AUDIT] Produce ak-redesign/specs/FEED-GAP.md: for every row of
FEED-DESIGN.md §13 (D-01…D-15) and every widget in §9, state EXISTS /
PARTIAL / MISSING with file paths and function names, and what writes or
reads it in production. Specifically verify: who writes
postDistributionBuckets and engagement counters (CR-013/014); the rawEvents
envelope fields vs L-12/L-13; how cardSummaries and postDistributionScores
are computed; what getChrome returns; whether demo rows are flagged and
excludable. Compare s02-feed-ui display components vs CanonicalFeedClient
and list what each lacks. End with a dependency-ordered risk list. No code.
```

**B1 — Foundations: tokens, frost, glow, motion, logo**
```
[FEED-B1][FOUNDATION] Branch feed-b1-foundation from s02-feed-ui.
1. Fix cn(): extendTailwindMerge with our font-size tokens (RED/GREEN).
2. Frost (L-39): utilities .frost-strong / .frost-subtle (real backdrop
   blur + fallbacks) and .frost-look (no live blur, translucent surface +
   1px top highlight). Glow at rest removed except glow/active + focus
   (L-38).
3. Motion module apps/forum/src/lib/motion.ts: springs feedback/settle/
   glide, focusPull variants, stagger 50ms, reduced-motion fallbacks,
   rules documented at the top (FEED-DESIGN §11.2, §7).
4. Logo: dark-mode mark with ~15% wider gaps (L-42); 3-segment reveal.
5. Theme switch variants Iris / Horizon behind ?v=a|b (O-04).
Lab page /lab/foundation showing all of it. Screenshots dark/light.
```

**B2 — Bloodstream (backend): counters, buckets, exposure**
```
[FEED-B2][BACKEND] Branch feed-b2-bloodstream (backend; dev reviews).
Based on FEED-GAP.md: (1) CR-014 engagement counters written on every
qualifying reaction/comment/save (idempotent, legitimacy-aware per M12);
(2) CR-013 postDistributionBuckets written so momentum exists in prod;
(3) envelope fields L-12 (why shown, lens, rankingVersion, variant) and
qualified exposure L-13 + controls L-14 + reveal L-14a as catalogued
events (M16 eventCatalog); aggregate-on-write counters, raw sampled;
(4) toggleSavePost mutation (L-55); (5) register base seed + admin
fixtures for BETA-SWITCH removal (L-54). Gravity model per L-59/L-60: new
postGravity table (+ comment Gravity = existing reaction, renamed in
UI); hidden-mass prior stub (type rubric) feeding the Quality engine.
Tests: counters move on reactions/comments/saves; buckets fill;
exposure dedup per session; removal leaves zero demo rows anywhere. Write
CR-013/014-RESPONSE.md for the dev.
```

**B3 — Engines and sorts (backend)**
```
[FEED-B3][BACKEND] Branch feed-b3-engines. Implement FEED-DESIGN §5:
Momentum + Quality projections scored per exposure split by why-shown
(L-17, L-30); windows from config (New 24H, Hot 7D, Top 30D — L-07/L-08);
exploration slots in Hot ~1/8 + per-author daily cap (L-18); life stage
field + why numbers (§5.4); caught-up since last visit via M14
sinceLastVisit (L-19); thin-lens fallback flag (§5.5); diversity type-cap
off under a type lens (L-20); rankingVersion stamp; safe-mode
(chronological) and rollback config keys (§12). Extend feed.list, do not
fork it. Tests per rule incl. "Hot ≠ Top" on fixture data and the
gaming cases in §5.6.
```

**B4 — Topics, search signal, affinity (backend)**
```
[FEED-B4][BACKEND] Branch feed-b4-topics. (Founder-approved topic list
first, O-06.) Unify categories/tags/interestTaxonomy into one versioned
topic taxonomy (L-23) with migration notes; post topics 1–3 (field +
AI-suggest action stub using M2; operator correct) (L-24); search →
topic curiosity signal with fast decay (L-25); light affinity rerank
within top candidates for members (L-01) with shrinkage; StellarMap data
layer: Explored (removable) + Earned (threshold, emerging) projections
(L-26, L-27) — no profile UI. Tests incl. erasure removes derived trail.
```

**B5 — Card: payload + display component**
```
[FEED-B5][CARD] Two branches: feed-b5a-card-payload (backend) and
feed-b5b-card-ui. (a) Extend feed.list card payload with D-03 + D-10.
(b) Rebuild the card by EXTENDING components/feed/feed-card.tsx (+
feed-display-types, feed-post-type-meta) to FEED-DESIGN §10, then delete
the retired post-card family (L-51): skeleton rows, 8 facets, why-care line (life stage + relationship),
Gravity (Orbit, hidden at 0, celebrate once, L-59), save, ⋯ menu with
"Why am I seeing this?" sheet (from getWhy, plain language), hide/see
fewer → "Hidden · Undo", debate vote-to-reveal with equal weights,
Updated, persona/editorial labels, pinned label, skeleton. Lab fixtures
for every type × life stage × relationship; ?v=a|b for mobile cover.
Split CanonicalFeedClient: data container + an adapter assembleCard →
FeedCardData; render FeedPageView. Fix refreshCards covering only the
freshest 30 posts (FEED-GAP risk 11).
```

**B6 — Shell, menu bar, sorter, Fav glow, page states**
```
[FEED-B6][SHELL] Branch feed-b6-shell. Page layout §8 (v2 proportions,
dot grid); menu bar island §9.1 (all states, subject chip, announcement
strip); sorter §9.4 extending feed-tabs.tsx (retire trend-sorter, L-51) (equal tabs, hover note /
first-use tooltip from config windows, Fav glow from D-13, visitor
popover, mobile dock); page states §9.8 (new-posts pill, caught-up
divider, thin fallback, skeletons on first load/pagination only); mobile
top island + tab bar. Wire to B3 sorts.
```

**B7 — Hero**
```
[FEED-B7][HERO] Branches feed-b7a-hero-data (hero slots: kind, lens,
label class, holdout, community answer source — D-11) and
feed-b7b-hero-ui EXTENDING feed-hero-carousel.tsx to §9.2 (retire
top-post-hero-carousel + layout/top-post-hero-section, L-51): remove
autoplay (L-31); large = centred cover-flow with overlaid text, side
frames dim/scale no blur (L-43, L-40); compact cascade; lens header;
six kinds ≤3 lines; tease → reveal once; labels; CTA arrow 3 pulses;
absent state. Desktop only; mobile lens header.
```

**B8 — Vibing + Start Discussion**
```
[FEED-B8][RAIL-A] Branch feed-b8-vibing-start. Vibing §9.5 (v2 layout,
sequential rotation, pause, quiet fallback, Featured, mobile ticker) on
the momentum projection. Start Discussion §9.3 (pill expands into the
publisher sheet with the 8 types; visitor sign-in; mobile Create grows
into a bottom sheet). The publisher itself stays the existing composer
entry (S04 owns it).
```

**B9 — Discover + the lens bus**
```
[FEED-B9][LENS] Branch feed-b9-discover-lens. One lens state (subject ×
time × viewer) in the feed container (L-05); every widget reads it.
Discover §9.6: list + Your topics + new-since-last-visit counts +
drill-down sub-maps + mobile chip rows; menu subject chip; hero lens
header; Vibing/Podium follow; data sufficiency fallbacks (§5.5). URL
reflects the lens (?subject=).
```

**B10 — Podium + leaderboard**
```
[FEED-B10][PODIUM] Branches feed-b10a-podium-data (dimension registry
D-12, projections incl. top solutions, tools, personas by human
reactions, pins per user, forming thresholds) and feed-b10b-podium-ui
(§9.7: widget with dimension picker, "what they did" rows, your
standing, forming, profile peek, leaderboard page /leaderboard with
dimension × 24H/7D/1M and "Add to my Podium", mobile in-feed card).
```

**B11 — Feed admin (M15 widgets)**
```
[FEED-B11][ADMIN] Branch feed-b11-admin. Register M15 widgets for §12:
Feed control (kill switches with failDirection, safe mode, rollback,
exclude demo, dials), Placements (hero frames, Featured with founder
approval + holdout, pins, announcement, prompts), Podium review, Feed
health (5 numbers + per-widget panels from projections), Explain
(per post; per user masked + audited for support_operator),
Experiments (variant registry + holdout comparison), alerts §12.
Every flip: reason + audit. Admin motion fade only. Wiki article per
widget (M15 R-WIKI).
```

**B12 — Simulation on the demo world (Phase 8)**
```
[FEED-B12][SIM] Branch feed-b12-sim. Against the demo world: replay
sessions for the §3 personas; measure first-look rate, exposure
concentration, Hot vs Top overlap, fallback frequency per lens at
50/500 active users; run the §5.6 attacks (ring, spam sparks, Featured
leak) and show the defences hold; load-test feed.list p95. Output
FEED-SIM-REPORT.md with proposed threshold values (O-07). Remember:
simulated agents prove mechanics, not psychology.
```

**B13 — Hardening + founder review**
```
[FEED-B13][HARDEN] Branch feed-b13-harden. Accessibility (focus order,
SR labels incl. Fav glow, 44px targets, WCAG 2.2.2 pause), reduced
motion, frost performance on a throttled mid-range Android profile
(no jank while scrolling; fall back to frost-look if needed), COPY-1
test, D-012 test (no invented values on product routes), security
review notes for the dev. Founder walkthrough checklist: every state
in §9–§10 reachable at 390 + 1440, dark + light.
```

### 16.4 Review and approval loop (per phase)
Opus builds → Grok reviews against the decision IDs touched (prompt: "Review branch X against FEED-DESIGN.md L-ids listed in the PR; check D-012, COPY-1, tokens-only, RED/GREEN; list BLOCK/FIX/OK") → founder approves in the browser → PM records decisions → merge order follows §16.3. Max 2 fix loops per phase, then escalate to PM.

---

## 17. Change log
- 2026-10-12 — DESIGN-BIBLE.md v1 adopted (L-71); Iris picked (L-67); frosted shell confirmed (L-68); L-72 feedback spring must not overshoot. Standing rules now read the bible first.
- 2026-10-11 — FEED-B1 foundation (branch feed-b1-foundation, FEED-B1-BUILD.md): cn() knows the 22 font-size tokens; frost-strong/-subtle/-look utilities (neutral, no saturate; frost-look no live blur); glow at rest removed and test-fenced; lib/motion.ts; logo gaps transparent, +15% in dark, 3-segment reveal; theme-switch candidates at /lab/foundation?v=a|b; CanonicalFeedClient hero grid removed (F-2). Recorded L-67…L-70 (L-70: sorter pill no glow). Register order tidied.
- 2026-10-11 — FEED-B0 audit: ak-redesign/specs/FEED-GAP.md. Prod has no writer for post counters (CR-014), day buckets (CR-013), post saves or exposure events → Top/Hot/Vibing/Rising/Fav/exploration flat in prod. Recorded L-51…L-66 (Gravity L-59–L-66: G-switch, Strings, author-only breakdown) (persona posts L-57, dev-at-the-end L-58); opened O-10 (post-level Valuable), O-11 (persona posts in organic). Amended §16 file names, B2/B5/B6/B7 prompts, standing rules (graph helper), D-14 scope, demo-world size.
- 2026-10-04 — v1 created from session 3 (council phases 1–7, StellarMap, polymorphism, Figma Make rounds 1–3, user testing). Supersedes firestarter §5–§8.
