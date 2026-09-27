---
id: RAW-INVENTORY
type: REPORT
author-model: GLM 5.3
tool: zcode
round: 1
status: DONE
date: 2026-09-27
---

# RAW-INVENTORY — CE-MVP frontend, as found (facts only)

Sources: package.json files, filesystem scans, graphify graph.json (4,508 nodes / 10,507 edges), file reads. No opinions.

## A. UI dependencies

| Concern | apps/forum | apps/admin | packages/auth-ui (peer) |
|---|---|---|---|
| Framework | next 16.3.3, react/react-dom 19.2.4 | next 16.3.3, react/react-dom 19.2.4 | react ^19 |
| Styling | tailwindcss ^4.2.2 (@tailwindcss/postcss, CSS-first — no tailwind.config file) | tailwindcss ^4.2.2 (same) | — (consumes host tokens) |
| Component libs | @radix-ui/react-{avatar,dialog,dropdown-menu,select,tabs,tooltip} | same 6 Radix packages | react-dialog ^1.1 |
| Utility styling | class-variance-authority ^0.7.1, clsx ^2.1.1, tailwind-merge ^3.5.0 | same | same (peer) |
| Motion | motion ^12.34.3 | motion ^12.34.3 | — |
| Icons | lucide-react ^0.575.0 | lucide-react ^0.575.0 | lucide-react (peer) |
| Fonts | next/font/local — Geist Sans + Geist Mono (`src/app/fonts/`, vars `--font-geist-sans` / `--font-geist-mono`) | (not inventoried) | — |
| PWA | none (no next-pwa / workbox / serwist anywhere) | none | — |
| Forms | none (no react-hook-form / zod /formik in deps — forms are hand-rolled) | none | — |
| State/data | zustand ^5.0.12, @tanstack/react-virtual ^3.13.23, convex ^1.34.1, @convex-dev/auth ^0.0.95, next-themes ^0.4.6 | convex, @convex-dev/auth, next-themes | @convex-dev/auth, convex (peer) |
| Editor / content | @tiptap/{react,starter-kit,extension-link,extension-placeholder,extension-underline} ^3.31.3, react-markdown ^10.1.0 | react-markdown ^10.1.0 | — |
| Analytics | @vercel/analytics ^2.0.1, @vercel/speed-insights ^2.0.0 | — | — |
| Drawer lib | none (no vaul) | none | — |

## B. Design-token files

| Path | Token categories | Count |
|---|---|---|
| `apps/forum/src/app/globals.css` | `@theme inline` block + CSS custom properties: text 72, color 63, z 26, shadow 24, feedback 24, type 22, glow 20, container 18, space 16, ease 14, duration 14, radius 13, bg 12, brand 9, cat 8 (+ smaller namespaces) | 394 `--*` declarations |
| `apps/admin/src/app/globals.css` | same structure (shared token system) | 394 `--*` declarations |

No tailwind.config.* exists anywhere (Tailwind v4 CSS-first). No other token/theme files found.

## C. Mobile / app-feel infrastructure

| Feature | Status | Evidence / path |
|---|---|---|
| Viewport config (`export const viewport`) | MISSING | no match in any layout (Next default meta only) |
| Web manifest | MISSING | no manifest.{ts,json} under apps/forum; no manifest ref in layout |
| Service worker | MISSING | no sw/serviceWorker/workbox refs in src or public |
| Icons / apple-touch-icon | MISSING | apps/forum/public/ is empty |
| safe-area usage | PRESENT (2 uses) | `components/layout/app-shell.tsx:32` (footer pb), `components/new-post/new-post-composer.tsx:734` (fixed bottom bar) |
| Bottom tab bar | PRESENT | `components/layout/mobile-tab-bar.tsx` (+ rendered in app-shell.tsx, content-shell.tsx) |
| Drawer / sheet component | PARTIAL — Radix `dialog.tsx` + `interstitial.tsx`; no sheet.tsx/drawer.tsx/vaul | `components/ui/dialog.tsx` |
| Gesture / touch handling | MINIMAL (1 file) | `components/feed/top-post-hero-carousel.tsx` (touch) |
| theme-color | MISSING | no themeColor/theme-color refs |
| Standalone display mode | MISSING (requires manifest) | — |

## D. Component inventory (136 files)

imported-by = distinct files with an import edge in graphify graph.json (relations: imports, imports_from, dynamic_import, re_exports).

