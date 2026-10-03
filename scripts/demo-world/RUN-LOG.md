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
