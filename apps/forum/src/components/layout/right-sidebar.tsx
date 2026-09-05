"use client";

import { useQuery } from "convex/react";

import { PodiumWidget } from "@/components/layout/podium-widget";
import { WhatsVibingWidget } from "@/components/layout/whats-vibing-widget";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";

function RightSidebarWithConvex() {
  const rows = useQuery(api.forum.queries.getLeaderboardWithUsers, {});

  return (
    <aside className="sticky top-20 hidden h-fit w-[320px] shrink-0 space-y-4 xl:block">
      <WhatsVibingWidget />

      <Card className="animate-soft-float" style={{ animationDelay: "100ms" }}>
        <CardContent className="p-3">
          {rows === undefined ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="h-3 w-16 animate-pulse rounded bg-(--bg-overlay)" />
                <div className="h-8 w-[160px] animate-pulse rounded-full bg-(--bg-overlay)/50" />
              </div>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex h-[44px] items-center justify-between gap-2 rounded-lg bg-(--bg-overlay)/45 px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                       <div className="h-4 w-4 shrink-0 animate-pulse rounded bg-(--bg-overlay)" />
                       <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-(--bg-overlay)" />
                       <div className="h-4 w-24 animate-pulse rounded bg-(--bg-overlay)" />
                    </div>
                    <div className="h-4 w-8 animate-pulse rounded bg-(--bg-overlay)" />
                  </div>
                ))}
              </div>
              <div className="flex w-full justify-center">
                 <div className="h-8 w-8 animate-pulse rounded-full bg-(--bg-overlay)/50" />
              </div>
            </div>
          ) : (
            <PodiumWidget rows={rows} />
          )}
        </CardContent>
      </Card>
    </aside>
  );
}

/** Omit sidebar widgets entirely when Convex is not configured (build-time prerender). */
export function RightSidebar() {
  if (!isConvexConfigured()) {
    return null;
  }
  return <RightSidebarWithConvex />;
}