| Path | Exports | LOC | imported-by |
|---|---|---|---|
| compose/compose-shell.tsx | triggerComposePublish; ComposeShell | 70 | 2 |
| compose/tag-picker.tsx | TagPickerProps; TagPicker | 80 | 0 |
| consent/cmp-overlay.tsx | CmpOverlay | 118 | 1 |
| content/ai-key-takeaways.tsx | AIKeyTakeaways | 54 | 1 |
| content/comment-card.tsx | CommentCard | 234 | 1 |
| content/comment-thread.tsx | CommentThread | 275 | 1 |
| content/content-page.tsx | ContentPageProps; ContentPage | 211 | 2 |
| content/creator-panel.tsx | CreatorPanel | 170 | 1 |
| content/engagement-panel.tsx | EngagementPanel | 87 | 1 |
| content/post-block.tsx | PostBlock | 323 | 1 |
| content/reply-composer.tsx | ReplyComposer | 128 | 1 |
| content/thread-intelligence-panel.tsx | ThreadIntelligencePanel | 132 | 1 |
| content/thread-mode-bar.tsx | ViewMode; ThreadModeBar | 111 | 2 |
| discussion/brief-toast.tsx | BriefToast | 14 | 1 |
| discussion/canonical-thread.tsx | CanonicalThread | 402 | 2 |
| discussion/categories/GenericBody.tsx | GenericBody | 29 | 1 |
| discussion/categories/compare/CompareBody.tsx | CompareBody | 104 | 1 |
| discussion/categories/compare/index.tsx | compareTemplate | 9 | 1 |
| discussion/categories/debate/DebateBody.tsx | DebateBody | 127 | 1 |
| discussion/categories/debate/DebateCardExtras.tsx | DebateCardExtras | 39 | 1 |
| discussion/categories/debate/index.tsx | debateTemplate | 12 | 1 |
| discussion/categories/gigs/GigsBody.tsx | GigsBody | 201 | 1 |
| discussion/categories/gigs/GigsCardExtras.tsx | GigsCardExtras | 36 | 1 |
| discussion/categories/gigs/index.tsx | gigsTemplate | 12 | 1 |
| discussion/categories/launch-pad/LaunchpadBody.tsx | LaunchpadBody | 122 | 1 |
| discussion/categories/launch-pad/index.tsx | launchpadTemplate | 15 | 1 |
| discussion/categories/list/ListBody.tsx | ListBody | 78 | 1 |
| discussion/categories/list/ListInsights.tsx | ListInsights | 41 | 1 |
| discussion/categories/list/index.tsx | listTemplate | 11 | 1 |
| discussion/categories/news/NewsBody.tsx | NewsBody | 101 | 1 |
| discussion/categories/news/NewsInsights.tsx | NewsInsights | 44 | 1 |
| discussion/categories/news/index.tsx | newsTemplate | 11 | 1 |
| discussion/categories/qa/QaBody.tsx | QaBody | 78 | 1 |
| discussion/categories/qa/QaInsights.tsx | QaInsights | 26 | 1 |
| discussion/categories/qa/index.tsx | qaTemplate | 12 | 1 |
| discussion/categories/registry.ts | getCategoryTemplate | 35 | 4 |
| discussion/categories/review/ReviewBody.tsx | ReviewBody | 98 | 1 |
| discussion/categories/review/ReviewCardExtras.tsx | ReviewCardExtras | 48 | 1 |
| discussion/categories/review/ReviewInsights.tsx | ReviewInsights | 30 | 1 |
| discussion/categories/review/index.tsx | reviewTemplate | 14 | 1 |
| discussion/categories/showcase/ShowcaseBody.tsx | ShowcaseBody | 152 | 1 |
| discussion/categories/showcase/index.tsx | showcaseTemplate | 15 | 1 |
| discussion/categories/spark/SparkBody.tsx | SparkBody | 29 | 1 |
| discussion/categories/spark/index.tsx | sparkTemplate | 13 | 1 |
| discussion/categories/types.ts | CategoryTemplate | 39 | 11 |
| discussion/category-bodies.tsx | CategoryThreadBody | 32 | 0 |
| discussion/discussion-page-loader.tsx | DiscussionPageLoader | 46 | 1 |
| discussion/formatted-body.tsx | BodySegment; parseBodySegments; FormattedBody | 77 | 10 |
| discussion/insight-rail-extras.tsx | InsightRailExtras | 12 | 0 |
| discussion/post-detail-client.tsx | PostDetailClient | 375 | 1 |
| discussion/report-modal.tsx | ReportModal | 81 | 1 |
| discussion/thread-discussion-context.tsx | ThreadDiscussionContextValue; ThreadDiscussionProvider; useThreadDiscussion | 57 | 2 |
| discussion/thread-header.tsx | ThreadHeader | 343 | 0 |
| discussion/thread-sidebar.tsx | ThreadSidebarPreview; ThreadSidebar | 196 | 0 |
| error-boundary.tsx | ErrorBoundary | 52 | 1 |
| feed/canonical-feed-client.tsx | CanonicalFeedClient | 264 | 2 |
| feed/comments-preview-cycler.tsx | CommentsPreviewCycler | 55 | 1 |
| feed/feed-undo-toast.tsx | FeedUndoToast | 33 | 0 |
| feed/post-actions-menu.tsx | PostActionsMenu | 54 | 1 |
| feed/post-card.tsx | PostCard; PostCardSkeleton | 207 | 0 |
| feed/post-interaction-row.tsx | PostInteractionRow | 123 | 1 |
| feed/report-post-dialog.tsx | ReportPostDialog | 62 | 1 |
| feed/top-post-hero-carousel.tsx | TopPostHeroCarousel; TopPostHeroCarouselSkeleton; TopPostHeroCarouselEmpty | 779 | 1 |
| feed/trend-sorter.tsx | FeedSortMode; TrendSorter | 57 | 1 |
| ladder/a8-ladder.tsx | A8Ladder | 109 | 1 |
| layout/app-shell.tsx | AppShell | 50 | 1 |
| layout/conditional-right-sidebar.tsx | ConditionalRightSidebar | 14 | 1 |
| layout/content-shell.tsx | ContentShell | 26 | 2 |
| layout/featured-widget.tsx | FeaturedWidget | 116 | 1 |
| layout/left-sidebar.tsx | LeftSidebar | 147 | 1 |
| layout/mobile-tab-bar.tsx | MobileTabBar | 57 | 2 |
| layout/podium-widget.tsx | PodiumWidget | 165 | 1 |
| layout/right-sidebar.tsx | RightSidebar | 85 | 1 |
| layout/top-nav.tsx | TopNav | 482 | 2 |
| layout/top-post-hero-section.tsx | TopPostHeroSection | 61 | 1 |
| layout/whats-vibing-widget.tsx | WhatsVibingWidget | 128 | 1 |
| legal/legal-doc-page.tsx | LegalDocPage | 91 | 10 |
| new-post/composer-product-block.tsx | TaggedProduct; productTokens; ComposerProductBlock | 125 | 1 |
| new-post/new-post-composer.tsx | NewPostComposer | 774 | 1 |
| new-post/typed-fields-panel.tsx | REVIEW_DIMENSIONS; TypedFieldsState; EMPTY_TYPED_FIELDS; linesToList; TypedFieldsPanel | 375 | 1 |
| newsletter/newsletter-overlay.tsx | NewsletterOverlay | 80 | 1 |
| profile/canonical-profile.tsx | CanonicalProfile | 280 | 1 |
| routing-guard.tsx | RoutingGuard | 85 | 1 |
| states/empty-state.tsx | EmptyState | 21 | 0 |
| states/error-state.tsx | ErrorState | 20 | 0 |
| states/loading-state.tsx | LoadingState | 14 | 0 |
| trust/provenance-footer.tsx | ProvenanceFooter | 45 | 4 |
| ui/avatar-with-name.tsx | NativeAvatarProps; Component | 148 | 1 |
| ui/avatar.tsx | (re-export barrel) | 58 | 3 |
| ui/badge.tsx | BadgeProps; Badge; Tag | 61 | 23 |
| ui/banner.tsx | BannerVariant; BannerProps; Banner | 119 | 12 |
| ui/button.tsx | ButtonProps | 76 | 47 |
| ui/card.tsx | CardProps; Card; CardHeader; CardContent; CardInteractive | 54 | 50 |
| ui/checkbox.tsx | CheckboxProps; Checkbox | 70 | 5 |
| ui/combobox.tsx | ComboboxOption; ComboboxProps; SearchableCombobox | 317 | 2 |
| ui/command-palette.tsx | CommandItem; CommandSection; CommandPaletteProps; CommandPalette | 266 | 2 |
| ui/createconomy-logo-full.tsx | CreateconomyLogoFull; CreateconomyWordmark | 48 | 3 |
| ui/createconomy-logo-mark.tsx | CreateconomyLogoMark | 46 | 4 |
| ui/data-table/index.tsx | SortDirection; DataTableColumn; DataTableProps; DataTable; DataTableToolbar; DataTablePagination | 468 | 2 |
| ui/datetime-picker/index.tsx | DatetimePickerProps; DatetimePicker | 448 | 2 |
| ui/dialog.tsx | DialogContentProps | 130 | 3 |
| ui/dropdown-menu.tsx | (Radix re-exports) | 185 | 0 |
| ui/dropzone.tsx | DropzoneStatus; DropzoneFileChip; DropzoneProps; FileDropzone | 175 | 2 |
| ui/empty-state.tsx | EmptyStateProps; EmptyState | 75 | 8 |
| ui/glowing-effect.tsx | (default) | 196 | 2 |
| ui/image-uploader.tsx | ImageUploader | 241 | 1 |
| ui/input.tsx | InputProps | 44 | 10 |
| ui/interactive-hover-button.tsx | (default) | 40 | 0 |
| ui/interstitial.tsx | InterstitialVariant; InterstitialProps; Interstitial | 134 | 1 |
| ui/navigation-progress-bar.tsx | NavigationProgressBar | 39 | 1 |
| ui/network-hover-card.tsx | NetworkAvatarCard | 154 | 1 |
| ui/pdf-viewer.tsx | PdfViewerProps; PdfViewer | 145 | 0 |
| ui/queue-board/index.tsx | QueueSeverity; QueueCase; QueueBoardProps; QueueBoard | 270 | 2 |
| ui/reading-affordances.tsx | ReadingProgressBar; ScrollToTop | 67 | 1 |
| ui/select.tsx | (Radix re-exports) | 138 | 4 |
| ui/skeleton.tsx | Skeleton; SkeletonText; SkeletonHeading; SkeletonAvatar; SkeletonImage; SkeletonButton; Spinner | 69 | 15 |
| ui/switch.tsx | SwitchProps; Switch | 63 | 0 |
| ui/tabs.tsx | (Radix re-exports) | 66 | 0 |
| ui/tiered-ladder.tsx | SIGNAL_LEVELS; SignalLevel; LadderRevealState; LadderAssignmentStatus; TieredLadderRung; LadderProgress; TieredLadderProps; TieredLadder | 277 | 2 |
| ui/toast.tsx | ToastVariant; ToastProps; Toast | 84 | 2 |
| ui/toggle-switch.tsx | ToggleMode; ModeToggleProps; ModeToggle | 103 | 3 |
| ui/tooltip.tsx | (Radix re-exports) | 64 | 1 |
| ui/use-scroll.ts | useScroll | 36 | 1 |
| ui/user-avatar.tsx | UserAvatar | 78 | 6 |
| **packages/auth-ui** src/app-auth-provider.tsx | AppAuthProvider; useAppAuth; useAuth | 211 | 35 |
| packages/auth-ui src/auth-context.tsx | AuthContextValue; AuthContext; useAuthContext; AuthContextProvider | 46 | 2 |
| packages/auth-ui src/auth-modal.tsx | AuthModal | 181 | 5 |
| packages/auth-ui src/index.ts | (barrel) | 12 | 34 |
| packages/auth-ui src/login-form.tsx | LoginForm | 194 | 1 |
| packages/auth-ui src/offline-auth-provider.tsx | OfflineAuthProvider | 96 | 5 |
| packages/auth-ui src/signup-form.tsx | SignupForm | 392 | 1 |
| packages/auth-ui src/social-login-buttons.tsx | SocialLoginButtons | 101 | 1 |
| packages/auth-ui src/types.ts | AuthStatus; AuthMode; SocialAuthProvider; AuthUser; LoginPayload; SignupPayload | 29 | 9 |
| packages/auth-ui src/ui/button.tsx | ButtonProps | 43 | 3 |
| packages/auth-ui src/ui/input.tsx | InputProps | 23 | 2 |
| packages/auth-ui src/utils/cn.ts | cn | 7 | 5 |

