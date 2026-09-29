---
id: PRE-CLOUD
type: REPORT
author-model: GLM 5.3
tool: zcode
round: PRE-CLOUD
status: DONE
date: 2026-09-28
---

# PRE-CLOUD-REPORT — 013-opus-ground-truth input manifest

Branch `013-opus-ground-truth`, created from `011-Akilesh-Redesign` at `9bacc42`.
Merge: `012-local-convex` → `011-Akilesh-Redesign` at **`a370500`** (founder-resolved add/add on
SETUP-REPORT-R3.md; see below). Home-PC baseline/ archived at **`9bacc42`**.

## Opus inputs — every path verified committed (`git ls-files --error-unmatch`), none gitignored

| Input | Exact path | Status |
|---|---|---|
| Vision | `ak-redesign/01-vision/CEY-VISION.md` | ✅ (frontmatter id: VISION; brief's "VISION.md") |
| PM handoff | `ak-redesign/00-control/PM-HANDOFF-S1.md` | ✅ |
| PM observations | `ak-redesign/00-control/PM-OBSERVATIONS-S1.md` | ✅ |
| Conventions | `ak-redesign/00-control/CONVENTIONS.md` | ✅ |
| Raw inventory | `ak-redesign/00-control/RAW-INVENTORY.md` | ✅ (incl. the 011 inventory delta) |
| Setup report R1 | `ak-redesign/00-control/SETUP-REPORT.md` | ✅ |
| Setup report R2 | `ak-redesign/00-control/SETUP-REPORT-R2.md` | ✅ |
| Setup report R3 | `ak-redesign/00-control/SETUP-REPORT-R3.md` | ✅ canonical (office-laptop R3; R1/R2 reviews' subject) |
| Style kit | `docs/04-design-system/STYLE-KIT.md` | ✅ |
| Reconciliation note | `docs/04-design-system/RECONCILIATION-NOTE.md` | ❌ **MISSING** — not in the tree or any commit history; only referenced by PM-OBSERVATIONS-S1.md §"STYLE-KIT is already extracted … (see RECONCILIATION-NOTE)". Not recreated per instructions. |
| Design open items | `docs/04-design-system/DESIGN-SYSTEM-OPEN-ITEMS.md` | ✅ |
| Baselines | `ak-redesign/00-control/baselines/` | ✅ 66 files: 64 route PNGs + `CONTACT-390.png` + `CONTACT-1440.png` |

## EXCLUDED from Opus inputs

- `ak-redesign/00-control/_archive/` — superseded material, never read as current state:
  `_archive/SETUP-REPORT-R3-HOMEPC-0927.md` (home-PC R3; id SETUP-R3-HOMEPC, status SUPERSEDED,
  superseded-by SETUP-R3 — content otherwise untouched) and `_archive/baseline-homepc-0927/`
  (37 files: the home PC's 09-27 captures + its CONTACT sheets, `git mv`ed unchanged).

## Founder decisions applied

- R3 collision (add/add on SETUP-REPORT-R3.md): 012's version canonical; 011's archived with the
  prescribed frontmatter — merge commit `a370500`.
- `dev/demoSeed.ts` (the 150-post seed): **authored by the dev team, not a redesign session** —
  single commit `44d0bfb` (2026-09-17, `dev-createconomy <contact.createconomy@gmail.com>`,
  "Fix published posts never appearing on /feed, and add dest-only demo fixtures", bundled with
  forum feed fixes and `apps/forum/src/components/ui/__tests__/demo-seed.test.ts`). Per the rule:
  **NOT deleted**, no scripts removed. Guard status: it has NO loopback guard — its gate is
  `DEMO_SEED_ENABLED=true` plus a production-*name* denylist (`energetic-kangaroo-55` /
  `discuss.createconomy.com` substring match in CONVEX_CLOUD_URL/SITE_URL env). The redesign's
  loopback allowlist lives only in `convex/seed/devGuard.ts` (used by `seed/demo`). Recommend a
  dev-team follow-up to port the loopback check into `demoSeedBlockedReason`.

## Gate on 011 (at `9bacc42`, before branching 013)

typecheck ✅ · lint ✅ · forum tests **972/972** ✅ · convex tests **103/103** ✅ ·
cap-coverage **572/572** ✅

## Graph (post-refresh; see graphify-out/)

Nodes **4932** · links (edges) **11806** · communities **334** — `graphify-out/graph.json`,
regenerated on this branch by `graphify update .` (graphify 0.9.71 via uv, AST-only pass;
known parser warning on `convex/lib/events.ts:21` — the tree-sitter limitation documented
in SETUP-REPORT R2, not a real TS error).

## Branch lineage

`012-local-convex` `0d1222f` (founder files committed + pushed) → merged into
`011-Akilesh-Redesign` `a370500` → archive commit `9bacc42` (011 head, pushed) →
`013-opus-ground-truth` branched from `9bacc42`.
