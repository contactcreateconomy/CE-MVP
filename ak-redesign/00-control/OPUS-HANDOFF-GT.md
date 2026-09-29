---
id: OPUS-HANDOFF-GT
type: HANDOFF
author-model: Opus
tool: Claude Code (cloud)
round: 1
status: IN-PROGRESS
date: 2026-09-29
---

# OPUS-HANDOFF-GT — ground-truth session checkpoint log

If this session died, resume from here. Branch `013-opus-ground-truth`; PR target `011-Akilesh-Redesign`.
The full task prompt is id GROUND-TRUTH-PROMPT (PM, 2026-09-28): Steps 0 → 1 → 2 → 3 → 3.5 → 4.

## Step 0 — environment (DONE)

- Graph: committed `graphify-out/graph.json` used as-is (not rebuilt, no hooks, no MCP).
- CLI: `uvx --from graphifyy graphify` works in the VM.
- Proof query: `uvx --from graphifyy graphify explain "CanonicalFeedClient"` →
  `apps/forum/src/components/feed/canonical-feed-client.tsx L27`, calls `FeedCard()` (L125),
  `TrendSorter()` (L99), imported by `app/(app)/(shell)/feed/page.tsx`. So the **live feed card is
  `FeedCard` inside canonical-feed-client.tsx**; `feed/post-card.tsx` is dead (0 imports).
- Lesson: `graphify query "<natural language>"` returns ~300 noisy nodes (mostly admin pages);
  **`graphify explain "<SymbolName>"` is the cheap, precise call.** Use symbol names.
- Baselines read at 390 (cropped into 1000px chunks with Pillow in the scratchpad — full-page PNGs
  are up to 14,529px tall and get downscaled to illegible otherwise). 1440 used for feed only.

## Steps

| Step | Status | Commit |
|---|---|---|
| 0 env + handoff | DONE | this commit |
| 1 agent files | TODO | |
| 2 CURRENT-STATE | TODO | |
| 3 control docs, CRs, templates, PM-BRIEF | TODO | |
| 3.5 tidy (git mv) | TODO | |
| 4 PR into 011 | TODO | |

## Open questions / half-decided

(none yet)
