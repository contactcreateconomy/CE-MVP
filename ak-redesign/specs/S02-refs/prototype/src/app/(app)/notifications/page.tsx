/**
 * Route: /notifications
 * Auth requirement: Member recommended
 * Data dependencies: notifications list for current user
 * Backend endpoints needed:
 * - GET /api/notifications
 * - PATCH /api/notifications/:id/read
 */
import Link from "next/link";
import { Bell } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getNotificationsForUser } from "@/lib/adapters/content";
import { formatRelativeDate } from "@/lib/format";

export default function NotificationsPage() {
  const viewerNotifications = getNotificationsForUser("u1");

  return (
    <section className="animate-route-emerge space-y-4">
      <Card>
        <CardHeader>
          <h1 className="inline-flex items-center gap-2 text-2xl font-semibold text-[var(--text-primary)]">
            <Bell className="h-5 w-5" /> Notifications
          </h1>
        </CardHeader>

        <CardContent className="space-y-2">
          {viewerNotifications.map((notification) => {
            const wrapperClass = notification.read
              ? "rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3"
              : "rounded-[var(--radius-md)] border border-[var(--border-active)] bg-[var(--bg-overlay)] p-3";

            const content = (
              <>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{notification.title}</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{notification.message}</p>
                <p className="mt-2 text-[11px] text-[var(--text-muted)]">{formatRelativeDate(notification.createdAt)}</p>
              </>
            );

            if (!notification.postSlug) {
              return (
                <div key={notification.id} className={wrapperClass}>
                  {content}
                </div>
              );
            }

            return (
              <Link key={notification.id} href={`/discussions/${notification.postSlug}`} className={`${wrapperClass} block`}>
                {content}
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
}
