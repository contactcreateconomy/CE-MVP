/**
 * Route: /users/[handle] — canonical merged Profile (P5-07) with the
 * legacy forum profile as the strangler fallback. noindex per CAP-486
 * (profile URLs are non-indexable under the growth contract).
 */
import type { Metadata } from "next";
import { UserProfilePageClient } from "./user-profile-page-client";

export const metadata: Metadata = {
  title: "Member profile",
  robots: { index: false, follow: false },
};

interface UserProfilePageProps {
  params: Promise<{ handle: string }>;
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { handle: handleParam } = await params;
  const handle = decodeURIComponent(handleParam);

  return <UserProfilePageClient handle={handle} />;
}
