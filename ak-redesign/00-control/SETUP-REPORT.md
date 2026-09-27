---
id: SETUP
type: REPORT
author-model: GLM 5.3
tool: zcode
round: 1
status: DONE
date: 2026-09-27
---

# SETUP-REPORT — graphify setup + ak-redesign skeleton

Branch `setup/graphify` (from `4f984ff` on `011-Akilesh-Redesign`). Setup-only role: no app code touched.

## Environment

| Item | Value |
|---|---|
| OS | Windows 11 (10.0.26200), x64 |
| Shell | Git Bash (msys) 5.2.37 — **not** PowerShell → `graphify .` form used throughout |
| Python | None system-wide (`python` = MS Store stub); uv-managed CPython only |
| uv | 0.12.19 — **not preinstalled; installed via winget during this setup** (extra action, see Errors) |
| graphify | 0.9.69 (`uv tool install "graphifyy[mcp,openai]"`) — executables `graphify.exe`, `graphify-mcp.exe` at `C:\Users\akile\.local\bin\` |
| Repo state at start | clean on `011-Akilesh-Redesign` @ `4f984ff` |

## Graph stats

**Code pass** (`graphify extract . --code-only`, GLM/zcode): 597 code files indexed; 216 non-code skipped (214 docs, 2 images), 58 unclassified skipped (fonts/env/etc.), 84 nodes deduplicated → **3,373 nodes / 8,684 edges / 168 communities**. One partial-extraction warning (see Errors).

**Docs pass** (run by founder after the step-3 stop): 218 docs re-extracted, 0 deleted → final graph **4,508 nodes / 10,507 edges / 297 communities** (205 shown, 92 thin omitted). Extraction quality: 99% EXTRACTED / 1% INFERRED (117 inferred edges, avg confidence 0.76). `GRAPH_REPORT.md` generated via `cluster-only`. Built from commit `4f984ffb`.

## Installer diffs (exact files changed per installer)

| Installer | Files changed |
|---|---|
| `graphify hook install` | wrote `.git/hooks/post-commit`, `.git/hooks/post-checkout`; modified **`.gitattributes`** (+1 line: `graphify-out/graph.json merge=graphify`); merge driver registered in `.git/config`. `hook status`: post-commit installed, post-checkout installed, merge driver registered. |
| `graphify claude install --project --strict` | modified **`CLAUDE.md`** (appended `## graphify` section, 10 lines: query-first rules); created `.claude/CLAUDE.md`, **`.claude/settings.json`** (PreToolUse hooks: Bash\|Grep → `graphify hook-guard search`; Read\|Glob → `graphify hook-guard read --strict`), `.claude/skills/graphify/` (SKILL.md + references/). |
| `graphify cursor install` | created `.cursor/rules/graphify.mdc`. |
| `graphify codex install` | modified **`AGENTS.md`** (appended `## graphify` section, 13 lines, incl. `/graphify` slash-command rule); created `.codex/hooks.json` (intentional no-op PreToolUse hook). |

`AGENTS.md`/`CLAUDE.md`/`.gitattributes` edits were written by graphify's own installers (allowed); no other existing file was edited.

## Cache rules

`.claudeignore` (root, created):
```
graphify-out/graph.json
graphify-out/graph.html
graphify-out/cache/
```
`.claude/settings.json` → `permissions.deny` (merged into installer-created file; hooks preserved):
```
Read(./graphify-out/graph.json)
Read(./graphify-out/graph.html)
Read(./graphify-out/cache/**)
```
`graphify-out/GRAPH_REPORT.md` intentionally **not** blocked (agents need it).

## MCP command (tested working)

```
C:\Users\akile\.local\bin\graphify-mcp.exe --graph "C:\Users\akile\Documents\Createconomy\Design\createconomy-frontend\CE-MVP\graphify-out\graph.json"
```
- Default transport: stdio (no flags needed). zcode MCP config: command = `C:\Users\akile\.local\bin\graphify-mcp.exe`, args = `["--graph", "<abs path to graphify-out/graph.json>"]`.
- Test: sent `initialize` JSON-RPC over stdin → response `{"serverInfo":{"name":"graphify","version":"0.9.69"},"protocolVersion":"2024-11-05", ...}`. Server starts and answers.
- Short form `graphify-mcp --graph graphify-out/graph.json` (cwd = repo root) also works if `%USERPROFILE%\.local\bin` is on PATH.

