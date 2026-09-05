"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SeedThread } from "@/app/(app)/(content)/content/_seed";

interface EngagementPanelProps {
  thread: SeedThread;
  mode?: "max" | "minimal";
}

export function EngagementPanel({ thread, mode = "max" }: EngagementPanelProps) {
  const [helpful, setHelpful] = useState<"yes" | "no" | null>(null);
  const isMinimal = mode === "minimal";

  return (
    <div className="card-surface rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[var(--border-subtle)]">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Engagement</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Helpfulness toggle */}
        <div>
          <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">Was this thread helpful?</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHelpful(helpful === "yes" ? null : "yes")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                helpful === "yes"
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-400/30 dark:text-emerald-400"
                  : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]"
              )}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              Yes
            </button>
            <button
              onClick={() => setHelpful(helpful === "no" ? null : "no")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                helpful === "no"
                  ? "bg-orange-500/10 text-orange-600 border-orange-400/30 dark:text-orange-400"
                  : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]"
              )}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
              Not really
            </button>
          </div>
          {helpful && (
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">Thanks for your feedback!</p>
          )}
        </div>

        {/* Related threads */}
        {!isMinimal && thread.relatedThreads.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Related Threads</p>
            <div className="space-y-2">
              {thread.relatedThreads.map((rt) => (
                <div
                  key={rt.id}
                  className="group flex items-start justify-between gap-2 cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors leading-snug line-clamp-2">
                      {rt.title}
                    </p>
                    <p className="text-micro text-[var(--text-muted)] mt-0.5">
                      {rt.authorHandle} · {rt.replies} replies
                    </p>
                  </div>
                  <ExternalLink className="h-3 w-3 text-[var(--text-muted)] flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
