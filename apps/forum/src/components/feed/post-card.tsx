"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import type { Category, Comment, Post, User } from "@/types";
import { getDiscussionHrefForPost } from "@/lib/discussion/feed-post-discussion-slug";
import { getCategoryTemplate } from "@/components/discussion/categories/registry";
import { CommentsPreviewCycler } from "@/components/feed/comments-preview-cycler";
import { PostActionsMenu } from "@/components/feed/post-actions-menu";
import { PostInteractionRow } from "@/components/feed/post-interaction-row";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useCoverImageUrl } from "@/hooks/use-cover-image-url";

interface PostCardProps {
  post: Post;
  author: User | null;
  comments: Comment[];
  commenters: User[];
  categories: Category[];
  isFavorited: boolean;
  isUpvoted: boolean;
  onToggleFavorite: () => void;
  onToggleUpvote: () => void;
  onHide: () => void;
  onReport: () => void;
  onShare: () => void;
  onPostClick?: () => void;
}

export function PostCard({
  post,
  author,
  comments,
  commenters,
  isFavorited,
  isUpvoted,
  onToggleFavorite,
  onToggleUpvote,
  onHide,
  onReport,
  onShare,
  onPostClick,
  categories,
}: PostCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const category = categories.find((item) => item.key === post.category) ?? null;
  const discussionHref = getDiscussionHrefForPost(post);
  const coverImageUrl = useCoverImageUrl(post.coverImage);

  const previewComments = comments.slice(0, 4).map((comment) => {
    const commentAuthor = commenters.find((user) => user.id === comment.authorId);
    return {
      id: comment.id,
      body: comment.body,
      handle: commentAuthor?.handle ?? "unknown",
    };
  });

  const hasCoverImage = Boolean(post.coverImage);

  const cardExtrasTpl = getCategoryTemplate(post.category);
  const CardExtrasComponent = cardExtrasTpl?.CardExtras;

  const fallbackAuthorName = "authorName" in post ? (post.authorName as string) : null;
  const fallbackAuthorHandle = "authorHandle" in post ? (post.authorHandle as string) : null;

  const authorRow = author ? (
    <Link
      href={`/users/${encodeURIComponent(author.handle)}`}
      className="flex min-w-0 max-w-full items-center gap-2.5 rounded-lg outline-offset-2 transition-colors hover:bg-(--bg-overlay)/60 focus-visible:ring-2 focus-visible:ring-(--border-active)"
    >
      <UserAvatar user={author} authorName={fallbackAuthorName} size="md" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-(--text-primary)">{author.name}</p>
        <p className="truncate font-mono text-label-sm font-light text-(--text-muted)">@{author.handle}</p>
      </div>
    </Link>
  ) : (
    <div className="flex min-w-0 items-center gap-2.5">
      <UserAvatar user={author} authorName={fallbackAuthorName} size="md" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-(--text-primary)">{fallbackAuthorName || "Unknown author"}</p>
        <p className="truncate font-mono text-label-sm font-light text-(--text-muted)">@{fallbackAuthorHandle || "unknown"}</p>
      </div>
    </div>
  );

  return (
    <article
      className="card-surface feed-post-card group relative p-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      <div className="absolute right-3 top-3 z-20">
        <PostActionsMenu onShare={onShare} onHide={onHide} onReport={onReport} />
      </div>

      {hasCoverImage ? (
        <div>
          <div className="mb-3 flex items-start justify-between gap-3 pr-10">{authorRow}</div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_208px] md:items-end">
            <Link href={discussionHref} onClick={onPostClick} className="min-w-0 block outline-offset-2 focus-visible:rounded-lg">
              <h3 className="text-xl font-bold leading-snug text-(--text-primary)">{post.title}</h3>
              <p className="mt-2 wrap-break-word text-sm text-(--text-secondary)">{post.summary}</p>

              {CardExtrasComponent && <CardExtrasComponent post={post} />}

              <div className="mt-4">
                <CommentsPreviewCycler comments={previewComments} isActive={isHovered} />
              </div>
            </Link>

            <Link
              href={discussionHref}
              className="relative block h-[132px] w-full max-w-full overflow-hidden rounded-menu outline-offset-2 md:h-[140px]"
              aria-label={`Open discussion: ${post.title}`}
            >
              <Image
                src={coverImageUrl!}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, 208px"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              />
            </Link>
          </div>
        </div>
      ) : (
        <div className="pr-10">
          <div className="mb-3 flex items-start justify-between gap-3">{authorRow}</div>

          <Link href={discussionHref} onClick={onPostClick} className="block outline-offset-2 focus-visible:rounded-lg">
            <h3 className="text-xl font-bold leading-snug text-(--text-primary)">{post.title}</h3>
            <p className="mt-2 text-sm text-(--text-secondary)">{post.summary}</p>

            {CardExtrasComponent && <CardExtrasComponent post={post} />}

            <div className="mt-4">
              <CommentsPreviewCycler comments={previewComments} isActive={isHovered} />
            </div>
          </Link>
        </div>
      )}

      <div className="relative z-20 mt-4">
        <PostInteractionRow
          upvotes={post.upvotes}
          commentsCount={post.commentsCount}
          isFavorited={isFavorited}
          isUpvoted={isUpvoted}
          category={category}
          commenterUsers={commenters}
          onToggleFavorite={onToggleFavorite}
          onToggleUpvote={onToggleUpvote}
        />
      </div>
    </article>
  );
}

export function PostCardSkeleton() {
  return (
    <article className="card-surface feed-post-card group relative p-4">
      <div>
        <div className="mb-3 flex items-start gap-3 pr-10">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-(--bg-overlay)" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-24 animate-pulse rounded bg-(--bg-overlay)" />
              <div className="h-2.5 w-16 animate-pulse rounded bg-(--bg-overlay)/50" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_208px] md:items-end">
          <div>
            <div className="h-6 w-3/4 animate-pulse rounded bg-(--bg-overlay)" />
            <div className="mt-3 space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-(--bg-overlay)/50" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-(--bg-overlay)/50" />
            </div>

            <div className="mt-6 flex flex-col gap-1.5">
              <div className="h-3 w-32 animate-pulse rounded bg-(--bg-overlay)/40" />
            </div>
          </div>

          <div className="relative block h-[132px] w-full max-w-full overflow-hidden rounded-menu bg-(--bg-overlay)/40 animate-pulse md:h-[140px]" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 border-t border-(--border-subtle) pt-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-16 animate-pulse rounded-full bg-(--bg-overlay)/50" />
          <div className="h-8 w-16 animate-pulse rounded-full bg-(--bg-overlay)/50" />
        </div>
        <div className="h-4 w-4 animate-pulse rounded-full bg-(--bg-overlay)/50 ml-auto" />
      </div>
    </article>
  );
}
