"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import type { Comment, Post, User } from "@/types";
import { getCategories } from "@/lib/adapters/content";
import { CommentsPreviewCycler } from "@/components/feed/comments-preview-cycler";
import { PostActionsMenu } from "@/components/feed/post-actions-menu";
import { PostInteractionRow } from "@/components/feed/post-interaction-row";
import { UserAvatar } from "@/components/ui/user-avatar";

interface PostCardProps {
  post: Post;
  author: User | null;
  comments: Comment[];
  commenters: User[];
  isFavorited: boolean;
  isUpvoted: boolean;
  onToggleFavorite: () => void;
  onToggleUpvote: () => void;
  onHide: () => void;
  onReport: () => void;
  onShare: () => void;
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
}: PostCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const categories = getCategories();
  const category = categories.find((item) => item.key === post.category) ?? null;

  const previewComments = comments.slice(0, 4).map((comment) => {
    const commentAuthor = commenters.find((user) => user.id === comment.authorId);
    return {
      id: comment.id,
      body: comment.body,
      handle: commentAuthor?.handle ?? "unknown",
    };
  });

  const hasCoverImage = Boolean(post.coverImage);

  return (
    <article
      className="card-surface group animate-soft-float relative overflow-hidden border border-[var(--border-subtle)] p-4 transition-transform duration-200 hover:-translate-y-[2px] hover:border-[var(--border-active)]/60 hover:shadow-[0_8px_24px_rgba(14,165,233,0.16)]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      <div className="absolute right-3 top-3 z-20">
        <PostActionsMenu menuId={post.id} onShare={onShare} onHide={onHide} onReport={onReport} />
      </div>

      {hasCoverImage ? (
        <div>
          <div className="mb-3 flex items-start justify-between gap-3 pr-10">
            <div className="flex min-w-0 items-center gap-2.5">
              <UserAvatar user={author} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                  {author?.name ?? "Unknown author"}
                </p>
                <p className="truncate font-mono text-[11px] font-light text-[var(--text-muted)]">
                  @{author?.handle ?? "unknown"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_208px] md:items-end">
            <div className="min-w-0">
              <Link href={post.threadExperimentId ? `/discussion/${post.threadExperimentId}` : `/discussions/${post.slug}`} className="block">
                <h3 className="text-xl font-bold leading-snug text-[var(--text-primary)]">{post.title}</h3>
              </Link>
              <p className="mt-2 break-words text-sm text-[var(--text-secondary)]">{post.summary}</p>

              <div className="mt-4">
                <CommentsPreviewCycler comments={previewComments} isActive={isHovered} />
              </div>
            </div>

            <div className="relative h-[132px] w-full max-w-full overflow-hidden rounded-[14px] md:h-[140px]">
              <Image
                src={post.coverImage!}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, 208px"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="pr-10">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <UserAvatar user={author} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                  {author?.name ?? "Unknown author"}
                </p>
                <p className="truncate font-mono text-[11px] font-light text-[var(--text-muted)]">
                  @{author?.handle ?? "unknown"}
                </p>
              </div>
            </div>
          </div>

          <Link href={`/discussions/${post.slug}`} className="block">
            <h3 className="text-xl font-bold leading-snug text-[var(--text-primary)]">{post.title}</h3>
          </Link>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{post.summary}</p>

          <div className="mt-4">
            <CommentsPreviewCycler comments={previewComments} isActive={isHovered} />
          </div>
        </div>
      )}

      <div className="mt-4">
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
