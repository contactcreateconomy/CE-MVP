# CLAUDE.md

## Project overview
- This is a Next.js 14 App Router frontend written in TypeScript.
- UI uses Tailwind CSS plus CSS custom properties defined in `src/app/globals.css`.
- The app is currently mock-data driven; most pages read from `src/lib/mock-data` and shared types in `src/types`.
- The main product shell for authenticated/app routes lives under `src/app/(app)`.

## Commands
- Install dependencies: `pnpm install`
- Run dev server: `npm run dev -- --port 3000`
- Build: `npm run build`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`

## Code structure
- `src/app/` — App Router layouts, pages, global styles, local fonts.
- `src/app/(app)/` — main in-app routes rendered inside the app shell.
- `src/components/layout/` — app chrome (top nav, sidebars, shell, mobile tab bar).
- `src/components/feed/` — feed-specific UI and client interactions.
- `src/components/ui/` — reusable primitive UI components.
- `src/components/states/` — loading, empty, and error state components.
- `src/lib/mock-data/` — mock domain data used by pages/components.
- `src/lib/` — helpers (`cn` in `utils.ts`, formatting, adapters, domain logic).
- `src/types/` — shared domain models and API contracts.
- `src/providers/` — global providers like the theme provider.

## Conventions
- Use the `@/*` path alias defined in `tsconfig.json` for imports from `src`.
- Prefer existing shared types from `src/types/index.ts` instead of redefining route-local interfaces when a domain model already exists.
- Prefer extending existing UI primitives in `src/components/ui/` before creating new one-off components.
- Keep page files focused on route composition and data preparation; move interactive state into client components.
- Follow the existing pattern of colocating feature-specific components under `src/components/<feature>/`.
- Reuse `cn()` from `src/lib/utils.ts` for className composition.

## Styling
- The design system is driven by CSS variables in `src/app/globals.css` (surface, text, border, brand, radius, shadow tokens).
- Dark mode is the default theme via `ThemeProvider` in `src/app/layout.tsx`.
- Prefer semantic CSS variables such as `var(--bg-surface)` and `var(--text-primary)` over hardcoded colors when editing existing UI.
- Reuse existing utility classes such as `card-surface`, `canvas-dot-grid`, and animation helpers before adding new global classes.
- Keep Tailwind usage consistent with the current codebase: utility-first styling in components, shared tokens in globals.

## Data and backend integration
- Many route files document intended backend endpoints in file comments. Preserve and update those comments when wiring real APIs.
- The current app uses mock data exports from `src/lib/mock-data/index.ts`; if replacing with real data, do so incrementally and keep types aligned.
- Treat route-level sorting/filtering logic as app behavior that may later move server-side, but do not over-abstract prematurely.

## Practical guidance for edits
- Check whether a component is a server component or client component before adding hooks or browser APIs.
- If a component needs state, effects, clipboard access, or `navigator`, keep it in a `"use client"` component.
- When changing layout, verify interactions with `AppShell` so desktop sidebars and the mobile tab bar continue to work.
- When adding images, remember `next.config.mjs` currently allows remote images from `images.unsplash.com`.

## Known local workflow note
- This repo uses `pnpm-lock.yaml`. If dependency installation or Next.js auto-install hits virtual store issues, rerun `pnpm install` from the project root.
