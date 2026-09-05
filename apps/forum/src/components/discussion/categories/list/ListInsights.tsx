"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { DiscussionThread, ListBody } from "@/types/discussion";

import { useThreadDiscussion } from "../../thread-discussion-context";

export function ListInsights({ thread }: { thread: DiscussionThread }) {
  const { prependMainComposer, focusMainComposer } = useThreadDiscussion();

  const b = thread.categoryBody as ListBody;
  const gaps = b.coverageGaps ?? [];
  if (gaps.length === 0) return null;
  return (
    <Card className="border-(--border-default) bg-(--bg-surface)">
      <CardContent className="space-y-3 p-4">
        <p className="text-xs font-semibold uppercase text-(--text-muted)">Coverage gaps</p>
        {gaps.map((g) => (
          <div key={g.text} className="rounded-menu-item border border-(--border-subtle) bg-(--bg-inset) p-3 text-sm text-(--text-secondary)">
            <p className="font-medium text-(--text-primary)">{g.text}</p>
            <p className="mt-1 text-xs text-(--text-muted)">{g.context}</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={() => {
                prependMainComposer(`[Proposed addition — ${g.context}]\n${g.text}\n\nWhy it fits the criteria: `);
                focusMainComposer();
              }}
            >
              Propose addition
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
