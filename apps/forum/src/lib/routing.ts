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

/** The auth/pref-route groups — routes NOT requiring authentication. */
const PUBLIC_ROUTES = ["/", "/signin", "/waitlist", "/welcome", "/privacy", "/dmca", "/terms", "/feed"];
const PREF_ROUTES = ["/signin", "/waitlist", "/welcome"];

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
  if (auth === "anonymous" && !PUBLIC_ROUTES.includes(pathname)) {
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

/** True when the route requires authentication (not in PUBLIC_ROUTES). */
export function isProtectedRoute(pathname: string): boolean {
  return !PUBLIC_ROUTES.includes(pathname);
}
