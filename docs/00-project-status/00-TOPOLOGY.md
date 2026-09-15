# 00-TOPOLOGY — App & route ownership

**Original decision (founder-approved 2026-09-04):** the forum app owns ALL MVP routes.
Resolves FINAL-HOLISTIC-AUDIT **HOL-P2-003**.

**Amendment (founder-approved 2026-09-15):** `/admin/*` is extracted to `apps/admin` on its own origin (local port **3001**). Forum `/admin/*` redirects to that origin. Seller/marketplace remain parked. Convex backend stays shared.

## Rule

| Route family | Owner | Notes |
|---|---|---|
| Member surfaces (`/feed`, `/discussions/[slug]`, `/sell`, `/s/*`, `/resources`, `/personas`, legal pages, …) | `apps/forum` | localhost:3000; `/` redirects to `/feed` |
| Staff console (`/admin/*`) | `apps/admin` | localhost:3001; `/` redirects to `/admin`; same Convex deployment |
| `apps/seller`, `apps/marketplace` | **Parked** | Stay in the workspace (buildable placeholders); NOT built out, NOT deleted |

## Consequences for builders

1. **Slice file paths saying `app/admin/...` mean `apps/admin/src/app/admin/...`.**
   `/sell` and `/s/*` still live in `apps/forum`.
2. The admin shell (SLICE-P3-02) mounts in the admin app under `/admin`, gated
   by the canonical two-layer authz (`assertAdminPermission` + widget catalog).
3. Auth cookies are **origin-scoped**. Staff sign in again on :3001 even if already
   signed in on the forum. Same Google/password account; same `@cemvp/auth-ui` modal.
   Google OAuth return to :3001 requires `AUTH_REDIRECT_ORIGINS` to include
   `http://localhost:3001` on the Convex deployment (password login does not).
4. Forum `next.config` redirects `/admin` and `/admin/:path*` to
   `NEXT_PUBLIC_ADMIN_ORIGIN` (default `http://localhost:3001`).
5. Production cookie SSO / shared parent domain remains post-extraction work.

## URLs stay canonical-per-00-ROUTES

This doc decides *which app serves* a URL; `00-ROUTES.md` decides *what the URL is*.
Admin paths remain `/admin`, `/admin/home`, `/admin/moderation`, … (not flattened).
