# 00-TOPOLOGY — App & route ownership (MVP)

**Decision (founder-approved 2026-09-04):** the **forum app owns ALL MVP routes**.
Resolves FINAL-HOLISTIC-AUDIT **HOL-P2-003**.

## Rule

| Route family | Owner | Notes |
|---|---|---|
| Everything (`/feed`, `/p/[slug]`-as-`/discussions/[slug]`, `/admin/*`, `/sell`, `/s/*`, `/resources`, `/personas`, legal pages, …) | `PRD/app/apps/forum` | One Next.js app, one auth boundary, one Convex deployment |
| `apps/admin`, `apps/seller`, `apps/marketplace` | **Parked** | Stay in the workspace (buildable placeholders, keep the pnpm workspace valid); NOT built out, NOT deleted. Their `/` placeholder pages are ignored. |

## Consequences for builders

1. **Slice file paths saying `app/admin/...` mean `apps/forum/src/app/(app)/admin/...`**
   in this repo. Same for `/sell` and `/s/*` surfaces. No second app is created.
2. The admin shell (SLICE-P3-02) mounts inside the forum app under `/admin`, gated
   by the canonical two-layer authz — the same ConvexAuth session serves member and
   staff surfaces.
3. Cross-app session/topology work (shared cookies, multi-domain auth) is
   explicitly **out of MVP scope** — one deployment, one domain.
4. If the product later wants separate storefronts/marketplace deployments, that is
   a post-MVP extraction decision; the parked apps are the natural starting points.

## URLs stay canonical-per-00-ROUTES

This doc decides *which app serves* a URL; `00-ROUTES.md` decides *what the URL is*.
