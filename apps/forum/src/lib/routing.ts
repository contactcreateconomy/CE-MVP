/**
 * routing — SLICE-P2-06: Platform-Wide Routing Convention (F-15 resolution).
 *
 * CONTRACT-1-app-shell §1 (quoted):
 *   (1) anonymous on protected route → `/signin`
 *   (2) `pending_context` on any route ≠ `/welcome` → `/welcome`
 *   (3) `complete` on `/signin`/`/waitlist`/`/welcome` → `/feed`
 *   (4) server-side CAP-005 guard remains the security boundary — client
 *       routing is UX convenience
 *
 * Usage: wrap protected pages in `<ProtectedRoute>` or call
 * `getRoutingRedirect()` in a server component/middleware.
 */

export type BootstrapState = "pending_context" | "complete" | undefined;
export type AuthState = "anonymous" | "authenticated";

const PREF_ROUTES = ["/signin", "/waitlist", "/welcome"];

/**
 * The genuinely member-only routes — everything else defaults to public.
 * CONTRACT-1-app-shell §1 Rule 1 (verbatim): "Anonymous user hits any
 * *protected/authed* route → redirect to `/signin`" — the convention is
 * scoped to a defined set of protected routes, not "everything not on an
 * allowlist." An earlier pass here (2026-09-18 screen audit) inverted
 * this into a short PUBLIC_ROUTES allowlist, which — once RoutingGuard
 * was wired at the true app root in the same pass — silently redirected
 * anonymous visitors away from every contract-mandated anonymous surface
 * (`/tools`, `/discussions/[slug]`, `/personas`, `/search`, `/resources`,
 * `/s/[handle]`, every trust page, `/legal/intake`, `/users/[handle]`,
 * …) since none of them were on the short list. Prefix-matched so a
 * dynamic segment (`/settings/profile`) inherits its parent's gate.
 * Sourced from each screen's own CONTRACT-*-FINAL §1 "Actor" / "Route &
 * Access" line — every prefix below is quoted "member" + "No anonymous
 * access" in its contract, not a guess.
 */
const PROTECTED_ROUTE_PREFIXES = [
  "/new-post", // CONTRACT-2-compose: member only
  "/profile", // CONTRACT-5-settings-profile family: member only
  "/settings", // ditto
  "/setup", // CONTRACT-5-setup: member only (profile-completion step)
  "/notifications", // CONTRACT-7-notifications: recipient-private, member only
  "/appeal", // CONTRACT-7-appeal §1: "no anonymous access"
  "/contribute", // CONTRACT-6-contribute §1: "member only. No anonymous access"
  "/sell", // CONTRACT-6-sell + CONTRACT-6-sell-apply §1: "No anonymous access" (covers /sell/apply too)
  "/drafts", // SLICE CAP-532 My Drafts — the member's own local drafts
];

/**
 * Compute the redirect target per the convention. Returns null = stay.
 * Pure function — same logic usable client and server side.
 */
export function getRoutingRedirect(
  pathname: string,
  auth: AuthState,
  bootstrapState: BootstrapState,
): string | null {
  // Rule 1: anonymous on protected route → /signin
  if (auth === "anonymous" && isProtectedRoute(pathname)) {
    return "/signin";
  }

  // Rule 2: pending_context on ≠ /welcome → /welcome
  if (auth === "authenticated" && bootstrapState === "pending_context" && pathname !== "/welcome") {
    return "/welcome";
  }

  // Rule 3: complete on /signin, /waitlist, /welcome → /feed
  if (auth === "authenticated" && bootstrapState === "complete" && PREF_ROUTES.includes(pathname)) {
    return "/feed";
  }

  return null;
}

/** True when the route requires authentication (matches a protected prefix). */
export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
