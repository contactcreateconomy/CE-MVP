"use client";

/**
 * RoutingGuard — CONTRACT-1-app-shell §1, Platform-Wide Routing Convention
 * (F-15). Mounted once at the true app root (inside the auth + Convex
 * providers, outside every route group) so it applies to every route, not
 * just `/signin`'s own local rule-3 check.
 *
 * Founder override 2026-09-18: `/welcome` is retired. When a signed-in
 * user is still `pending_context`, this guard silently finalizes bootstrap
 * (browser IANA timezone, UTC fallback) per DECISIONS-LOCKED #2 instead
 * of redirecting to a chooser. CAP-005 stays the write-side security
 * boundary until that mutation lands.
 *
 * Rule 4 is NOT this component's job: "Any write attempted by a
 * non-complete user is rejected server-side regardless of client
 * routing" — CAP-005's guard is the actual security boundary. This is
 * UX convenience only, exactly as the convention states.
 */

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { useAuth } from "@cemvp/auth-ui";

import { api } from "../../../../convex/_generated/api";
import { getRoutingRedirect, type AuthState } from "@/lib/routing";

function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function RoutingGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const { authStatus } = useAuth();
  const finalizeWelcome = useMutation(api.bootstrap.finalizeWelcome);
  const attemptedFinalize = useRef(false);

  const bootstrap = useQuery(
    api.bootstrap.getMyBootstrapState,
    authStatus === "authenticated" ? {} : "skip",
  );

  useEffect(() => {
    if (authStatus !== "authenticated") {
      attemptedFinalize.current = false;
      return;
    }
    if (bootstrap?.bootstrapState !== "pending_context") return;
    if (attemptedFinalize.current) return;
    attemptedFinalize.current = true;

    const timezone = browserTimezone();
    void finalizeWelcome({ timezone }).catch((err) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Write-once conflict")) return;
      if (msg.includes("Guard failure")) return;
      if (timezone !== "UTC" && msg.includes("Invalid timezone")) {
        void finalizeWelcome({ timezone: "UTC" }).catch(() => {
          // CAP-005 still blocks writes until complete; do not loop.
        });
      }
    });
  }, [authStatus, bootstrap, finalizeWelcome]);

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
