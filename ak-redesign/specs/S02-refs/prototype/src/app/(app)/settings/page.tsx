/**
 * Route: /settings
 * Auth requirement: Member recommended
 * Data dependencies: viewer settings
 * Backend endpoints needed:
 * - GET /api/me/settings
 * - PATCH /api/me/settings
 */
import { Settings } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getDefaultSettings } from "@/lib/adapters/content";

export default function SettingsPage() {
  const defaultSettings = getDefaultSettings();
  return (
    <section className="animate-route-emerge space-y-4">
      <Card>
        <CardHeader>
          <h1 className="inline-flex items-center gap-2 text-2xl font-semibold text-[var(--text-primary)]">
            <Settings className="h-5 w-5" /> Settings
          </h1>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Theme</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Current: {defaultSettings.theme}</p>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 text-xs text-[var(--text-secondary)]">
            <p>Email notifications: {defaultSettings.emailNotifications ? "Enabled" : "Disabled"}</p>
            <p className="mt-1">Push notifications: {defaultSettings.pushNotifications ? "Enabled" : "Disabled"}</p>
            <p className="mt-1">Hide mature content: {defaultSettings.hideMatureContent ? "Enabled" : "Disabled"}</p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