## Query results (5/5 pass)

| Query | Nodes | Key hits |
|---|---|---|
| `feed page hero section` | 223 | `FeedPage()` @ `apps/forum/src/app/(app)/(shell)/feed/page.tsx`, `FeedPageProps`, `hero.ts` @ `apps/forum/src/types/hero.ts`, `SECTION_COPY` |
| `post composer` | 131 | **`Post Composer (Wave 2)` @ `docs/screens/wave-2-compose.md`** (docs node), `composer-affordances.test.ts`, `Post` @ `types/post.ts` |
| `podium widget` | 84 | `podium-widget.tsx` @ `components/layout/`, `widgetsCatalog.ts` @ `convex/admin/` |
| `admin console navigation` | 211 | `console-shell-context.tsx` @ `apps/admin/src/components/layout/`, `NavigationState`, `admin/package.json` |
| `hero slot scheduling rules` | 159 | **docs/ nodes confirmed**: `CAP-489 jobs.dispatch scheduling` @ `docs/01-product-spec/CAPABILITY-REGISTER-MERGED.md`, `SLICE-P2-06 …` @ `docs/03-slices/SLICE-CATALOG-PHASE7-TRUST.md`, plus `qualify/rules.ts`, `orchestrator.ts` |

All queries hit the 2000-token display budget (truncation banner) — expected for BFS depth 2; use `--budget` or `get_node` for full subgraphs.

## Route inventory (from filesystem)

### apps/forum (port 3000) — 48 pages

| Route | Page file |
|---|---|
| `/` | `apps/forum/src/app/page.tsx` |
| `/landing` | `apps/forum/src/app/(auth)/landing/page.tsx` |
| `/signin` | `apps/forum/src/app/(auth)/signin/page.tsx` |
| `/waitlist` | `apps/forum/src/app/(auth)/waitlist/page.tsx` |
| `/welcome` | `apps/forum/src/app/(auth)/welcome/page.tsx` |
| `/feed` | `apps/forum/src/app/(app)/(shell)/feed/page.tsx` |
| `/about` | `apps/forum/src/app/(app)/(shell)/about/page.tsx` |
| `/ai-disclosure` | `apps/forum/src/app/(app)/(shell)/ai-disclosure/page.tsx` |
| `/appeal/[actionId]` | `apps/forum/src/app/(app)/(shell)/appeal/[actionId]/page.tsx` |
| `/discover` | `apps/forum/src/app/(app)/(shell)/discover/page.tsx` |
| `/dmca` | `apps/forum/src/app/(app)/(shell)/dmca/page.tsx` |
| `/drafts` | `apps/forum/src/app/(app)/(shell)/drafts/page.tsx` |
| `/editorial-policy` | `apps/forum/src/app/(app)/(shell)/editorial-policy/page.tsx` |
| `/help` | `apps/forum/src/app/(app)/(shell)/help/page.tsx` |
| `/how-we-review` | `apps/forum/src/app/(app)/(shell)/how-we-review/page.tsx` |
| `/how-we-use-your-store-data` | `apps/forum/src/app/(app)/(shell)/how-we-use-your-store-data/page.tsx` |
| `/leaderboard` | `apps/forum/src/app/(app)/(shell)/leaderboard/page.tsx` |
| `/legal/intake` | `apps/forum/src/app/(app)/(shell)/legal/intake/page.tsx` |
| `/notifications` | `apps/forum/src/app/(app)/(shell)/notifications/page.tsx` |
| `/privacy` | `apps/forum/src/app/(app)/(shell)/privacy/page.tsx` |
| `/profile` | `apps/forum/src/app/(app)/(shell)/profile/page.tsx` |
| `/repeat-infringer` | `apps/forum/src/app/(app)/(shell)/repeat-infringer/page.tsx` |
| `/search` | `apps/forum/src/app/(app)/(shell)/search/page.tsx` |
| `/sell` | `apps/forum/src/app/(app)/(shell)/sell/page.tsx` |
| `/sell/apply` | `apps/forum/src/app/(app)/(shell)/sell/apply/page.tsx` |
| `/settings` | `apps/forum/src/app/(app)/(shell)/settings/page.tsx` |
| `/settings/profile` | `apps/forum/src/app/(app)/(shell)/settings/profile/page.tsx` |
| `/setup` | `apps/forum/src/app/(app)/(shell)/setup/page.tsx` |
| `/terms` | `apps/forum/src/app/(app)/(shell)/terms/page.tsx` |
| `/users/[handle]` | `apps/forum/src/app/(app)/(shell)/users/[handle]/page.tsx` |
| `/category/[slug]` | `apps/forum/src/app/(app)/(content)/category/[slug]/page.tsx` |
| `/content` | `apps/forum/src/app/(app)/(content)/content/page.tsx` |
| `/content/spark` | `apps/forum/src/app/(app)/(content)/content/spark/page.tsx` |
| `/contribute` | `apps/forum/src/app/(app)/(content)/contribute/page.tsx` |
| `/go/[linkId]` | `apps/forum/src/app/(app)/(content)/go/[linkId]/page.tsx` |
| `/personas` | `apps/forum/src/app/(app)/(content)/personas/page.tsx` |
| `/personas/[id]` | `apps/forum/src/app/(app)/(content)/personas/[id]/page.tsx` |
| `/resources` | `apps/forum/src/app/(app)/(content)/resources/page.tsx` |
| `/resources/[slug]/view` | `apps/forum/src/app/(app)/(content)/resources/[slug]/view/page.tsx` |
| `/s/[handle]` | `apps/forum/src/app/(app)/(content)/s/[handle]/page.tsx` |
| `/s/[handle]/[product]` | `apps/forum/src/app/(app)/(content)/s/[handle]/[product]/page.tsx` |
| `/tools` | `apps/forum/src/app/(app)/(content)/tools/page.tsx` |
| `/tools/[slug]` | `apps/forum/src/app/(app)/(content)/tools/[slug]/page.tsx` |
| `/discussions/[slug]` | `apps/forum/src/app/(app)/discussions/[slug]/page.tsx` |
| `/kit` | `apps/forum/src/app/(app)/kit/page.tsx` |
| `/new-post` | `apps/forum/src/app/(compose)/new-post/page.tsx` |

