"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronUp,
  MessageCircle,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MOCK_CATEGORIES } from "@/lib/mock-data";
import { fadeInUp } from "@/lib/animations";
import { cn } from "@/lib/utils";
import type { Discussion } from "@/lib/types";

interface DiscussionCardProps {
  discussion: Discussion;
  index: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  news: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  review: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  compare: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  list: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  help: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  showcase: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
  tutorial: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
  debate: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  launch: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
};

/** Max avatars shown in the participant stack */
const MAX_AVATARS = 4;

export function DiscussionCard({ discussion, index }: DiscussionCardProps) {
  const [upvoted, setUpvoted] = useState(discussion.isUpvoted);
  const [upvotes, setUpvotes] = useState(discussion.upvotes);
  const [favorited, setFavorited] = useState(discussion.isFavorited);

  const categoryMeta = MOCK_CATEGORIES.find(
    (c) => c.slug === discussion.category
  );

  const handleUpvote = () => {
    if (upvoted) {
      setUpvotes((prev) => prev - 1);
    } else {
      setUpvotes((prev) => prev + 1);
    }
    setUpvoted(!upvoted);
  };

  const visibleParticipants = discussion.participants.slice(0, MAX_AVATARS);
  const extraCount = discussion.participants.length - MAX_AVATARS;

  return (
    <motion.div
      variants={fadeInUp}
      transition={{ duration: 0.3, delay: index * 0.08 }}
    >
      <Card
        className={cn(
          "group relative cursor-pointer overflow-hidden p-4 transition-all duration-200",
          "hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/20",
          "dark:hover:shadow-primary/5 dark:hover:border-primary/30"
        )}
        role="article"
        aria-label={`Discussion: ${discussion.title}`}
      >
        {/* Top row: Author + Category + More */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage
                src={discussion.author.avatar}
                alt={discussion.author.name}
              />
              <AvatarFallback>{discussion.author.name[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">
                  {discussion.author.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {discussion.createdAt}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                CATEGORY_COLORS[discussion.category] || ""
              )}
            >
              {categoryMeta?.icon} {categoryMeta?.label}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="More options"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Share</DropdownMenuItem>
                <DropdownMenuItem>Report</DropdownMenuItem>
                <DropdownMenuItem>Mute</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Title + Summary */}
        <div className="mt-2.5">
          <h3 className="text-base font-semibold leading-snug group-hover:text-primary transition-colors duration-200">
            {discussion.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {discussion.summary}
          </p>
        </div>

        {/* Bottom row: Actions */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Upvote */}
            <motion.button
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors",
                upvoted
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              onClick={(e) => {
                e.stopPropagation();
                handleUpvote();
              }}
              whileTap={{ scale: 1.15 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              aria-label={`Upvote, ${upvotes} votes`}
              aria-pressed={upvoted}
            >
              <ChevronUp className="h-4 w-4" />
              <span className="tabular-nums font-medium">{upvotes}</span>
            </motion.button>

            {/* Comments */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              <span className="tabular-nums">{discussion.commentCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Participant avatars */}
            <div className="flex -space-x-2" aria-label="Discussion participants">
              {visibleParticipants.map((user, i) => (
                <Avatar
                  key={user.id}
                  className="h-6 w-6 border-2 border-card"
                  style={{ zIndex: MAX_AVATARS - i }}
                >
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-[10px]">
                    {user.name[0]}
                  </AvatarFallback>
                </Avatar>
              ))}
              {extraCount > 0 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-medium">
                  +{extraCount}
                </div>
              )}
            </div>

            {/* Bookmark */}
            <motion.button
              className={cn(
                "rounded-md p-1 transition-colors",
                favorited
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={(e) => {
                e.stopPropagation();
                setFavorited(!favorited);
              }}
              whileTap={{ scale: 1.2 }}
              aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
              aria-pressed={favorited}
            >
              <Bookmark
                className="h-4 w-4"
                fill={favorited ? "currentColor" : "none"}
              />
            </motion.button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
