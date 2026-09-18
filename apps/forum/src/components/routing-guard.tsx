"use client";

/**
 * RoutingGuard — CONTRACT-1-app-shell §1, Platform-Wide Routing Convention
 * (F-15). Mounted once at the true app root (inside the auth + Convex
 * providers, outside every route group) so it applies to every route, not
 * just `/signin`'s own local rule-3 check.
 *
 * Rule 4 is NOT this component's job: "Any write attempted by a
 * non-complete user is rejected server-side regardless of client
 * routing" — CAP-005's guard is the actual security boundary. This is
 * UX convenience only, exactly as the convention states.
 */

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "convex/react";
import { useAuth } from "@cemvp/auth-ui";

import { api } from "../../../../convex/_generated/api";
import { getRoutingRedirect, type AuthState } from "@/lib/routing";

export function RoutingGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const { authStatus } = useAuth();

  const bootstrap = useQuery(
    api.bootstrap.getMyBootstrapState,
    authStatus === "authenticated" ? {} : "skip",
  );

  useEffect(() => {
    if (authStatus === "loading") return; // don't redirect on an unresolved session

    const auth: AuthState = authStatus === "authenticated" ? "authenticated" : "anonymous";
    // Avoid a flash-redirect: an authenticated session whose bootstrapState
    // hasn't resolved yet must not be treated as either rule-2 or rule-3.
    if (auth === "authenticated" && bootstrap === undefined) return;

    const dest = getRoutingRedirect(pathname, auth, bootstrap?.bootstrapState);
    if (dest && dest !== pathname) router.replace(dest);
  }, [pathname, authStatus, bootstrap, router]);

  return null;
}