*(route groups `(auth)/(shell)/(content)/(compose)` don't appear in URLs)*

### apps/admin (port 3001) — 24 pages

| Route | Page file |
|---|---|
| `/` | `apps/admin/src/app/page.tsx` (redirects to `/admin`) |
| `/admin` | `apps/admin/src/app/admin/page.tsx` |
| `/admin/affiliate-inventory` | `apps/admin/src/app/admin/affiliate-inventory/page.tsx` |
| `/admin/analytics` | `apps/admin/src/app/admin/analytics/page.tsx` |
| `/admin/audit` | `apps/admin/src/app/admin/audit/page.tsx` |
| `/admin/config` | `apps/admin/src/app/admin/config/page.tsx` |
| `/admin/curation` | `apps/admin/src/app/admin/curation/page.tsx` |
| `/admin/editorial` | `apps/admin/src/app/admin/editorial/page.tsx` |
| `/admin/home` | `apps/admin/src/app/admin/home/page.tsx` |
| `/admin/moderation` | `apps/admin/src/app/admin/moderation/page.tsx` |
| `/admin/personas` | `apps/admin/src/app/admin/personas/page.tsx` |
| `/admin/personas/genome` | `apps/admin/src/app/admin/personas/genome/page.tsx` |
| `/admin/personas/queue` | `apps/admin/src/app/admin/personas/queue/page.tsx` |
| `/admin/readiness` | `apps/admin/src/app/admin/readiness/page.tsx` |
| `/admin/reliability` | `apps/admin/src/app/admin/reliability/page.tsx` |
| `/admin/resources` | `apps/admin/src/app/admin/resources/page.tsx` |
| `/admin/roles` | `apps/admin/src/app/admin/roles/page.tsx` |
| `/admin/rulebook` | `apps/admin/src/app/admin/rulebook/page.tsx` |
| `/admin/seo` | `apps/admin/src/app/admin/seo/page.tsx` |
| `/admin/sources` | `apps/admin/src/app/admin/sources/page.tsx` |
| `/admin/store` | `apps/admin/src/app/admin/store/page.tsx` |
| `/admin/support` | `apps/admin/src/app/admin/support/page.tsx` |
| `/admin/utm` | `apps/admin/src/app/admin/utm/page.tsx` |
| `/admin/wiki` | `apps/admin/src/app/admin/wiki/page.tsx` |

## Agent-file inventory (REPORT ONLY — nothing changed)

**Total: 110 files** (30 full-detail + 80 grouped). Headline: `ak-redesign/00-control/CONVENTIONS.md` now declares UI/UX precedence, but **zero legacy agent files reference it yet** — every file pointing at STYLE-KIT/contracts as UI authority currently contradicts it.

### Tier 1 — real UI-redesign conflict potential

| # | Path | Size | Summary | Conflicting rules (quoted) | Suggestion |
|---|---|---|---|---|---|
| 1 | `AGENTS.md` | 15,638 B | Canonical operating doc for all agents: read order, hard rules, topology, wiki tracking | §4.1 "**Never invent a token, color, spacing value, or component pattern not in `STYLE-KIT.md`.** If no token exists, stop and report"; §4.2 "**Never build a capability or screen not in the register/inventory.**"; §4.3 "the CONTRACT is authoritative for UI/states/actions"; §3 mandates STYLE-KIT read "every time" | **rewrite** — add ak-redesign precedence clause above §3/§4 (highest-priority fix) |
| 2 | `CLAUDE.md` | 9,683 B | Claude Code mirror of AGENTS.md essentials | "Never invent a token … not in `docs/04-design-system/STYLE-KIT.md` — stop and report"; "Never build a capability or screen not in the capability register (572 CAP-XXX) / screen inventory (54)"; "the screen CONTRACT (`docs/02-contracts/`) wins"; "Live route names are canonical … Don't rename routes" | **rewrite** — same precedence fix |
| 3 | `docs/AGENT-START-HERE.md` | 9,267 B | Spec entry point; read order + 4 hard rules + PRD-only fence | "**Do not read or reference anything outside `PRD/`.**"; "§4.1 Never invent a token … not already in `STYLE-KIT.md`"; "**NEVER use a raw hex or px value where a named token exists**"; "Charts (A2) do not exist … flag before building" | **rewrite** — dated addendum: UI/UX authority moved to ak-redesign/ |
| 4 | `docs/AGENT-MEMORY.md` | 14,202 B | Append-only lessons log; several founder UI-shape locks | 2026-09-17 "Do not run `shadcn init`/`add` — it rewrites the palette"; 2026-09-16 "copy the shadcn-admin composition … do not add inventory screens"; 2026-09-18 "Do not rebuild the chooser." / "no second magic-link/staff-gate page" | **rewrite** — append one superseding entry for redesign session |
| 5 | `docs/00-project-status/00-ROUTES.md` | 2,707 B | Founder-approved: live route names canonical | "where live code exists, **its route name becomes canonical** — working routes are not churned"; "New links/sitemaps/SEO machinery use ONLY the new canonical names" | **keep** — route stability still desired; log IA changes in DECISIONS |
| 6 | `docs/00-project-status/00-TRANSITION.md` | 4,183 B | RESET/strangler governing decision | "The live **UI/interaction patterns** … remain the quality reference"; "**Port** = rewire queries/mutations … **keeping the existing UI structure**" | **keep** — backend rule intact; "existing UI is the reference" clause is stale for redesign |
| 7 | `docs/00-project-status/PROJECT-STATUS.md` | 10,244 B | Cold-arrival build-state account (banner-marked SUPERSEDED 2026-09-12) | "Read this cold before touching anything"; "the three reference implementations … are the 'extend, don't rebuild' baseline" | **rewrite** — short pointer to current status + ak-redesign/ |
| 8 | `README.md` (root) | 8,071 B | Human+agent entry-point table; pre-dev gates | "the three reference implementations … are the 'extend, don't rebuild' baseline"; stale wave-4 review flag | **rewrite** (light) — entry-point table + ak-redesign/ |

### Tier 2 — low/no UI conflict (keep unless noted)

| Path | Size | Notes | Suggestion |
|---|---|---|---|
| `SETUP.md` | 5,149 B | run guide; no style/UX rules | keep |
| `docs/FOUNDER-BOOTSTRAP.md` | 3,644 B | founder CLI steps; one UI lock: "the shared `AuthModal` is the only sign-in UI" | keep |
| `docs/DEV-HANDOFF.md` | 9,599 B | Bucket-1 terminal-blocked rule; backend/CLI scope | keep |
| `docs/00-project-status/00-TOPOLOGY.md` | 1,980 B | app/route-family ownership; not UI | keep |
| `docs/00-project-status/KNOWN-UI-GAPS.md` | 1,277 B | orphaned-UI log; rows closed | keep |
| `docs/00-project-status/BIBLE-FIXES.md` | 4,422 B | data-model edit discipline | keep |
| `.claude/settings.json` | 672 B | permissions + graphify hook-guards | keep |
| `.claude/CLAUDE.md` | 226 B | graphify skill pointer | keep |
| `.cursor/rules/graphify.mdc` | 1,313 B | "MANDATORY: … run graphify first" — process-only | keep |
| `.codex/hooks.json` | 262 B | graphify no-op hook wiring | keep |
| `skills-lock.json` | 8,394 B | pin manifest for 33 Convex skills | keep |
| `.github/workflows/wiki-tracker-sync.yml` | 2,809 B | bot enforcing CHANGELOG definition-of-done | keep |
| `.claude/skills/graphify/SKILL.md` | 41,733 B | graphify operating skill; tool usage only | keep |
| `apps/forum/AGENTS.md`, `apps/admin/AGENTS.md` | 687 B ea | Next.js auto-generated blocks | keep |
| `apps/forum/CLAUDE.md`, `apps/admin/CLAUDE.md` | 12 B ea | `@AGENTS.md` pointers | keep |
| `apps/forum/README.md` | 1,867 B | stale pointer row → AGENT-START-HERE | **rewrite** (pointer only) |
| `convex/_generated/ai/guidelines.md` | 30,939 B | Convex-official; backend-only | keep |
| `ak-redesign/00-control/CONVENTIONS.md` | 910 B | the new precedence anchor itself | keep |
| `.claudeignore` / `.graphifyignore` | 68 / 145 B | ignore rules | keep |

### Tier 3 — grouped, verified non-conflicting

- **`.agents/skills/**` — 39 files** (33 SKILL.md 779–10,863 B; 2 openai.yaml; 4 references): third-party Convex backend skills, pinned by skills-lock.json. Grep for STYLE-KIT/design-system/UI-spec: no UI-design rules. **Keep all.**
- **`.claude/skills/*` pointers — 33 files** (27–35 B): one-line pointers to the same Convex skills. **Keep all.**
- **`.claude/skills/graphify/references/` — 8 files** (1.2–13.5 KB): graphify tool mechanics. **Keep all.**

**Action list before redesign work starts: 7 rewrites** (AGENTS.md, CLAUDE.md, docs/AGENT-START-HERE.md, docs/AGENT-MEMORY.md, PROJECT-STATUS.md, README.md, apps/forum/README.md) **+ 2 keep-with-note** (00-ROUTES.md, 00-TRANSITION.md).

## Errors & open issues

1. **uv not preinstalled** — `uv tool install` failed with "command not found". Fixed by `winget install astral-sh.uv` (uv 0.9.69 → 0.12.19). Extra action beyond the runbook; logged here.
2. **`convex/lib/events.ts` syntax error** — graphify warned "1 file had syntax errors and may be partially extracted: convex/lib/events.ts (first error at line 21, 5 symbol(s) extracted)". NOT fixed (forbidden for setup role). Flag for founder/next agent.
3. **`graphify-out/` not in `.gitignore`** — only the 3 specified files were staged (`git add -f`); the rest (`cache/`, `graph.html`, `.graphify_*`, dated snapshot dir) sit untracked and will show as repo noise. Editing `.gitignore` is forbidden for setup — recommend adding ignore entries in the first redesign commit.
4. **`AGENTS.md`/`CLAUDE.md`/`.gitattributes` modified by graphify installers** — allowed ("files written by graphify's own installers/hooks"), listed in Installer diffs for transparency.
5. **No system Python** — only the MS Store stub. Harmless (uv manages its own), but note some future tooling may expect `python` on PATH.
6. **Query display truncation** — all queries print a ~2000-token budget banner; raise `--budget` or use `get_node` when fuller subgraphs are needed. Not an error.
7. **Wiki/CHANGELOG**: AGENTS.md §11 requires wiki updates per slice — this is infra setup, not a slice; no wiki update made. The `wiki-tracker-sync` bot checks CHANGELOG on merges to `main` — if this branch merges via PR to `main`, add a CHANGELOG entry then.
8. **Q5 docs-nodes requirement verified** — `hero slot scheduling rules` returns CAP-489 (CAPABILITY-REGISTER-MERGED.md) and SLICE-P2-06 (SLICE-CATALOG-PHASE7-TRUST.md) nodes.
