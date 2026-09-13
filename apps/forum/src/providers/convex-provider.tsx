"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { ConvexReactClient, ConvexProvider as ConvexProviderBase } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";

import { getConvexUrl } from "@cemvp/convex-client";

export function ConvexProvider({ children }: { children: ReactNode }) {
  const convexUrl = getConvexUrl();

  const client = useMemo(() => {
    // Offline/build guard: convex/react's useQuery/useMutation THROW during
    // prerender when no client exists in context — even with args "skip"
    // (this exact throw was failing the CI build on every (app) page:
    // "Could not find Convex client"). When no URL is configured (CI
    // build, no-env preview), still provide a placeholder client so hook
    // callers render their undefined/loading fallbacks instead of
    // crashing the render tree. It never connects meaningfully; guarded
    // components never mount their hook subtrees at all.
    if (!convexUrl) {
      return new ConvexReactClient("https://offline.placeholder.invalid");
    }

    return new ConvexReactClient(convexUrl);
  }, [convexUrl]);

  if (!convexUrl) {
    // No @convex-dev/auth wiring offline — the OfflineAuthProvider branch
    // in the root layout owns the unconfigured auth UX.
    return <ConvexProviderBase client={client}>{children}</ConvexProviderBase>;
  }

  return <ConvexAuthProvider client={client}>{children}</ConvexAuthProvider>;
}
