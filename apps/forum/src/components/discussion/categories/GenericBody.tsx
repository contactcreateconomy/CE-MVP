"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { DiscussionThread } from "@/types/discussion";

import { FormattedBody } from "../formatted-body";

/** Generic body fallback for posts without category-specific structured data. */
export function GenericBody({ thread }: { thread: DiscussionThread }) {
  return (
    <div className="space-y-4">
      <Card className="border-(--border-default) bg-(--bg-surface)">
        <CardContent className="space-y-3 p-4">
          <FormattedBody body={thread.body} />
          {thread.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-(--border-subtle) pt-3">
              {thread.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-(--bg-overlay) px-2 py-0.5 text-label-sm font-medium text-(--text-secondary)">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
