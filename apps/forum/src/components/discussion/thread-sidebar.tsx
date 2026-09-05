"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatCompactNumber } from "@/lib/format";
import type { DiscussionThread } from "@/types/discussion";
import type { User } from "@/types";

export interface ThreadSidebarPreview {
  slug: string;
  title: string;
  authorId: string;
  engagement: number;
}

interface ThreadSidebarProps {
  thread: DiscussionThread;
  author: User | null;
  isMax: boolean;
  related: ThreadSidebarPreview[];
  trending: ThreadSidebarPreview[];
  usersById: Map<string, User>;
  categoryName: string;
}

export function ThreadSidebar({
  thread,
  author,
  isMax,
  related,
  usersById,
}: ThreadSidebarProps) {
  const rail = thread.insightRail;
  const summary = rail?.summary ?? "";
  const keyAgreements = Array.isArray(rail?.keyAgreements) ? rail.keyAgreements : [];

  // Minimal: show 3 related, Max: show 5
  const relatedPosts = related.slice(0, isMax ? 5 : 3);

  const authorCard = (
    <Card className="border-(--border-default) bg-(--bg-surface)">
      <CardContent className="p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
          Author
        </p>
        {author ? (
          <Link
            href={`/users/${encodeURIComponent(author.handle)}`}
            className="flex items-center gap-3 rounded-lg outline-offset-2 transition-colors hover:bg-(--bg-overlay)/50 focus-visible:ring-2 focus-visible:ring-(--border-active)"
          >
            <UserAvatar user={author} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-(--text-primary)">{author.name}</p>
              <p className="text-xs text-(--text-muted)">@{author.handle}</p>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <UserAvatar user={null} size="md" />
            <p className="text-sm font-semibold text-(--text-primary)">Unknown</p>
          </div>
        )}
        {author?.bio ? (
          <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-(--text-secondary)">
            {author.bio}
          </p>
        ) : null}
        {author ? (
          <div className="mt-2">
            <span className="inline-flex items-center rounded-full bg-(--brand-primary)/10 px-2 py-0.5 text-label-sm font-semibold text-(--brand-primary)">
              {formatCompactNumber(author.points)} pts
            </span>
          </div>
        ) : null}
        <Button type="button" variant="secondary" size="sm" className="mt-3 w-full">
          Follow
        </Button>
      </CardContent>
    </Card>
  );

  const relatedCard = relatedPosts.length > 0 ? (
    <Card className="border-(--border-default) bg-(--bg-surface)">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
            Related
          </p>
          <ArrowRight className="h-3 w-3 text-(--text-muted)" />
        </div>
        <div className="space-y-2">
          {relatedPosts.map((r) => {
            const u = usersById.get(r.authorId);
            return (
              <Link
                key={r.slug}
                href={`/discussions/${r.slug}`}
                className="block rounded-xl p-2.5 transition-colors hover:bg-(--bg-overlay)/50"
              >
                <p className="line-clamp-2 text-sm font-medium text-(--text-primary)">
                  {r.title}
                </p>
                <p className="mt-0.5 text-xs text-(--text-muted)">{u?.name ?? "Member"}</p>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  ) : null;

  // Max-only: Thread Intelligence
  const intelligenceCard = isMax ? (
    <Card className="border-(--border-default) bg-(--bg-surface)">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-(--brand-primary)" />
          <p className="text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
            Thread Intelligence
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-(--bg-inset) px-2 py-2">
            <p className="text-base font-bold text-(--text-primary)">
              {formatCompactNumber(thread.views)}
            </p>
            <p className="text-micro text-(--text-muted)">Reads</p>
          </div>
          <div className="rounded-lg bg-(--bg-inset) px-2 py-2">
            <p className="text-base font-bold text-(--text-primary)">
              {formatCompactNumber(thread.comments?.length ?? 0)}
            </p>
            <p className="text-micro text-(--text-muted)">Replies</p>
          </div>
          <div className="rounded-lg bg-(--bg-inset) px-2 py-2">
            <p className="text-base font-bold text-(--text-primary)">
              {formatCompactNumber(thread.upvotes)}
            </p>
            <p className="text-micro text-(--text-muted)">Upvotes</p>
          </div>
        </div>
      </CardContent>
    </Card>
  ) : null;

  // Max-only: Key Insights from insightRail
  const insightsCard = isMax && (summary || keyAgreements.length > 0) ? (
    <Card className="border-(--border-default) bg-(--bg-surface)">
      <CardContent className="p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
          Key Insights
        </p>
        {summary ? (
          <p className="text-sm leading-relaxed text-(--text-secondary)">{summary}</p>
        ) : null}
        {keyAgreements.length > 0 ? (
          <ul className="list-inside list-disc space-y-1 text-sm text-(--text-secondary)">
            {keyAgreements.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  ) : null;

  const sidebarContent = (
    <div className="space-y-4">
      {authorCard}
      {intelligenceCard}
      {insightsCard}
      {relatedCard}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-[300px] shrink-0 lg:block">
        <div className="sticky top-20 space-y-4">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile: show below content */}
      <div className="lg:hidden mt-6 space-y-4">
        {sidebarContent}
      </div>
    </>
  );
}
