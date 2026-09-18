import { redirect } from "next/navigation";

/**
 * Route: /welcome — retired 2026-09-18 (founder).
 *
 * DECISIONS-LOCKED #2: timezone is auto-detected silently; `pending_context`
 * is no longer a chooser trap. RoutingGuard finalizes bootstrap on any
 * signed-in session. Old bookmarks land on `/feed`.
 */
export default function WelcomePage() {
  redirect("/feed");
}
