"use client";

import { useMemo, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DiscussionThread } from "@/types/discussion";

import { FormattedBody } from "../../formatted-body";

export function ListBody({ thread, isMax }: { thread: Extract<DiscussionThread, { category: "list" }>; isMax: boolean }) {
  const b = thread.categoryBody;
  const lenses = b.lenses ?? [];
  const criteria = b.criteria ?? [];
  const [lens, setLens] = useState(lenses[0]?.id ?? "editors");
  const [openRank, setOpenRank] = useState<number | null>(null);

  const sorted = useMemo(() => {
    const items = b.items ?? [];
    const copy = [...items];
    const lensId = lens;
    copy.sort((a, bItem) => (a.lensRanks[lensId] ?? 99) - (bItem.lensRanks[lensId] ?? 99));
    return copy.map((item, idx) => {
      const editorRank = item.lensRanks.editors ?? item.rank;
      const lensRank = item.lensRanks[lensId] ?? item.rank;
      return { item, displayRank: idx + 1, delta: lensRank - editorRank };
    });
  }, [b.items, lens]);

  return (
    <div className="space-y-4">
      <Card className="border-(--border-default) bg-(--bg-inset)">
        <CardContent className="space-y-2 p-4">
          <p className="text-sm font-semibold text-(--text-primary)">{b.purpose}</p>
          <p className="text-xs text-(--text-muted)">Audience: {b.audience}</p>
          <p className="text-sm text-(--text-secondary)">{b.whyExists}</p>
        </CardContent>
      </Card>
      <Card className="border-(--border-default) bg-(--bg-surface)">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-(--text-primary)">Criteria</p>
          <ul className="mt-2 space-y-1 text-sm text-(--text-secondary)">
            {criteria.map((c) => (
              <li key={c.text}>
                {c.met ? "✓" : "○"} {c.text}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-3 text-xs text-(--text-muted)">
        <span>Last updated {new Date(b.lastUpdated).toLocaleDateString()}</span>
        <span>{b.contributorCount} contributors</span>
        {b.ongoing ? <span className="rounded-full bg-(--bg-overlay) px-2 py-0.5">Ongoing list</span> : null}
        {b.targetCount != null ? (
          <span>
            {b.currentCount} of {b.targetCount} items
          </span>
        ) : null}
      </div>

      {isMax ? (
        <div className="flex flex-wrap gap-2">
          {lenses.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLens(l.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                lens === l.id ? "border-(--brand-primary) bg-(--brand-primary)/10" : "border-(--border-default) text-(--text-secondary)",
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="space-y-2">
        {sorted.map(({ item, displayRank, delta }) => (
          <Card key={item.rank}>
            <CardContent className="p-0">
              <button type="button" className="flex w-full items-start gap-3 p-4 text-left" onClick={() => setOpenRank(openRank === item.rank ? null : item.rank)}>
                <span className="text-3xl font-bold text-(--text-muted)/60">{displayRank}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-(--text-primary)">{item.name}</span>
                    <span className="rounded-full bg-(--bg-overlay) px-2 py-0.5 text-[11px] text-(--text-secondary)">{item.categoryChip}</span>
                    <span className="text-xs text-(--feedback-warning)">★ {item.stars.toFixed(1)}</span>
                    {isMax && delta !== 0 ? (
                      <span className="text-[11px] text-(--text-muted)">{delta > 0 ? `↑${delta}` : `↓${Math.abs(delta)}`}</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-(--text-secondary)">{item.blurb}</p>
                  {openRank === item.rank && item.detail ? <p className="mt-2 text-sm text-(--text-muted)">{item.detail}</p> : null}
                </div>
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      <FormattedBody body={thread.body} />
    </div>
  );
}
