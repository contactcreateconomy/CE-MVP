# Forum app (`apps/forum`)

Next.js **App Router** frontend for the Createconomy forum. Data and auth come from the shared **Convex** backend in the monorepo root (`convex/`).

## Docs (start here)

| Topic | Location |
|-------|----------|
| Env vars, OAuth, Vercel | [README.md](../../README.md) (repo root) |
| Stack versions, diagram | [docs/architecture.md](../../docs/architecture.md) |
| Run + seed | [docs/quick-start.md](../../docs/quick-start.md) |
| Convex tables / API map | [docs/schema-forum.md](../../docs/schema-forum.md) |
| Scale, crons, subscriptions | [docs/forum-capacity.md](../../docs/forum-capacity.md) |

## Local dev

From **repository root** (recommended):

```bash
pnpm install
cp apps/forum/.env.example apps/forum/.env.local
# Set NEXT_PUBLIC_CONVEX_URL in .env.local
pnpm convex:seed-forum   # if empty
pnpm dev                # forum dev server
```

App scripts use plain **`next dev`** / **`next build`** (Turbopack — the --webpack flag was removed from package.json 2026-05-08; next.config.mjs aliases convex/@convex-dev/auth so the shared context works under Turbopack too).

## Notable implementation details

- **`SharedDataProvider`** — single subscription for categories + unread notification count; use **`useSharedData()`** on new pages instead of duplicating **`listCategories`**.
- **Convex hooks** — components that call **`useQuery`** must run under **`ConvexProvider`**; guard with **`isConvexConfigured()`** where the app must prerender without a Convex URL.
- **`/new-post`** — Distraction-free compose layout (`(compose)` route group); TipTap editor is **`React.lazy`**-loaded to keep initial bundles smaller.
