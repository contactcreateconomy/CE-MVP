---
id: SETUP-R2
type: REPORT
author-model: GLM 5.3
tool: zcode
round: 2
status: DONE
date: 2026-09-27
---

# SETUP-REPORT R2 — freshness, housekeeping, raw inventory, baseline attempt

Branch `setup/graphify` (carries R1). Facts only.

## Step 1 — Graph freshness

Post-commit hook had refreshed all 3 tracked graph files → committed `71a29f3` `[GRAPH][REFRESH][GLM] refresh graph` (3 files, +18,386/−13,425 lines).

## Step 2 — Housekeeping

- `.kilo/`: `git rm -r .kilo/` → `fatal: pathspec did not match` — **nothing under .kilo/ was ever git-tracked** (only an untracked `.kilo/.gitignore` + empty `worktrees/`). Removed the untracked directory with `rm -rf` per the approved decision. Logged.
- `.gitignore`: added `graphify-out/*` + negations for graph.json / GRAPH_REPORT.md / manifest.json.
- Verified: `git ls-files graphify-out` → exactly the 3 kept files; `git status` shows no other graphify-out noise.
- Committed `5f6b557` `[SETUP][HOUSEKEEPING][GLM] remove .kilo, ignore graphify-out artifacts`.

## Step 3 — convex/lib/events.ts:21 diagnosis (REPORT ONLY)

Lines 15–30 of `convex/lib/events.ts`: line 21 is `userId?: import("../_generated/dataModel").Id<"users">;` — an **inline import type** inside interface `RawEventInput`.

- Scoped check: `tsc --noEmit --strict --skipLibCheck … convex/lib/events.ts` → **exit 0, zero errors**.
- Repo script `pnpm typecheck` (forum app) → **exit 0** (note: forum tsconfig does NOT include convex/; the scoped check above is the one that covers this file).
- **Conclusion: graphify/tree-sitter parser limitation, not a real TS error.** Evidence: tsc accepts the file with zero diagnostics; the flagged construct (inline `import("…")` type at L21) is valid TypeScript the tree-sitter grammar mis-parses.

## Step 4 — RAW-INVENTORY.md

Written to `ak-redesign/00-control/history/RAW-INVENTORY.md` (sections A–F). Headlines:
- **A:** Next 16.3.3 + React 19.2.4; Tailwind v4 CSS-first (no config file); 6 Radix primitives; motion 12; lucide; **no form lib, no PWA lib, no drawer lib (vaul)**; zustand + react-virtual + Convex; TipTap 3.
- **B:** exactly 2 token files — forum + admin `globals.css`, 394 `--*` declarations each, namespace families (text 72, color 63, z 26, shadow 24, feedback 24, type 22, glow 20, container 18, space 16, ease/duration 14, radius 13, bg 12, brand 9, cat 8).
- **C:** mobile-feel gaps — **no viewport export, no web manifest, no service worker, no icons (public/ empty), no theme-color, no standalone mode**; present: mobile tab bar, 2 safe-area uses, Radix dialog as sheet stand-in, 1 touch-handling file.
- **D:** 136 component files with exports/LOC/imported-by (from graph.json import edges); 18 files have imported-by = 0; most-imported: ui/card (50), ui/button (47), auth-ui app-auth-provider (35).
- **E:** 16 core routes — 9 are thin wrappers; loading patterns inconsistent (spinner / null-blank / text / 1 Skeleton); 8 routes have no error state; **zero real TODO/FIXME markers** (all "placeholder" hits are input attributes); /profile + /settings + /welcome are redirects; /category/[slug] is static-seed; /drafts is localStorage-only.
- **F:** 32 other routes tabulated (largest: /kit 268, /legal/intake 259, /waitlist 123).

## Step 5 — Baseline screenshots (best effort → BLOCKED by disabled backend)

- Dev server: **ran** (`pnpm dev`, HTTP 200 on all 16 probed routes; /welcome → 307 → /feed recorded, not captured).
- Playwright 1.63.0: browser binaries were missing → installed Chromium headless shell (`playwright install chromium`). First loop failed 30/30 (cause: `--wait-until=networkidle` never fires with Convex websockets); second loop without it: **30/30 captured**.
- **Result: NOT usable as design baselines.** Every capture (including the static /category/debate route) shows the **Next.js dev error overlay**, because the shared Convex dev deployment `watchful-chameleon-570` is **disabled — free-plan limits exceeded** ("This deployment has been disabled"). The app shell's providers subscribe to Convex, so even static pages are covered by the overlay. `/category/ai-technology` additionally 404'd (valid slugs are post types; re-captured as /category/debate). `/discussions/demo-figma` was captured but no real post slug is statically discoverable (`convex/dev/demoSeed.ts` inserts posts without explicit slugs).
- Files kept as evidence + `baseline/README.md` written with the full explanation and a re-capture command for after Convex is re-enabled.

## Step 6 — zcode MCP import file

Written to `C:\Users\akile\graphify-mcp-import.json` (outside the repo):
`{"mcpServers":{"graphify":{"command":"C:\\Users\\akile\\.local\\bin\\graphify-mcp.exe","args":["--graph","C:\\Users\\akile\\Documents\\Createconomy\\Design\\createconomy-frontend\\CE-MVP\\graphify-out\\graph.json"]}}}` (single line, valid JSON; handshake-tested in R1).

## Errors & open issues

1. **Convex dev deployment disabled (free-plan limits)** — blocks all data-backed UI (screenshots, any E2E against real data). Founder action required (upgrade plan / re-enable deployment). **This is the one manual must-do.**
2. `git rm -r .kilo/` failed (nothing tracked) — untracked dir removed via `rm -rf` instead (per approved decision).
3. Playwright screenshot: 30/30 failures on first loop (`--wait-until=networkidle` + Convex websockets → timeout); fixed by dropping the flag. Browsers installed during setup.
4. No real discussion post slug discoverable statically — re-capture script in baseline/README.md needs one slug + one handle from the live feed once Convex is back.
5. Full `pnpm typecheck` passes (exit 0) — repo TS gate is green as of today.
6. Screenshot naming: `category-ai-technology-*.png` (404 state) were replaced by `category-debate-*.png` (error-overlay state); `discussions-demo-figma-*` is a tool slug, expected to render the not-found/error state, kept for the record.

## Commits (this round)

- `71a29f3` [GRAPH][REFRESH][GLM] refresh graph
- `5f6b557` [SETUP][HOUSEKEEPING][GLM] remove .kilo, ignore graphify-out artifacts
- (this commit) [SETUP][INVENTORY][GLM] raw inventory + baseline + report R2
