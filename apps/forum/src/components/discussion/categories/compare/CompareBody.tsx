"use client";

import { useMemo } from "react";
import { ChevronsRight, Trophy } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DiscussionThread } from "@/types/discussion";

import { FormattedBody } from "../../formatted-body";

/**
 * Spec-aligned compare body (2026-08-31): static comparison table + canonical
 * editor-defined scenario callouts. The reader-adjustable weight sliders,
 * "Show differences only" diff-hiding, and reader-picked scenarios were archived —
 * see archive/cluster1-interactive-mechanics/CompareBody-reactive-grid.tsx
 * (fast-follow: FUTURE-M5-01 editor-defined scenario presets · FUTURE-M5-02 facet-sort).
 */
export function CompareBody({ thread, isMax }: { thread: Extract<DiscussionThread, { category: "compare" }>; isMax: boolean }) {
  const b = thread.categoryBody;
  const criteriaLabels = useMemo(() => b.criteriaLabels ?? [], [b.criteriaLabels]);
  const options = useMemo(() => b.options ?? [], [b.options]);
  const scenarios = useMemo(() => b.scenarios ?? [], [b.scenarios]);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-(--border-default) bg-(--bg-surface)">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-(--border-default) text-left text-(--text-muted)">
              <th className="sticky left-0 z-sticky-local bg-(--bg-surface) px-3 py-2 font-medium">Criteria</th>
              {options.map((o) => (
                <th key={o.id} className="px-3 py-2 font-medium text-(--text-primary)">
                  {o.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {criteriaLabels.map((label) => {
              const vals = options.map((o) => o.scores[label] ?? 0);
              const best = Math.max(...vals);
              return (
                <tr key={label} className="border-b border-(--border-subtle)">
                  <td className="sticky left-0 bg-(--bg-surface) px-3 py-2 font-medium text-(--text-primary)">{label}</td>
                  {options.map((o) => {
                    const v = o.scores[label] ?? 0;
                    const win = v === best && vals.filter((x) => x === best).length === 1;
                    return (
                      <td
                        key={o.id}
                        className={cn("px-3 py-2", win && "font-semibold text-(--brand-primary)")}
                      >
                        {v}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="flex items-center gap-1 text-xs font-medium text-(--text-muted) md:hidden">
        <ChevronsRight className="h-3.5 w-3.5 shrink-0 text-(--brand-primary)" />
        Swipe horizontally to compare all options
      </p>

      {isMax && scenarios.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-(--text-primary)">Editor&rsquo;s scenario callouts</p>
          {scenarios.map((s) => (
            <div key={s.id} className="rounded-lg border border-(--border-default) bg-(--bg-inset) p-4">
              <p className="text-xs font-medium text-(--brand-primary)">
                {s.label} → {options.find((o) => o.id === s.winnerId)?.name ?? s.winnerId}
              </p>
              <p className="mt-1 text-sm text-(--text-secondary)">{s.rationale}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((o) => (
          <Card key={o.id}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-(--text-primary)">{o.name}</span>
                {o.isCommunityPick ? <Trophy className="h-4 w-4 text-(--feedback-warning)" aria-label="Community pick" /> : null}
              </div>
              <p className="text-2xl font-bold text-(--brand-primary)">{o.overallScore.toFixed(1)}</p>
              <p className="text-xs text-(--text-secondary)">
                <span className="font-medium text-(--text-primary)">Best for:</span> {o.bestFor}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <FormattedBody body={thread.body} />
    </div>
  );
}
