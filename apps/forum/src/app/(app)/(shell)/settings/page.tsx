/**
 * Route: /settings — P7-CLEANUP (§E1 decision 2, retired): the legacy
 * account-settings page retired with the forum* tables. The canonical
 * settings surface is /settings/profile (P5-06: attributes, socials,
 * consent, erasure, privacy toggles).
 */
import { redirect } from "next/navigation";

export default function SettingsPage() {
  redirect("/settings/profile");
}
