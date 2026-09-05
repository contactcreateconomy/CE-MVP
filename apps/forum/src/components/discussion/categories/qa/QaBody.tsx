"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DiscussionThread } from "@/types/discussion";

import { FormattedBody } from "../../formatted-body";

export function QaBody({ thread, isMax }: { thread: Extract<DiscussionThread, { category: "qa" }>; isMax: boolean }) {
  const b = thread.categoryBody;
  const tried = b.tried ?? [];
  const environment = b.environment ?? [];
  const [repro, setRepro] = useState(b.reproducibilityCount);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3 p-4 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase text-(--text-muted)">What I&apos;m trying to do</p>
            <p className="mt-1 text-(--text-secondary)">{b.goal}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-(--text-muted)">What I&apos;ve tried</p>
            <ul className="mt-1 list-inside list-disc text-(--text-secondary)">
              {tried.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-(--text-muted)">Where I&apos;m stuck</p>
            <p className="mt-1 text-(--text-secondary)">{b.stuck}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-(--text-muted)">Environment</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {environment.map((e) => (
                <span key={e} className="rounded-full border border-(--border-default) bg-(--bg-inset) px-2 py-0.5 text-xs">
                  {e}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div
        className={cn(
          "rounded-lg border px-4 py-3 text-sm font-medium",
          b.solved ? "border-(--feedback-success)/40 bg-(--feedback-success)/10 text-(--feedback-success)" : "border-(--feedback-error)/40 bg-(--feedback-error)/10 text-(--feedback-error)",
        )}
      >
        {b.solved ? "✅ Solved" : "🔴 Unsolved"}
        {b.solved && b.solutionCommentId ? (
          <a href={`#comment-${b.solutionCommentId}`} className="ml-3 underline">
            Jump to solution →
          </a>
        ) : null}
      </div>

      {isMax ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-(--text-secondary)">{repro} others have this problem</span>
          <Button type="button" size="sm" variant="secondary" onClick={() => setRepro((n) => n + 1)}>
            I have this too
          </Button>
        </div>
      ) : null}

      <FormattedBody body={thread.body} />
    </div>
  );
}
