"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { DiscussionThread, NewsBody } from "@/types/discussion";

export function NewsInsights({ thread }: { thread: DiscussionThread }) {
  const b = thread.categoryBody as NewsBody;
  const timeline = b.timeline ?? [];
  const corroboration = b.corroboration ?? [];
  return (
    <div className="space-y-4">
      {timeline.length > 0 ? (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-(--text-muted)">Event timeline</p>
            <ul className="mt-2 space-y-2 text-sm text-(--text-secondary)">
              {timeline.map((e) => (
                <li key={e.date + e.label}>
                  <span className="font-medium text-(--text-primary)">{e.date}</span> — {e.label}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
      {b.conflictingSummary && corroboration.some((c) => c.stance === "contradicts") ? (
        <Card className="border-(--feedback-error)/30">
          <CardContent className="grid gap-2 p-4 sm:grid-cols-2">
            <p className="text-sm font-semibold text-(--text-primary) sm:col-span-2">Conflicting reports</p>
            <div>
              <p className="text-xs text-(--text-muted)">Claim</p>
              <p className="text-sm text-(--text-secondary)">{b.conflictingSummary.claim}</p>
            </div>
            <div>
              <p className="text-xs text-(--text-muted)">Source</p>
              <p className="text-sm text-(--text-secondary)">{b.conflictingSummary.sourceName}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
