/**
 * Route: /profile
 * Auth requirement: Member recommended
 * Data dependencies: viewer profile and linked notification preferences section
 * Backend endpoints needed:
 * - GET /api/me
 * - GET /api/me/notifications/preferences
 */
import { Bell, UserCircle2 } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ProfilePage() {
  return (
    <section className="animate-route-emerge space-y-4">
      <Card>
        <CardHeader>
          <h1 className="inline-flex items-center gap-2 text-2xl font-semibold text-[var(--text-primary)]">
            <UserCircle2 className="h-5 w-5" /> Profile
          </h1>
        </CardHeader>

        <CardContent className="space-y-3 text-sm text-[var(--text-secondary)]">
          <p>
            Profile workspace placeholder. This is where creator identity, account metadata, and public preferences will be managed.
          </p>
        </CardContent>
      </Card>

      <Card id="notifications" className="scroll-mt-28">
        <CardHeader>
          <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-[var(--text-primary)]">
            <Bell className="h-5 w-5" /> Notifications
          </h2>
        </CardHeader>

        <CardContent className="space-y-2 text-sm text-[var(--text-secondary)]">
          <p>
            Notification controls placeholder. &quot;View all notifications&quot; from the top-nav dropdown lands here for now until
            full profile notification management is wired.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
