"use client";

import { Star } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Post } from "@/types/post";

const VERDICT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  recommended: { bg: "bg-(--feedback-success)/15", text: "text-(--feedback-success)", label: "Recommended" },
  caveats: { bg: "bg-(--feedback-warning)/15", text: "text-(--feedback-warning)", label: "With Caveats" },
  not_recommended: { bg: "bg-(--feedback-error)/15", text: "text-(--feedback-error)", label: "Not Recommended" },
};

export function ReviewCardExtras({ post }: { post: Post }) {
  const body = post.categoryBody;
  if (!body || typeof body !== "object" || !Object.keys(body).length) return null;

  const verdict = typeof body.verdict === "string" ? body.verdict : "";
  const starRating = typeof body.starRating === "number" ? body.starRating : 0;

  if (!verdict && !starRating) return null;

  const style = VERDICT_STYLES[verdict];

  return (
    <div className="mt-1.5 flex items-center gap-2 text-xs">
      {style && (
        <span className={cn("rounded-full px-2 py-0.5 font-medium", style.bg, style.text)}>
          {style.label}
        </span>
      )}
      {starRating > 0 && (
        <span className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                "h-3 w-3",
                i < starRating ? "fill-(--feedback-warning) text-(--feedback-warning)" : "text-(--text-muted)/30",
              )}
            />
          ))}
        </span>
      )}
    </div>
  );
}
