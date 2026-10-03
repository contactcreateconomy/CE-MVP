"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DebateArgumentNode, DiscussionThread } from "@/types/discussion";

import { FormattedBody } from "../../formatted-body";

function ArgumentTreeNodes({
  nodes,
  depth,
}: {
  nodes: DebateArgumentNode[];
  depth: number;
}) {
  if (depth > 2) return null;
  return (
    <ul className="mt-2 space-y-2 border-l border-(--border-default) pl-4">
      {nodes.map((n) => (
        <li key={n.id} className="text-sm text-(--text-secondary)">
          <span className="font-medium text-(--text-primary)">{n.claim}</span>
          <span className="ml-2 text-xs capitalize text-(--text-muted)">{n.side}</span>
          {n.relation ? <span className="text-xs text-(--text-muted)"> ({n.relation})</span> : null}
          {n.children && n.children.length > 0 ? <ArgumentTreeNodes nodes={n.children} depth={depth + 1} /> : null}
        </li>
      ))}
    </ul>
  );
}

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
  const argumentTree = b.argumentTree ?? [];
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
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-(--bg-inset) text-[10px] font-medium text-white">
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

      {isMax && argumentTree.length > 0 ? (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-(--text-primary)">Argument tree</p>
            <ArgumentTreeNodes nodes={argumentTree} depth={0} />
          </CardContent>
        </Card>
      ) : null}

      <FormattedBody body={thread.body} />
    </div>
  );
}
