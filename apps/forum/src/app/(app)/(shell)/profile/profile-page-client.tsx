"use client";

import { useQuery } from "convex/react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";
import { useAuth } from "@cemvp/auth-ui";

/**
 * Read-only own-profile (E-bucket resolved 2026-08-31): spec deliberately splits
 * read (/u/[handle] + this viewer card — no mutations) from write (/settings/profile,
 * CAP-545 + CONTRACT-5-settings-profile). Inline edit archived — see
 * archive/e-bucket/profile-page-client-inline-edit.tsx.
 */
function ProfileCard() {
  const { authStatus } = useAuth();
  const profile = useQuery(
    api.forum.queries.getViewerProfile,
    authStatus === "authenticated" ? {} : "skip",
  );

  if (authStatus !== "authenticated") {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-(--text-muted)">
          Sign in to view your profile.
        </CardContent>
      </Card>
    );
  }

  if (profile === undefined) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--border-default) border-t-(--brand-primary)" />
      </div>
    );
  }

  if (profile === null) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-(--text-muted)">
          No profile found. Please refresh the page.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h1 className="inline-flex items-center gap-2 text-2xl font-semibold text-(--text-primary)">
            Profile
          </h1>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <UserAvatar user={profile} size="lg" />
          <div>
            <p className="text-lg font-semibold text-(--text-primary)">{profile.name}</p>
            <p className="text-sm text-(--text-muted)">@{profile.handle}</p>
          </div>
        </div>

        {profile.bio && (
          <p className="text-sm leading-relaxed text-(--text-secondary)">{profile.bio}</p>
        )}

        <div className="grid grid-cols-3 gap-3 rounded-md border border-(--border-default) bg-(--bg-surface) p-3">
          <div className="text-center">
            <p className="text-lg font-bold text-(--brand-primary)">{profile.points}</p>
            <p className="text-xs text-(--text-muted)">Points</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-(--text-primary)">Lv.{profile.level}</p>
            <p className="text-xs text-(--text-muted)">Level</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-(--text-primary)">{profile.streakDays}</p>
            <p className="text-xs text-(--text-muted)">Day Streak</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-(--text-muted)">
          <span className="inline-flex rounded-full bg-(--bg-overlay) px-2 py-0.5 capitalize">
            {profile.role}
          </span>
          {profile.verified && (
            <span className="text-(--brand-primary)">Verified</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProfilePageClient() {
  if (!isConvexConfigured()) {
    return (
      <p className="text-sm text-(--text-muted)">
        Connect Convex to load your profile.
      </p>
    );
  }
  return <ProfileCard />;
}
