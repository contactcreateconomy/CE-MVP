"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";

import { getConvexUrl } from "@cemvp/convex-client";

export function ConvexProvider({ children }: { children: ReactNode }) {
  const convexUrl = getConvexUrl();

  const client = useMemo(() => {
    if (!convexUrl) {
      return null;
    }

    return new ConvexReactClient(convexUrl);
  }, [convexUrl]);

  if (!client) {
    return <>{children}</>;
  }

  return <ConvexAuthProvider client={client}>{children}</ConvexAuthProvider>;
}
