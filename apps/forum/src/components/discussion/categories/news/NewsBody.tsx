"use client";

import { ExternalLink } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DiscussionThread } from "@/types/discussion";
import type { User } from "@/types";

import { FormattedBody } from "../../formatted-body";

function stanceStyles(stance: "confirms" | "skeptical" | "contradicts") {
  if (stance === "confirms") return "bg-(--feedback-success)/15 text-(--feedback-success) border-(--feedback-success)/30";
  if (stance === "skeptical") return "bg-(--feedback-warning)/15 text-(--feedback-warning) border-(--feedback-warning)/30";
  return "bg-(--feedback-error)/15 text-(--feedback-error) border-(--feedback-error)/30";
}

export function NewsBody({
  thread,
  isMax,
  author,
}: {
  thread: Extract<DiscussionThread, { category: "news" }>;
  isMax: boolean;
  author: User | null;
}) {
  const b = thread.categoryBody;
  const corroboration = b.corroboration ?? [];

  return (
    <div className="space-y-4">
      <Card className="border-(--border-default) bg-(--bg-surface)">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {b.sourceFavicon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={b.sourceFavicon} alt="" className="h-5 w-5 rounded" width={20} height={20} />
            ) : null}
            <span className="font-semibold text-(--text-primary)">{b.isOriginalReporting ? "Original reporting" : b.sourceName}</span>
            <span className="text-(--text-muted)">·</span>
            <time className="text-(--text-secondary)">{new Date(b.publishedAt).toLocaleString()}</time>
            {!b.isOriginalReporting && b.sourceUrl ? (
              <a
                href={b.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-(--brand-primary) hover:underline"
              >
                Read original <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
          {b.isOriginalReporting ? (
            <p className="text-sm text-(--text-secondary)">Original reporting by @{author?.handle ?? "author"}</p>
          ) : null}
          <div className="flex flex-wrap gap-2 text-xs text-(--text-muted)">
            <span>Published {new Date(b.publishedAt).toLocaleDateString()}</span>
            {b.updatedAt ? <span className="text-(--text-secondary)">Updated {new Date(b.updatedAt).toLocaleString()}</span> : null}
            {new Date(b.publishedAt).getTime() < Date.UTC(2026, 1, 20) ? (
              <span className="rounded-full bg-(--bg-overlay) px-2 py-0.5">Older content</span>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-(--text-muted)">Corroboration</p>
        {corroboration.length === 0 ? (
          <p className="rounded-lg border border-dashed border-(--border-default) bg-(--bg-inset) p-4 text-sm text-(--text-secondary)">
            No corroboration added yet. Know another source? Add it.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {corroboration.map((s) => (
              <div
                key={s.name}
                className="flex min-w-[140px] flex-1 items-center gap-2 rounded-lg border border-(--border-default) bg-(--bg-surface) px-3 py-2"
              >
                <span className="text-sm font-medium text-(--text-primary)">{s.name}</span>
                <span className={cn("ml-auto rounded-full border px-2 py-0.5 text-label-sm font-medium capitalize", stanceStyles(s.stance))}>
                  {s.stance}
                </span>
                {isMax && s.credibility ? (
                  <span
                    title="Independent: editorial distance from vendor. Corporate: vendor-affiliated. Government: official. Community: crowd-sourced."
                    className="rounded-full bg-(--bg-overlay) px-2 py-0.5 text-micro text-(--text-muted)"
                  >
                    {s.credibility}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <FormattedBody body={thread.body} />
    </div>
  );
}
