"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { DiscussionThread, ReviewBody } from "@/types/discussion";

export function ReviewInsights({ thread }: { thread: DiscussionThread }) {
  const b = thread.categoryBody as ReviewBody;
  const s = b.sentiment;
  if (!s) return null;
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <p className="text-xs font-semibold uppercase text-(--text-muted)">Community sentiment</p>
        <div className="flex gap-4 text-sm">
          <span className="text-(--feedback-success)">Agree {s.agreePct}%</span>
          <span className="text-(--feedback-error)">Disagree {s.disagreePct}%</span>
        </div>
        <div className="space-y-2 text-xs text-(--text-secondary)">
          <p>
            <span className="font-medium text-(--text-primary)">Top agree:</span> {s.agreeQuote}
          </p>
          <p>
            <span className="font-medium text-(--text-primary)">Top disagree:</span> {s.disagreeQuote}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
