---
id: FEED-U2
type: BUILD
author-model: Opus
round: 1
status: FOR REVIEW (Grok) → dev (backend, L-58) → founder in the browser
date: 2026-10-12
---

# FEED-U2 — wire /feed to the canonical display layer — build report

**Branches:** `feed-u2-payload` (backend, from `feed-base`, own branch per rule 4 / L-58, pushed) merged into `feed-u2-wire` (from `feed-u1-port`, pushed). No merge to `feed-base`.
**Decisions applied:** L-31, L-43, L-78…L-82 (not yet recorded in FEED-DESIGN — built from the phase prompt; see §17 lines). **Founder notes (item 5):** the prompt still held the `<paste>` placeholder — no notes were received, none applied.

## What changed
| Area | Change |
|---|---|
| **Backend (additive)** `convex/feed.ts`, `convex/lib/feedPayload.ts` | Cards: `author` (avatar URL, handle, persona / editorial, level), `facet` (review / compare / debate / help / list / showcase / news), `bestComment`, `participants`, `viewer.saved`. Debate agree share only after the viewer voted (L-29). Chrome: hero `summary` / `type` / `mediaUrl`; post-trend `title` / `slug` / `postType`; podium `handle` / `avatarUrl` / `level`. Details + review notes: `00-control/crs/CR-010-U2-RESPONSE.md`. |
| **Adapter** `components/feed/feed-adapter.ts` (new, pure) | payload → `FeedCardData` / hero slides / Vibing / Podium / nav; relative time; no source → null / [] / "" (D-012). Interim mapping: Gravity = the score row's legitimacy-weighted positive signal (until the Gravity engine, L-60/L-64). |
| **Container** `canonical-feed-client.tsx` | Now a pure data container rendering `FeedPageView`: queries, push-safe cursor walk (kept), sort / category, hide / mute / report + inline undo (L-79), debate `posts.debate.cast`, visitor → sign-in on Fav / vote / Start Discussion. Its plain card and the "Why this?" drawer that printed raw scores (L-16 "never scores") are gone. |
| **Shell** | On `/feed`: no AppShell hero / left / right rail (`ConditionalLeftSidebar` new, `ConditionalRightSidebar` extended) — `FeedPageView` owns them. Elsewhere the shell hero is `FeedHeroCarousel` from `getChrome` (L-31 no autoplay, L-43). The autoplay `top-post-hero-carousel.tsx` and `types/hero.ts` are deleted (L-51); the old section's invented summary copy ("Community Top — the freshest active slots.") is gone with it. |
| **L-78** | `--media-scrim` / `--text-on-media` (both themes) — hero overlay text over photos reads the same in light and dark. STYLE-KIT rows. |
| **L-79** | Hidden cards collapse in place to "Hidden · Undo"; `feed-undo-toast.tsx` deleted. |
| **L-80** | Lab fixtures speak Gravity: "+14G in the last 3h", "Still drawing Gravity 3 months later" · "+6G this week", podium "+NG from contributions" / "N comments drew Gravity" / "N answers drew Gravity" / "+NG, up from +3G" (Grok FIX a). **PROPOSED copy** — PM to confirm. |
| **L-81** | Crowns ≥ 3:1 on the surface: light gold / silver / bronze 1.62 / 1.41 / 3.44 → 3.36 / 4.33 / 4.72 (`hsl(42 96% 36%)`, `hsl(215 14% 48%)`, `hsl(26 85% 38%)`); dark keeps the bright set. STYLE-KIT row. |
| **L-82** | No "N discussing" on the card (faces stay); debate keeps "N voted · take a side" until the vote, split hidden (Grok FIX b). |

## Proofs
- **Backend RED → GREEN:** `tests/integration/feed-u2-payload.test.ts` runs the real `feed.list` / `getChrome` on the real schema (convex-test): 4 failing with the change stashed (`FEED-U2-evidence/red-01-payload.txt`) → 4/4 (`green-01-payload.txt`).
- **Display RED → GREEN:** decisions `red-02` (9 failing) → `green-02`; adapter `red-03` → `green-03`; shell `red-04` → `green-04`.
- **Gate:** typecheck 0 · lint 0 (forum + admin) · forum **83 files / 1064 ✅** · convex **18 files / 150 ✅** · no console errors.
- **Screenshots** (`FEED-U2-evidence/wire-{1440,390}-{dark,light}.png`): `/lab/feed?source=wire` = the **real** adapter + components over a payload captured from the **real** query code (`wire-payload.json`, written by the integration test). Banner on the page says so; only the convex-test storage URLs (fake deployment, unloadable) are swapped for offline stand-ins.

## Not proven — blocked by this container
- **`/feed` with the demo world, real photos:** no Convex backend can run here. The environment's network policy denies `github.com` (local backend binary download) and `images.unsplash.com`; there is no `NEXT_PUBLIC_CONVEX_URL`, and the demo-world import cache (`.demo-world-cache/`) is not in the repo. `feed-route-no-backend-1440.png` shows what `/feed` renders here (shell only — the container returns null without Convex). **Founder / GLM:** run `pnpm dev` against the local demo-world backend and capture `/feed` at 390 + 1440, dark + light.

## Gaps — no source, renders nothing (D-012)
Main topic (L-23) · Updated · Pinned · tool price unless `tools.pricing` is a string · compare "most-different row" · real Gravity (CR-014; interim mapping above) · viewer appreciated / commented / shared (no post-level reaction table; L-55 save mutation is B2) → G-switch shows `saved` only and has no tap handler · why-care life-stage / relationship lines + numbers (B3) — only best comment and bare "↗ Rising" · Fav new-activity glow (D-13) · Discover new-since-last-visit counts + "Your topics" · Podium "what they did" (entries carry points only, R-10) and dimension registry (only overall · 7d) · Vibing hook text (no `vibingHooks` writer) · hero labels beyond `community_top` (others read "Picked by Createconomy"; disclosureClass values unnamed) · "Why am I seeing this?" plain-language source (menu item hidden until it exists) · window notes from config (spec copy used, L-07 config key missing).

## Open questions
1. Record L-78…L-82 in FEED-DESIGN §2 (texts below) and confirm the L-80 Gravity copy.
2. Is "Gravity = legitimacy-weighted positive signal" an acceptable interim until B2/B3, or should the G count stay hidden until the engine exists?
3. Non-community hero slots read "Picked by Createconomy" — confirm vs "Featured" (promoted) for curated slots.

## Lines to append to FEED-DESIGN.md §17
```
- 2026-10-12 — FEED-U2 wire (branches feed-u2-payload + feed-u2-wire, FEED-U2-BUILD.md, CR-010-U2-RESPONSE.md): /feed renders FeedPageView via a data container + pure adapter; additive feed.list / getChrome payload (author, facets, best comment, participants, viewer.saved; hero summary/type/media; post-trend title/slug; podium handle/avatar/level), debate split only after voting; shell hands /feed over (no AppShell hero/rails there), autoplay hero deleted (L-31/L-43/L-51). L-78 media tokens, L-79 inline Hidden · Undo, L-80 Gravity wording (proposed copy), L-81 crowns ≥ 3:1 in light, L-82 faces without "N discussing". /feed screenshots with the demo world blocked in the build container (no backend: network policy) — proven on real query output in /lab/feed?source=wire.
```
