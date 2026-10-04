# demo-world RUN-LOG

Cost and time log per phase (spec §1): calls, tokens, images, duration.
Driver notes apply to the API driver (`DEMO_LLM_*`); the local/self-generation
driver (founder addendum A2) is measured in sessions, not API tokens.

## P0 — Recon (2026-10-03)

| Item | Count | Tokens | Notes |
|---|---|---|---|
| LLM probe call 1 | 1 call | 54 total (34 reasoning) | HTTP 200, visible reply empty — `max_tokens:8` consumed by reasoning channel |
| LLM probe call 2 | 1 call | 54 total (34 reasoning, 3 visible) | HTTP 200, reply `"ok"`, finish `stop`. Model confirmed: GLM flash via OpenAI-compatible endpoint. **Reasoning tokens are billed** — bulk estimates include a reasoning factor; driver reads `message.content`, never `reasoning_content`. |
| Unsplash search | 1 | — | HTTP 200, 1,391 results for "creator workspace". Demo limit 50 req/hr. |
| Picsum fetch | 1 | — | HTTP 200, image/jpeg |
| Art Institute of Chicago API | 1 | — | HTTP 200, 133,118 artworks |
| Recon sub-agents (zcode, local driver) | 3 | n/a | schema+mutations, jobs+timestamps, seed-ritual+rules (read-only) |

No images downloaded, no DB rows written, no generation started (P0 = recon only).
Total external API spend this phase: 2 LLM calls, 4 HTTP probes. Duration ≈ 1 h (session).

## P0b — image-source addendum probes (2026-10-03, founder added Pixabay + Wikimedia)

| Item | Count | Tokens | Notes |
|---|---|---|---|
| Wikimedia Commons search | 1 | — | HTTP 200, 3 results, sample license `CC BY 2.0` via `extmetadata`; keyless. Per-image author+license recorded in ground truth at P5. |
| Pixabay search | 0 | — | P0b SKIPPED — key not yet saved; **P0c re-probe after founder saved `.env.local` (23:57): HTTP 200, 500 hits ("creator workspace"), key len 34 (value never printed).** |

Spend this sub-phase: 2 HTTP probes (1 Commons, 1 Pixabay).

## P1 — The world and the facts (2026-10-04) — driver: LOCAL (addendum A2)

| Item | Count | Tokens | Notes |
|---|---|---|---|
| LLM API calls | **0** | 0 | entire phase produced by the local driver (zcode/GLM sub-agents) per A2 |
| Web-verification sub-agents | 9 | n/a (local) | 7 tool batches (100 tools: official pricing pages + corroborating sources + recent-changes checks) + 2 real-event research agents (Aug 2–Oct 4 2026, per niche cluster). ~500 web fetch/search actions total. |
| Tool rows produced | 100 | — | 59 verified:full, 41 verified:partial, 0 none; 0 duplicate slugs; 2 shutdowns discovered (OpenAI Sora, Relay.app), 4 pivots recorded (Copy.ai, Writesonic, BrandWell, Podcastle→Async) |
| Calendar | 29 entries | — | 27 anchored to sourced real events (Suno licensing arc, Sept model-price war, Sora shutdown, Patreon 30 features, Copilot changelog…) |
| Validator | 1 run | — | `scripts/demo-world/validate.mjs` PASS (weights 1.000, niche spread exact) |

No images fetched, no DB writes, no convex/ code (blocked until Grok re-check, A5.4).
Artifacts: `.demo-world-cache/p1/{world,tools,events-media,events-text}.json` + `batches/*.json` (gitignored cache).

## Lean run (2026-10-04, founder+PM: no gates, pilot P3–P5, one line per phase)

| Phase | Counts | LLM calls | Tokens (in/out) | Time |
|---|---|---|---|---|
| P2 casting | 500 members (20/80/175/225 tiers, 15 bad actors in ground truth, 460 verified, 407 avatars, 500 unique handles) | 25 (+~3 repairs) | ~45k/~30k | ~4 min |

