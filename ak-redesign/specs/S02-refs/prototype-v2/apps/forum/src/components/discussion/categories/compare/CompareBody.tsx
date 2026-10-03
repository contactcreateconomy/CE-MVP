"use client";

import { ChevronsRight, Trophy } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DiscussionThread } from "@/types/discussion";

import { FormattedBody } from "../../formatted-body";

export function CompareBody({ thread, isMax }: { thread: Extract<DiscussionThread, { category: "compare" }>; isMax: boolean }) {
  const b = thread.categoryBody;
  const criteriaLabels = useMemo(() => b.criteriaLabels ?? [], [b.criteriaLabels]);
  const options = useMemo(() => b.options ?? [], [b.options]);
  const scenarios = useMemo(() => b.scenarios ?? [], [b.scenarios]);
  const [weights, setWeights] = useState<number[]>(() => criteriaLabels.map(() => 1));
  const [scenario, setScenario] = useState(scenarios[0]?.id ?? "");
  const [diffOnly, setDiffOnly] = useState(false);

  const weightedTotals = useMemo(() => {
    const sumW = weights.reduce((a, x) => a + x, 0) || 1;
    return options.map((opt) => {
      const t = criteriaLabels.reduce((acc, label, i) => acc + (opt.scores[label] ?? 0) * (weights[i] ?? 1), 0);
      return t / sumW;
    });
  }, [criteriaLabels, options, weights]);

  const rowSpread = (label: string) => {
    const vals = options.map((o) => o.scores[label] ?? 0);
    const max = Math.max(...vals);
    const min = Math.min(...vals);
    return max - min;
  };

  const hiddenRows =
    diffOnly ? criteriaLabels.filter((label) => rowSpread(label) < 0.5) : [];

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-[12px] border border-(--border-default) bg-(--bg-surface)">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-(--border-default) text-left text-(--text-muted)">
              <th className="sticky left-0 z-[1] bg-(--bg-surface) px-3 py-2 font-medium">Criteria</th>
              {options.map((o) => (
                <th key={o.id} className="px-3 py-2 font-medium text-(--text-primary)">
                  {o.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.criteriaLabels
              .filter((label) => !hiddenRows.includes(label))
              .map((label) => {
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

      {isMax ? (
        <div className="space-y-3 rounded-[12px] border border-(--border-default) bg-(--bg-inset) p-4">
          <p className="text-sm font-semibold text-(--text-primary)">My priorities</p>
          {criteriaLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-24 text-xs text-(--text-secondary)">{label}</span>
              <input
                type="range"
                min={1}
                max={5}
                value={weights[i] ?? 1}
                onChange={(e) => {
                  const next = [...weights];
                  next[i] = Number(e.target.value);
                  setWeights(next);
                }}
                className="flex-1 accent-(--brand-primary)"
              />
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={() => setWeights(criteriaLabels.map(() => 1))}>
            Reset weights
          </Button>
        </div>
      ) : null}

      {isMax ? (
        <div className="flex flex-wrap gap-2">
          {scenarios.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setScenario(s.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                scenario === s.id
                  ? "border-(--brand-primary) bg-(--brand-primary)/10 text-(--text-primary)"
                  : "border-(--border-default) text-(--text-secondary) hover:bg-(--bg-overlay)",
              )}
            >
              {s.label}
            </button>
          ))}
          <p className="w-full text-sm text-(--text-secondary)">
            {scenarios.find((s) => s.id === scenario)?.rationale}
          </p>
        </div>
      ) : null}

      {isMax ? (
        <label className="flex items-center gap-2 text-sm text-(--text-secondary)">
          <input type="checkbox" checked={diffOnly} onChange={(e) => setDiffOnly(e.target.checked)} />
          Show differences only
          {diffOnly && hiddenRows.length > 0 ? (
            <span className="text-xs text-(--text-muted)">Hiding {hiddenRows.length} similar rows — turn off to show all</span>
          ) : null}
        </label>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((o, idx) => (
          <Card key={o.id}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-(--text-primary)">{o.name}</span>
                {o.isCommunityPick ? <Trophy className="h-4 w-4 text-(--feedback-warning)" aria-label="Community pick" /> : null}
              </div>
              <p className="text-2xl font-bold text-(--brand-primary)">{weightedTotals[idx]?.toFixed(1) ?? o.overallScore}</p>
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
