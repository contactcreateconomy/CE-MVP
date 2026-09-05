"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatCompactNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DiscussionThread } from "@/types/discussion";
import type { User } from "@/types";

import { FormattedBody } from "../../formatted-body";

export function LaunchpadBody({
  thread,
  isMax,
  author,
}: {
  thread: Extract<DiscussionThread, { category: "launch-pad" }>;
  isMax: boolean;
  author: User | null;
}) {
  const b = thread.categoryBody;
  const milestones = b.milestones ?? [];
  const changelog = b.changelog ?? [];
  const builtWith = b.builtWith ?? [];
  const stageColor =
    b.stage === "live"
      ? "bg-(--feedback-success)/15 text-(--feedback-success)"
      : b.stage === "beta"
        ? "bg-(--brand-primary)/15 text-(--brand-primary)"
        : b.stage === "prototype"
          ? "bg-(--feedback-warning)/15 text-(--feedback-warning)"
          : "bg-(--bg-overlay) text-(--text-secondary)";

  const cta =
    b.stage === "live"
      ? "Try it →"
      : b.stage === "beta"
        ? "Join waitlist →"
        : "Follow progress →";

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-menu border border-(--border-default) bg-black/20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={b.heroImage} alt="" className="aspect-video w-full object-cover" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold text-(--text-primary)">{b.productName}</h2>
        <span className={cn("rounded-full px-3 py-0.5 text-xs font-semibold capitalize", stageColor)}>{b.stage}</span>
      </div>
      <p className="text-sm text-(--text-secondary)">{b.tagline}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button">{cta}</Button>
        <a
          href={b.productUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center justify-center rounded-md border border-(--border-prominent) px-4 text-sm font-medium text-(--text-primary) transition-colors hover:bg-(--bg-overlay)"
        >
          Visit product →
        </a>
      </div>
      <div className="flex flex-wrap gap-4 rounded-lg border border-(--border-default) bg-(--bg-surface) px-4 py-3 text-sm text-(--text-secondary)">
        <span>Upvotes {formatCompactNumber(thread.upvotes)}</span>
        <span>Comments {thread.comments.length}</span>
        {b.waitlistCount != null ? <span>Waitlist {formatCompactNumber(b.waitlistCount)}</span> : null}
      </div>
      <div className="border-l-4 border-(--brand-primary) bg-(--bg-inset) py-3 pl-4 pr-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-(--text-primary)">
          <UserAvatar user={author} size="md" className="h-8 w-8" />
          From the maker
        </div>
        <p className="mt-2 text-sm leading-relaxed text-(--text-secondary)">{b.makerNote}</p>
      </div>
      {isMax ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-(--text-primary)">Milestones</p>
              <ul className="mt-2 space-y-2 text-sm text-(--text-secondary)">
                {milestones.map((m) => (
                  <li key={m.label}>
                    <span className="font-medium text-(--text-primary)">{m.date}</span> — {m.label}{" "}
                    {m.upcoming ? <span className="text-(--text-muted)">(Upcoming)</span> : null}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-(--text-primary)">Version log</p>
              <ul className="mt-2 space-y-2 text-sm text-(--text-secondary)">
                {changelog.map((c) => (
                  <li key={c.version} className={c.current ? "font-medium text-(--text-primary)" : ""}>
                    {c.version} · {new Date(c.date).toLocaleDateString()} — {c.summary}{" "}
                    {c.current ? <span className="text-(--brand-primary)">Current</span> : null}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-(--text-primary)">Built with</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {builtWith.map((t) => (
                  <span key={t} className="rounded-full border border-(--border-default) bg-(--bg-surface) px-3 py-1 text-xs text-(--text-secondary)">
                    {t}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
      <FormattedBody body={thread.body} />
    </div>
  );
}
