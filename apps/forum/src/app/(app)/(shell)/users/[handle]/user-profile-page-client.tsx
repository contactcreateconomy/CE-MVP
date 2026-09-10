"use client";

import { useQuery } from "convex/react";

import { CanonicalProfile } from "@/components/profile/canonical-profile";
import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";

interface UserProfilePageClientProps {
  handle: string;
}

/** P7-CLEANUP: canonical-only (the legacy forum-profile strangler fallback
 *  retired with the forum* tables — CAP-526/527/528 remain the surface). */
function UserProfilePageWithConvex({ handle }: { handle: string }) {
  const canonical = useQuery(api.profile.page.getProfilePage, { handle });

  if (canonical === undefined) {
    return null;
  }
  if (canonical === null) {
    return (
      <section className="animate-route-emerge space-y-2">
        <h1 className="text-xl font-semibold text-(--text-primary)">User not found</h1>
        <p className="text-sm text-(--text-muted)">No profile matches @{handle}.</p>
      </section>
    );
  }
  return <CanonicalProfile data={canonical} />;
}

export function UserProfilePageClient({ handle }: UserProfilePageClientProps) {
  if (!isConvexConfigured()) {
    return (
      <section className="animate-route-emerge space-y-2">
        <h1 className="text-xl font-semibold text-(--text-primary)">Member profile</h1>
        <p className="text-sm text-(--text-muted)">Connect Convex to load profiles.</p>
      </section>
    );
  }
  return <UserProfilePageWithConvex handle={handle} />;
}
