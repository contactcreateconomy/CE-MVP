"use client";

import type { ComponentType } from "react";
import { ArrowUp, Bookmark, Briefcase, ChevronsUp, GitCompare, HelpCircle, LayoutList, MessageCircle, Newspaper, Rocket, Sparkles, Star, Swords } from "lucide-react";

import { Component as AvatarWithName } from "@/components/ui/avatar-with-name";
import { formatCompactNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Category, CategoryKey, User } from "@/types";
import { UserAvatar } from "@/components/ui/user-avatar";

interface PostInteractionRowProps {
  upvotes: number;
  commentsCount: number;
  isFavorited: boolean;
  isUpvoted: boolean;
  category: Category | null;
  commenterUsers: User[];
  onToggleFavorite: () => void;
  onToggleUpvote: () => void;
}

const categoryIconMap: Record<CategoryKey, ComponentType<{ className?: string }>> = {
  news: Newspaper,
  review: Star,
  compare: GitCompare,
  "launch-pad": Rocket,
  debate: Swords,
  qa: HelpCircle,
  spark: Sparkles,
  list: LayoutList,
  showcase: Sparkles,
  gigs: Briefcase,
};

export function PostInteractionRow({
  upvotes,
  commentsCount,
  isFavorited,
  isUpvoted,
  category,
  commenterUsers,
  onToggleFavorite,
  onToggleUpvote,
}: PostInteractionRowProps) {
  const UpvoteIcon = isUpvoted ? ChevronsUp : ArrowUp;
  const CategoryIcon = category ? (categoryIconMap[category.key] ?? Sparkles) : Sparkles;

  return (
    <div className="flex items-center justify-between gap-2 rounded-menu border border-(--border-subtle) bg-(--bg-overlay)/20 px-2 py-2 sm:px-3">
      <div className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-(--text-secondary) sm:gap-3">
        <button
          type="button"
          onClick={onToggleUpvote}
          className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-1.5 py-1 transition-transform duration-normal hover:-translate-y-0.5 sm:px-2 ${
            isUpvoted ? "text-(--brand-primary)" : ""
          }`}
          aria-label={isUpvoted ? "Remove upvote" : "Upvote post"}
        >
          <UpvoteIcon className={`h-3.5 w-3.5 shrink-0 transition-transform duration-150 ${isUpvoted ? "scale-110" : ""}`} />
          {formatCompactNumber(upvotes)}
        </button>

        <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-1.5 py-1 transition-transform duration-normal hover:-translate-y-0.5 sm:px-2">
          <MessageCircle className="h-3.5 w-3.5 shrink-0" />
          {formatCompactNumber(commentsCount)}
        </span>

        <button
          type="button"
          onClick={onToggleFavorite}
          className={cn(
            "group inline-flex min-w-0 items-center gap-1 whitespace-nowrap rounded-full px-1.5 py-1 transition-[transform,color,background-color] duration-normal sm:px-2",
            "hover:-translate-y-0.5 hover:scale-[1.04] hover:bg-(--bg-overlay)/55",
            "active:scale-95 active:duration-75",
            isFavorited && "text-(--brand-primary)",
          )}
          aria-label={isFavorited ? "Remove favorite" : "Add favorite"}
        >
          <Bookmark
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-transform duration-normal group-hover:scale-110 group-active:scale-125",
              isFavorited && "fill-current scale-110",
            )}
          />
          Fav
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <AvatarWithName
          name={category?.name ?? "General"}
          direction="top"
          size="sm"
          icon={<CategoryIcon className="h-5 w-5 text-(--text-primary) stroke-(--text-primary) transition-colors duration-normal" />}
          className="relative z-30 group/cat"
          motionClassName="[&>span]:h-8 [&>span]:w-8 sm:[&>span]:h-9 sm:[&>span]:w-9"
          avatarClassName={cn(
            "h-8 w-8 bg-(--bg-surface) sm:h-9 sm:w-9",
          )}
          nameClassName="bg-(--bg-surface) text-(--text-primary) border-(--border-default)"
          labelStyle={{ left: "50%", translate: "-50% 0" }}
        />

        <div className="flex -space-x-1.5">
          {commenterUsers.slice(0, 3).map((user, index) => (
            <UserAvatar
              key={user.id}
              user={user}
              size="sm"
              className={cn(
                "shrink-0 ring-2 ring-(--bg-surface)",
                index === 1 && "max-[340px]:hidden",
                index === 2 && "max-[401px]:hidden",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
