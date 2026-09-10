/**
 * Route: /profile — P7-CLEANUP: the legacy self-profile page retired with
 * the forum* tables. /profile now forwards to the canonical self surface
 * (/settings/profile, P5-06); the public profile lives at /users/[handle].
 */
import { redirect } from "next/navigation";

export default function ProfilePage() {
  redirect("/settings/profile");
}
