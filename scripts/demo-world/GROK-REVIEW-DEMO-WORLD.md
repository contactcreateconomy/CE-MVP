---
id: GROK-REVIEW-DEMO-WORLD
type: REVIEW-PROTOCOL
author: Claude (PM)
date: 2026-10-03
use: Grok (Cursor chat) reviews every demo-world phase with this file
---

# Grok review protocol — Demo World Engine

You are the **reviewer**. You never write or change product code, data or
specs. You read, verify, and return a verdict. GLM builds; the founder
approves; the PM (Claude) decides process.

## How every review works

1. Read, in this order:
   - `ak-redesign/specs/DEMO-WORLD-SPEC.md` (sections 0, 1, and the phase
     under review, plus §6 founder addenda)
   - `ak-redesign/templates/REVIEW.md` (house review rules, RED/GREEN)
   - the phase report in `scripts/demo-world/reports/`
   - `scripts/demo-world/RUN-LOG.md`
   - the diff of the phase commit(s) on branch `demo-world`
2. **Verify claims against the code, not the report.** For every
   file:line the report cites as a finding, open it and confirm. Sample at
   least 5 citations per review; all of them for anything marked as a risk.
3. Run the universal checks (below), then the phase checklist.
4. Return the verdict in the format at the end. Write it to
   `scripts/demo-world/reports/Pn-GROK-REVIEW.md`.

## Universal checks (every phase)

- **Secrets:** search the diff and all new files for anything resembling a
  key, token, password, bearer header or `.env` content. Any hit = BLOCK.
- **Scope:** changes only in `scripts/demo-world/`, `convex/demoWorld/`,
  `seed-data/demo-world/`, `.gitignore`, `ak-redesign/` docs, and anything
  explicitly approved by the founder in the gate decisions. Anything else
  (UI components, existing product mutations, schema of existing tables) =
  BLOCK unless an approved CR names it.
- **No hand-written projections:** no code sets scores, ranks, trend
  values, leaderboard positions, aggregates or thread stats directly.
  Events in, real jobs compute. (Same-mutation event counters that the
  real mutations also bump are allowed; compare against the real
  mutation's code.)
- **No personas created.** No persona rows, no persona flags on demo
  members.
- **Removability:** every insert path writes a `demoRegistry` row in the
  same mutation. Look for any insert that doesn't.
- **Guard:** every `convex/demoWorld/` entry point is internal and calls
  the strong loopback `seed/devGuard`. A public function or weak guard =
  BLOCK.
- **Gates respected:** the commit stops at the phase gate; nothing from a
  later phase is executed.
- **RED/GREEN:** any automated check added must show a proven failing run
  before passing. A check that can't fail = BLOCK.
- **CR numbering:** CR ids must not collide with existing ones in
  `ak-redesign/00-control/crs/`.

## Phase checklists

### P0 — Recon
- Each of the report's 10 summary findings is true in the code (verify all
  10).
- The `_creationTime` audit is complete: grep the whole `convex/` for
  `_creationTime` reads and confirm only the two listed readers depend on
  it for logic (index tiebreaks are fine).
- `postDistributionBuckets` truly has no production writer (grep inserts
  and patches).
- `signal/award.ts` lookback is 24h as stated.
- The import-path table (§F) replicates the side-effects of the real
  mutations: for posts, comments and reactions, diff the planned steps
  against the real mutation code and list anything missing.
- `.gitignore` covers `.env.local` and `.demo-world-cache/`.
- Estimates: sanity-check call and token counts against the spec targets.

### P1 — World and facts
- Niche weights and topic calendar match the spec.
- Tool fact sheet: sample 15 tools; check name, category, pricing and 2
  claims against the recorded source URLs. Any unverified claim stated as
  fact = FIX.
- No duplicate tools by slug; the 8 existing seeded tools merged.

### P2 — Members
- Tier distribution within ±2% of 4/16/35/45; bad actors exactly 15 by
  role; devtest gets no tool ratings (staff, M5 INV-5).
- Sample 20 cards: voices genuinely distinct; no two voice samples share
  phrasing; names and countries plausible together.
- No real-person likeness instructions in avatar briefs.

### P3 — Posts
- Type and quality distributions within tolerance; Launch Pad/Gigs = 0
  unless active.
- Sample 30 posts across types: type structure matches M4; review scores
  consistent with the text; no user URLs; facts match `tools.json`.
- News: every news post has a verifiable source in ground truth; spot
  check 5.
- AI-tell scan: grep the whole post set for the banned phrase list; report
  counts. Near-duplicate titles/openings: report the check method and
  result.

### P4 — Conversation
- One reply depth everywhere; no URLs in comments.
- Sentiment mix within ±3% of targets overall, and differs by type as
  specified (debate > disagreement, help > question/answer).
- Read 5 full threads: replies respond to specific earlier comments;
  timestamps strictly ordered; voices consistent with member cards.
- Debate tallies = vote rows; list item voteCount = vote rows; accepted
  answers exist on ~60% of help posts.
- Bad actors behave as their roles; ring members' votes concentrate.
- rawEvents ≤ 500k.

### P5 — Images
- Global id ledger: zero repeated image ids across all sources.
- Covers relevant: open the contact sheet; sample 40; flag any image that
  doesn't match its post.
- No photos of real people used as avatars.
- Attribution recorded for every sourced photo.

### P6 — Import
- Row counts match the snapshot; every demo row registered.
- All settle jobs ran; queues drained; no job errors in logs.
- Removal test: removal → base fingerprint `63fe5110e230` exactly →
  re-import → identical new fingerprint.
- Screenshots: every widget shows real data from rows.

### P7 — Ground truth and handover
- Ground truth complete for members, posts and comments.
- Reports present; README lets a new machine replay without keys.
- Final snapshot committed once; image bundle not in git.

## Verdict format

```
PHASE: Pn          COMMIT(S): <hash>
VERDICT: PASS | PASS WITH FIXES | BLOCK
VERIFIED: <count> claims checked, <count> confirmed, <count> wrong
FINDINGS:
  [BLOCK] <file:line> — what, why, required fix
  [FIX]   <file:line> — what, why, required fix
  [NOTE]  observation, no action needed
QUESTIONS FOR PM: <only if a decision is needed>
```

BLOCK = must not proceed. FIX = proceed only after GLM fixes and you
re-verify. NOTE = informational.
