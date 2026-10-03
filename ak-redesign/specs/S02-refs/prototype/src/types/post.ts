import type { CategoryKey } from "./category";
import type { ThreadId } from "./thread";

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
  threadExperimentId?: ThreadId;
}
