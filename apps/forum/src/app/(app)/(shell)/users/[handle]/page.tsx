/**
 * Route: /users/[handle]
 */
import { UserProfilePageClient } from "./user-profile-page-client";

interface UserProfilePageProps {
  params: Promise<{ handle: string }>;
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { handle: handleParam } = await params;
  const handle = decodeURIComponent(handleParam);

  return <UserProfilePageClient handle={handle} />;
}
