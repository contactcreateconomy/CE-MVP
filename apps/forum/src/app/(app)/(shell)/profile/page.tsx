/**
 * Route: /profile — read-only own-profile viewer (E-bucket resolved 2026-08-31).
 * Inline edit archived (spec splits read from write at /settings/profile);
 * see archive/e-bucket/profile-page-client-inline-edit.tsx.
 */
import { ProfilePageClient } from "./profile-page-client";

export default function ProfilePage() {
  return <ProfilePageClient />;
}
