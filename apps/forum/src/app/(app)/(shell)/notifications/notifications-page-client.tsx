/* eslint-disable @typescript-eslint/no-explicit-any -- Convex boundary */
"use client";

import { useConvex, useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { api } from "@/lib/convex";
import { formatRelativeDate } from "@/lib/format";
import { isConvexConfigured } from "@cemvp/convex-client";
import { useAuth, type AuthMode, type AuthStatus } from "@cemvp/auth-ui";

function NotificationsPageWithConvex({
  authStatus,
  openAuthModal,
}: {
  authStatus: AuthStatus;
  openAuthModal: (mode?: AuthMode) => void;
}) {
  // SLICE-P7T-01 (CAP-568): the CANONICAL list — recipient-private,
  // newest-first; the legacy forum read is retired on this surface.
  const viewerNotifications = useQuery(
    api.notifications.reads.list,
    authStatus === "authenticated" ? {} : "skip",
  );
  const markRead = useMutation(api.notifications.reads.markRead);

  // Cursor continuation — the base query keeps rendering the first page;
  // each Load-more appends one continuation page and advances the cursor
  // (the same idiom as the tool-profile ratingsPage).
  const convex = useConvex();
  const [extraPages, setExtraPages] = useState<{ page: any[]; cursor: string | null }[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const baseCursor = (viewerNotifications as any)?.cursor ?? null;
  const effectiveCursor = extraPages.length > 0 ? extraPages[extraPages.length - 1].cursor : baseCursor;
  const canContinue = effectiveCursor !== null && effectiveCursor !== undefined;

  async function loadMore() {
    if (!canContinue || loadingMore || !convex) return;
    setLoadingMore(true);
    try {
      const result = await convex.query(api.notifications.reads.list, {
        cursor: effectiveCursor ?? undefined,
      });
      setExtraPages((prev) => [...prev, { page: result?.page ?? [], cursor: result?.cursor ?? null }]);
    } finally {
      setLoadingMore(false);
    }
  }

  const items = [
    ...((viewerNotifications as any)?.page ?? []),
    ...extraPages.flatMap((p) => p.page),
  ];

  if (authStatus !== "authenticated") {
    return (
      <section className="animate-route-emerge space-y-4">
        <Card>
          <CardHeader>
            <h1 className="inline-flex items-center gap-2 text-2xl font-semibold text-(--text-primary)">
              <Bell className="h-5 w-5" /> Notifications
            </h1>
          </CardHeader>
          <CardContent>
            <button
              type="button"
              onClick={() => openAuthModal()}
              className="text-sm text-(--brand-primary) underline-offset-2 hover:underline"
            >
              Sign in
            </button>
            <span className="text-sm text-(--text-secondary)"> to see your notifications.</span>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (viewerNotifications === undefined) {
    return null;
  }

  return (
    <section className="animate-route-emerge space-y-4">
      <Card>
        <CardHeader>
          <h1 className="inline-flex items-center gap-2 text-2xl font-semibold text-(--text-primary)">
            <Bell className="h-5 w-5" /> Notifications
          </h1>
        </CardHeader>

        <CardContent className="space-y-2">
          {items.length === 0 ? (
            <p className="py-6 text-center text-sm text-(--text-muted)">
              You&apos;re all caught up — nothing new right now.
            </p>
          ) : (
            items.map((notification: any) => {
              const unread = !notification.readAt;
              const wrapperClass = unread
                ? "rounded-md border border-(--border-active) bg-(--bg-overlay) p-3"
                : "rounded-md border border-(--border-default) bg-(--bg-surface) p-3";
              const actors = notification.actorCount > 1 ? `${notification.actorCount} members` : "Someone";
              const plural = notification.eventCount > 1 ? ` · ${notification.eventCount} events` : "";
              return (
                <div key={notification.id} className={wrapperClass}>
                  <p className="text-sm font-semibold text-(--text-primary)">
                    {notification.notificationType.replace(/_/g, " ")}
                  </p>
                  <p className="mt-1 text-xs text-(--text-secondary)">
                    {actors}{plural}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-label-sm text-(--text-muted)">{formatRelativeDate(notification.createdAt)}</p>
                    {unread ? (
                      <button
                        type="button"
                        className="text-xs text-(--brand-primary) underline-offset-2 hover:underline"
                        onClick={() => void markRead({ notificationId: notification.id })}
                      >
                        Mark read
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
          {items.length > 0 && canContinue ? (
            <Button variant="secondary" disabled={loadingMore} onClick={loadMore}>
              {loadingMore ? "Loading…" : "Load more"}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}

export function NotificationsPageClient() {
  const { authStatus, openAuthModal } = useAuth();

  if (!isConvexConfigured()) {
    return <p className="text-sm text-(--text-muted)">Connect Convex to load notifications.</p>;
  }

  return (
    <NotificationsPageWithConvex authStatus={authStatus} openAuthModal={openAuthModal} />
  );
}
