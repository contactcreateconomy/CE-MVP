/**
 * Route: /settings/profile — M7 WRITE surface (CONTRACT-5-settings-profile).
 * /users/[handle] (P5-07) is the read/display side.
 */
import { SettingsProfileClient } from "./settings-profile-client";

export default function SettingsProfilePage() {
  return <SettingsProfileClient />;
}
