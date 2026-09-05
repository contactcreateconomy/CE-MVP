"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef } from "react";

import { api } from "@/lib/convex";
import { useAuth } from "@cemvp/auth-ui";

/**
 * Ensures `forumProfiles` exists for authenticated users (legacy signups
 * before the `afterUserCreatedOrUpdated` callback).  Uses a lightweight
 * boolean query to avoid calling the mutation when the profile already exists.
 */
export function ForumProfileEnsurer() {
  const { authStatus } = useAuth();
  const hasProfile = useQuery(
    api.forum.queries.hasViewerProfile,
    authStatus === "authenticated" ? {} : "skip",
  );
  const ensure = useMutation(api.forum.mutations.ensureForumProfile);
  const ranForSession = useRef(false);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      ranForSession.current = false;
      return;
    }
    if (hasProfile === undefined || hasProfile === true) {
      return;
    }
    if (ranForSession.current) {
      return;
    }
    ranForSession.current = true;
    void ensure({}).catch(() => {
      ranForSession.current = false;
    });
  }, [authStatus, hasProfile, ensure]);

  return null;
}
