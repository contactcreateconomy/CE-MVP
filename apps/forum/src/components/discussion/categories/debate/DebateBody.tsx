"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DiscussionThread } from "@/types/discussion";

import { FormattedBody } from "../../formatted-body";

/**
 * Spec-aligned debate body (2026-08-31): motion, vote distribution, for/against
 * argument lists. The reader-facing argument-tree rendering was archived — see
 * archive/cluster1-interactive-mechanics/DebateBody-argument-tree.tsx
 * (typed debate entries = cluster 2, FUTURE-M6-01).
 */
export function DebateBody({
  thread,
  isMax,
  ensureAuthenticated,
}: {
  thread: Extract<DiscussionThread, { category: "debate" }>;
  isMax: boolean;
  ensureAuthenticated: () => boolean;
}) {
  const b = thread.categoryBody;
  const forArguments = b.forArguments ?? [];
  const againstArguments = b.againstArguments ?? [];
  const [vote, setVote] = useState<"agree" | "disagree" | "abstain" | null>(null);
  const [dist, setDist] = useState(b.votes ?? { agree: 0, disagree: 0, abstain: 0 });
  const total = dist.agree + dist.disagree + dist.abstain;

  const cast = (v: "agree" | "disagree" | "abstain") => {
    if (!ensureAuthenticated()) return;
    if (b.status !== "open") return;
    setVote(v);
    setDist((d) => ({ ...d, [v]: d[v] + 1 }));
  };

  const pctNum = (n: number) => (total ? (n / total) * 100 : 0);

  return (
    <div className="space-y-4">
      <Card className="border-(--border-prominent) bg-(--bg-surface)">
        <CardContent className="space-y-3 p-4">
          <p className="text-lg font-medium italic text-(--text-primary)">&ldquo;{b.motion}&rdquo;</p>
          <span
            className={cn(
              "inline-block rounded-full px-3 py-0.5 text-xs font-semibold capitalize",
              b.status === "open" ? "bg-(--feedback-success)/15 text-(--feedback-success)" : "bg-(--bg-overlay) text-(--text-muted)",
            )}
          >
            {b.status}
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-(--bg-inset) text-micro font-medium text-white">
            <div
              className="bg-(--feedback-success) transition-all duration-500"
              style={{ width: `${pctNum(dist.agree)}%` }}
            />
            <div
              className="bg-(--feedback-error) transition-all duration-500"
              style={{ width: `${pctNum(dist.disagree)}%` }}
            />
            <div className="bg-(--text-muted) transition-all duration-500" style={{ width: `${pctNum(dist.abstain)}%` }} />
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-(--text-secondary)">
            <span>Agree {Math.round(pctNum(dist.agree))}%</span>
            <span>Disagree {Math.round(pctNum(dist.disagree))}%</span>
            <span>Abstain {Math.round(pctNum(dist.abstain))}%</span>
          </div>
          {b.status === "open" ? (
            <div className="flex flex-wrap gap-2">
              {(["agree", "disagree", "abstain"] as const).map((v) => (
                <Button key={v} type="button" variant={vote === v ? "primary" : "secondary"} size="sm" onClick={() => cast(v)}>
                  {v}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-(--text-muted)">Voting closed</p>
          )}
          <p className="text-xs text-(--text-muted)">{total} votes</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-(--feedback-success)">For</p>
          {forArguments.map((a) => (
            <Card key={a.id} className={cn(a.strength === "strong" ? "border-(--feedback-success)/40" : "border-(--border-default)")}>
              <CardContent className="p-3 text-sm text-(--text-secondary)">
                <p className="text-(--text-primary)">{a.claim}</p>
                <p className="mt-2 text-xs text-(--text-muted)">{a.upvotes} upvotes</p>
              </CardContent>
            </Card>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={() => ensureAuthenticated()}>
            Add argument
          </Button>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-(--feedback-error)">Against</p>
          {againstArguments.map((a) => (
            <Card key={a.id} className={cn(a.strength === "strong" ? "border-(--feedback-error)/40" : "border-(--border-default)")}>
              <CardContent className="p-3 text-sm text-(--text-secondary)">
                <p className="text-(--text-primary)">{a.claim}</p>
                <p className="mt-2 text-xs text-(--text-muted)">{a.upvotes} upvotes</p>
              </CardContent>
            </Card>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={() => ensureAuthenticated()}>
            Add argument
          </Button>
        </div>
      </div>

      <FormattedBody body={thread.body} />
    </div>
  );
}
