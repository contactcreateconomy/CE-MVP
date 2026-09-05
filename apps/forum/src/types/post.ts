import type { CategoryKey } from "./category";

export interface Post {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  coverImage?: string;
  category: CategoryKey;
  authorId: string;
  upvotes: number;
  commentsCount: number;
  views: number;
  createdAt: string;
  trending: "hot" | "recent" | "evergreen";
  isFavorited: boolean;
  locked: boolean;
  /** From Convex: post has a rich discussion document at this slug */
  isRichThread?: boolean;
  /** Viewer has upvoted (auth); used for button state */
  viewerHasUpvote?: boolean;
  /** Structured category-specific fields (from forumCategoryPayloads) */
  categoryBody?: Record<string, unknown>;
}
