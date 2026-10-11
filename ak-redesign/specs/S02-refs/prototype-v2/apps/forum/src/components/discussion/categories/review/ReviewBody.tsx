"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DiscussionThread } from "@/types/discussion";

import { FormattedBody } from "../../formatted-body";

function weightedScore(criteria: { score: number; weightPercent: number }[], weights: number[]) {
  const w = weights.length ? weights : criteria.map((c) => c.weightPercent);
  const sumW = w.reduce((a, b) => a + b, 0) || 1;
  return criteria.reduce((acc, c, i) => acc + c.score * (w[i] ?? c.weightPercent), 0) / sumW;
}

export function ReviewBody({ thread, isMax }: { thread: Extract<DiscussionThread, { category: "review" }>; isMax: boolean }) {
  const b = thread.categoryBody;
  const criteria = b.criteria ?? [];
  const reviewerContextMax = b.reviewerContextMax ?? [];
  const [adjust, setAdjust] = useState(false);
  const [weights, setWeights] = useState(() => criteria.map((c) => c.weightPercent));
  const live = weightedScore(criteria, weights);
  const verdictColor =
    b.verdict === "recommended"
      ? "text-(--feedback-success)"
      : b.verdict === "caveats"
        ? "text-(--feedback-warning)"
        : "text-(--feedback-error)";
  const verdictLabel = b.verdict === "recommended" ? "Recommended" : b.verdict === "caveats" ? "With caveats" : "Not recommended";

  return (
    <div className="space-y-4">
      <Card className="border-(--border-default) bg-(--bg-surface) xl:sticky xl:top-20 xl:z-[5]">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          {b.productLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.productLogo} alt="" className="h-12 w-12 rounded-lg border border-(--border-default)" width={48} height={48} />
          ) : null}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-(--text-primary)">{b.productName}</h2>
            <p className="text-xs text-(--text-muted)">{b.reviewerContextNote}</p>
          </div>
          <a href={b.productUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-(--brand-primary) hover:underline">
            Visit product →
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <span className="text-3xl font-bold text-(--text-primary)">{b.starRating.toFixed(1)}</span>
            <span className="text-(--text-muted)">/ 5</span>
            <span className={cn("rounded-full border px-3 py-1 text-sm font-semibold", verdictColor)}>{verdictLabel}</span>
          </div>
          <p className="text-sm text-(--text-secondary)">{b.verdictRationale}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-(--text-primary)">Criteria scorecard</p>
            {isMax ? (
              <label className="flex items-center gap-2 text-xs text-(--text-secondary)">
                <input type="checkbox" checked={adjust} onChange={(e) => setAdjust(e.target.checked)} />
                Adjust for my use case
              </label>
            ) : null}
          </div>
          {criteria.map((c, i) => (
            <div key={c.id}>
              <div className="mb-1 flex justify-between text-xs text-(--text-secondary)">
                <span>
                  {c.label} — {c.score.toFixed(1)} — {c.weightPercent}% weight
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-(--bg-inset)">
                <div
                  className="h-full origin-left rounded-full bg-(--brand-primary) transition-[width] duration-700 ease-out"
                  style={{ width: `${(c.score / c.maxScore) * 100}%` }}
                />
              </div>
              {isMax && adjust ? (
                <input
                  type="range"
                  min={5}
                  max={50}
                  value={weights[i] ?? c.weightPercent}
                  onChange={(e) => {
                    const next = [...weights];
                    next[i] = Number(e.target.value);
                    setWeights(next);
                  }}
                  className="mt-2 w-full accent-(--brand-primary)"
                />
              ) : null}
            </div>
          ))}
          <p className="text-sm font-semibold text-(--text-primary)">
            Weighted score: <span className="text-(--brand-primary)">{live.toFixed(2)}</span>
          </p>
          {isMax && adjust ? (
            <Button type="button" variant="secondary" size="sm" onClick={() => setWeights(criteria.map((c) => c.weightPercent))}>
              Reset to reviewer weights
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {isMax ? (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-(--text-primary)">Reviewer context</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {reviewerContextMax.map((row) => (
                <span key={row.label} className="rounded-full border border-(--border-default) bg-(--bg-inset) px-3 py-1 text-xs text-(--text-secondary)">
                  <span className="font-medium text-(--text-primary)">{row.label}:</span> {row.value}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <FormattedBody body={thread.body} />
    </div>
  );
}
