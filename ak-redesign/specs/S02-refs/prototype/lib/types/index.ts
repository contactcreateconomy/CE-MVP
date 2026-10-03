/** User type for the platform */
export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  points: number;
  role: "member" | "moderator" | "admin";
}

/** Discussion post type */
export interface Discussion {
  id: string;
  title: string;
  summary: string;
  category: CategorySlug;
  author: User;
  createdAt: string;
  upvotes: number;
  commentCount: number;
  participants: User[];
  isFavorited: boolean;
  isUpvoted: boolean;
  tags: string[];
}

/** Category slugs for sidebar */
export type CategorySlug =
  | "news"
  | "review"
  | "compare"
  | "list"
  | "help"
  | "showcase"
  | "tutorial"
  | "debate"
  | "launch";

/** Category with metadata */
export interface Category {
  slug: CategorySlug;
  label: string;
  icon: string;
  count: number;
  isPremium: boolean;
  pointsRequired?: number;
}

/** Featured slider item */
export interface FeaturedSlide {
  id: string;
  title: string;
  subtitle: string;
  gradient: string;
  imageUrl?: string;
}

/** Notification type */
export interface Notification {
  id: string;
  type: "reply" | "mention" | "upvote" | "system";
  message: string;
  avatar: string;
  timestamp: string;
  isRead: boolean;
}

/** Leaderboard entry */
export interface LeaderboardEntry {
  rank: number;
  user: User;
  weeklyPoints: number;
  trend: "up" | "down" | "stable";
  trendData: number[];
}

/** Trending topic for "What's Vibing" */
export interface TrendingTopic {
  id: string;
  title: string;
  engagement: number;
  category: CategorySlug;
  gradient: string;
}

/** Campaign data */
export interface Campaign {
  id: string;
  title: string;
  description: string;
  prize: string;
  daysLeft: number;
  totalEntries: number;
  maxEntries: number;
  gradient: string;
}

/** Feed tab type */
export type FeedTab = "top" | "hot" | "new" | "fav";