Paths under `apps/forum/src/components/` unless prefixed. 0-imported-by files (18): tag-picker, category-bodies, insight-rail-extras, thread-header, thread-sidebar, feed-undo-toast, post-card, dropdown-menu, interactive-hover-button, pdf-viewer, switch, tabs, states/* (3).

## E. Core routes (16)

### Summary

| Route | Page LOC | Structure | Convex calls | skeleton | loading | empty | error | markers |
|---|---|---|---|---|---|---|---|---|
| /landing | 189 | full client page | 2 in page: `admission.getEffectiveMode`, `waitlist.join` | no | no (fail-closed default `?? "closed"`) | n/a | yes (`role=alert` verbatim) | 1 (input attr) |
| /signin | 202 | full client page | 2 in page: `admission.getEffectiveMode`, `waitlist.join` | no | "Loading…" text page | n/a | yes (Banner gate states: waitlist-error/rate-ip/rate-email) | 1 (input attr) |
| /welcome | 12 | **redirect → /feed** (307) | 0 | — | — | — | — | 0 |
| /setup | 9 | wrapper → SetupPageClient (382 LOC) | 5 in child: `setup.getSetupState`, `setup.listInterestTiles`, `setup.upsertBasic`, `setup.mobileSendOtp`, `setup.mobileVerify` | no | inline `animate-spin` | "No interest tiles available yet." / "Member record not found" | error `<p>` + OTP msgs; not-configured + unauthenticated cards | 3 (input attrs) |
| /feed | 44 | RSC wrapper → CanonicalFeedClient (264 LOC) in `Suspense fallback={null}` | 6 in child: `feed.getChrome`, `feed.list`, `feed.getWhy` (×2 incl. gated), `feed.cardAction`, `feed.unhide` | no | inline spinner + "Loading…" buttons | "The feed is forming…" / fav-sort "Nothing saved yet…" | **none found** | 0 |
| /discussions/[slug] | 42 | RSC shell → DiscussionPageLoader (46 LOC) | 1 in child: `posts.detail.getDetail` | no (**returns null** — blank while loading) | same | "Discussion not found" | none found; guard "Connect Convex…" | 0 |
| /new-post | 8 | wrapper → NewPostPageClient (49 LOC) → React.lazy NewPostComposer (774 LOC) | 0 direct (categories via `useSharedData()` → provider `categories.listPostTypes`) | no | "Loading editor…" text | none found | none found; guard "Connect Convex…" | 0 |
| /users/[handle] | 23 | wrapper → UserProfilePageClient (42 LOC) | 1 in child: `profile.page.getProfilePage` | no (**returns null**) | same | "User not found / No profile matches @{handle}" | none found; guard | 0 |
| /profile | 10 | **redirect → /settings/profile** | 0 | — | — | — | — | 0 |
| /notifications | 8 | wrapper → NotificationsPageClient (171 LOC) | 3 in child: `notifications.reads.list`, `notifications.reads.markRead`, + imperative `convex.query(reads.list)` for Load-more | **yes — Skeleton ×3** (only route) | "Loading…" on Load-more | "No notifications yet" | none found; anon sign-in card | 1 (comment saying "never a fabricated placeholder") |
| /search | 28 | RSC wrapper → SearchPageClient (91 LOC) | 2 in child: `search.searchLog` (telemetry, errors swallowed), `search.searchQuery` | no | inline spinner | per-group "No matching posts/tools/members." | none found; `!configured → null` (blank) | 1 (input attr) |
| /discover | 8 | wrapper → DiscoverPageClient (60 LOC) | 0 direct (via useSharedData provider) | no (**returns null**) | same | "No categories loaded. Refresh…" | none found; guard | 0 |
| /category/[slug] | 37 | validates slug vs KNOWN_CATEGORIES (post types: news/review/compare/launch-pad/debate/help/qa/list/showcase/gigs) → CategoryPreviewLoader → static seed, "zero Convex, zero DB" | **0 (static)** | n/a | n/a | n/a | notFound() 404 for unknown slug | 0 |
| /leaderboard | 11 | wrapper → LeaderboardPageClient (230 LOC) | 1 in child: `feed.getChrome` (podium derived client-side; "interim derivation until M12 projections exist") | none found | — ("Podium is forming" doubles as loading+empty) | "Podium is forming … needs 25 eligible contributors — {n} so far" (MIN_CONTRIBUTORS=25) | none found; guard | 0 |
| /drafts | 12 | wrapper → DraftsPageClient (116 LOC) | **0 — localStorage only** (CAP-531 server drafts pending) | no | spinner while `!mounted` | "No drafts yet." + CTA | silent try/catch, no error UI | 0 |
| /settings | 11 | **redirect → /settings/profile** | 0 | — | — | — | — | 0 |

### Marker detail

All 7 marker hits are the literal word "placeholder": 6 are JSX `<input placeholder=…>` attributes (`landing/page.tsx:105`, `signin/page.tsx:133`, `setup-page-client.tsx:120/135/305`, `search-page-client.tsx:51`); 1 is a comment explicitly *denying* a placeholder (`notifications-page-client.tsx:114`). **Zero TODO / FIXME / MISSING / "coming soon" / "not implemented" / "stub"** across all 16 pages + delegated children.

### Cross-cutting facts

- 9 of 16 routes are thin wrappers (≤44 LOC) delegating to one client component.
- Loading-UI patterns: 5× inline spinner, 3× returns-null blank, 2× "Loading…" text, 1× Suspense fallback=null, 1× Skeleton. Only /notifications uses the Skeleton component.
- Error UI: only /landing, /signin, /setup render error messages; 8 routes have no error state at all.
- 4 routes render a "Connect Convex…" / not-configured guard card.
- /profile, /settings, /welcome are permanent redirects (retired routes).

## F. All other forum routes (32)

Comps = local imports (`from "@/…`) in the page file. Markers = TODO/FIXME/MISSING/placeholder/"coming soon" occurrences.

| Route | Page file | LOC | Comps | Markers |
|---|---|---|---|---|
| / | app/page.tsx | 9 | 0 | 0 |
| /waitlist | (auth)/waitlist/page.tsx | 123 | 6 | 1 |
| /kit | (app)/kit/page.tsx | 268 | 10 | 1 |
| /content | (content)/content/page.tsx | 11 | 0 | 0 |
| /content/spark | (content)/content/spark/page.tsx | 14 | 0 | 0 |
| /contribute | (content)/contribute/page.tsx | 22 | 0 | 0 |
| /go/[linkId] | (content)/go/[linkId]/page.tsx | 20 | 0 | 1 |
| /personas | (content)/personas/page.tsx | 16 | 0 | 0 |
| /personas/[id] | (content)/personas/[id]/page.tsx | 17 | 0 | 0 |
| /resources | (content)/resources/page.tsx | 21 | 0 | 0 |
| /resources/[slug]/view | (content)/resources/[slug]/view/page.tsx | 18 | 0 | 0 |
| /s/[handle] | (content)/s/[handle]/page.tsx | 16 | 0 | 0 |
| /s/[handle]/[product] | (content)/s/[handle]/[product]/page.tsx | 20 | 0 | 0 |
| /tools | (content)/tools/page.tsx | 19 | 0 | 0 |
| /tools/[slug] | (content)/tools/[slug]/page.tsx | 25 | 0 | 0 |
| /about | (shell)/about/page.tsx | 20 | 2 | 0 |
| /ai-disclosure | (shell)/ai-disclosure/page.tsx | 19 | 2 | 0 |
| /appeal/[actionId] | (shell)/appeal/[actionId]/page.tsx | 138 | 4 | 1 |
| /dmca | (shell)/dmca/page.tsx | 16 | 2 | 0 |
| /editorial-policy | (shell)/editorial-policy/page.tsx | 19 | 2 | 0 |
| /help | (shell)/help/page.tsx | 19 | 2 | 0 |
| /how-we-review | (shell)/how-we-review/page.tsx | 19 | 2 | 0 |
| /how-we-use-your-store-data | (shell)/how-we-use-your-store-data/page.tsx | 19 | 2 | 0 |
| /legal/intake | (shell)/legal/intake/page.tsx | 259 | 4 | 0 |
| /privacy | (shell)/privacy/page.tsx | 16 | 2 | 0 |
| /repeat-infringer | (shell)/repeat-infringer/page.tsx | 17 | 2 | 0 |
| /terms | (shell)/terms/page.tsx | 16 | 2 | 0 |
| /sell | (shell)/sell/page.tsx | 24 | 0 | 0 |
| /sell/apply | (shell)/sell/apply/page.tsx | 21 | 0 | 0 |
| /settings/profile | (shell)/settings/profile/page.tsx | (not in "other" scan — it is the live settings target) | — | — |
| /sell dashboard sub-routes | (see apps/forum/src/app/(app)/(shell)/sell/) | — | — | — |

Notes: the 8 legal/static pages share the same 2-import pattern (LegalDocPage + one shared element). /legal/intake (259 LOC) and /appeal/[actionId] (138 LOC) are the two real form pages outside the core set. /waitlist (123) and /kit (268) are the largest non-core pages.
