import {
  allThreads,
  campaigns,
  categories,
  comments,
  defaultSettings,
  getThreadById as getThreadByIdFromMock,
  getThreadCommentsById as getThreadCommentsByIdFromMock,
  getTopPostHeroSlides as getTopPostHeroSlidesFromMock,
  leaderboard,
  notifications,
  posts,
  primaryNav,
  users,
  vibingItems,
} from "@/lib/mock-data";
import type { ThreadComment, ThreadData } from "@/types";

export type { TopPostHeroSlide } from "@/lib/mock-data";

export interface ContentDataSource {
  getPrimaryNav: () => typeof primaryNav;
  getCategories: () => typeof categories;
  getFeedData: () => {
    posts: typeof posts;
    comments: typeof comments;
    users: typeof users;
  };
  getVibingItems: (limit?: number) => typeof vibingItems;
  getCampaigns: () => typeof campaigns;
  getNotificationsForUser: (userId: string) => typeof notifications;
  getDefaultSettings: () => typeof defaultSettings;
  getTopPostHeroSlides: () => ReturnType<typeof getTopPostHeroSlidesFromMock>;
  getPostBySlug: (slug: string) => (typeof posts)[number] | null;
  getUserById: (userId: string) => (typeof users)[number] | null;
  getUserByHandle: (handle: string) => (typeof users)[number] | null;
  getPostsByCategorySlug: (slug: string) => typeof posts;
  getPostsByAuthor: (authorId: string) => typeof posts;
  getCommentsByPostId: (postId: string) => typeof comments;
  getCategoryBySlug: (slug: string) => (typeof categories)[number] | null;
  getUnreadNotifications: (userId: string) => typeof notifications;
  getLeaderboardWithUsers: () => Array<
    (typeof leaderboard)[number] & {
      user: (typeof users)[number] | null;
    }
  >;
  getThreads: () => ThreadData[];
  getThreadById: (threadId: string) => ThreadData | null;
  getThreadCommentsById: (threadId: string) => ThreadComment[];
  getThreadContextById: (threadId: string) => ThreadData["sidebar"] | null;
  getThreadDiscussionData: (threadId: string) => { thread: ThreadData; comments: ThreadComment[] } | null;
}

const mockContentDataSource: ContentDataSource = {
  getPrimaryNav: () => primaryNav,
  getCategories: () => categories,
  getFeedData: () => ({
    posts,
    comments,
    users,
  }),
  getVibingItems: (limit = 10) => vibingItems.slice(0, limit),
  getCampaigns: () => campaigns,
  getNotificationsForUser: (userId: string) => notifications.filter((notification) => notification.userId === userId),
  getDefaultSettings: () => defaultSettings,
  getTopPostHeroSlides: () => getTopPostHeroSlidesFromMock(posts),
  getPostBySlug: (slug: string) => posts.find((post) => post.slug === slug) ?? null,
  getUserById: (userId: string) => users.find((user) => user.id === userId) ?? null,
  getUserByHandle: (handle: string) => users.find((user) => user.handle === handle) ?? null,
  getPostsByCategorySlug: (slug: string) => posts.filter((post) => post.category === slug),
  getPostsByAuthor: (authorId: string) => posts.filter((post) => post.authorId === authorId),
  getCommentsByPostId: (postId: string) => comments.filter((comment) => comment.postId === postId),
  getCategoryBySlug: (slug: string) => categories.find((category) => category.key === slug) ?? null,
  getUnreadNotifications: (userId: string) =>
    notifications.filter((notification) => notification.userId === userId && !notification.read),
  getLeaderboardWithUsers: () =>
    leaderboard.map((entry) => ({
      ...entry,
      user: users.find((user) => user.id === entry.userId) ?? null,
    })),
  getThreads: () => allThreads,
  getThreadById: (threadId: string) => getThreadByIdFromMock(threadId),
  getThreadCommentsById: (threadId: string) => getThreadCommentsByIdFromMock(threadId),
  getThreadContextById: (threadId: string) => getThreadByIdFromMock(threadId)?.sidebar ?? null,
  getThreadDiscussionData: (threadId: string) => {
    const thread = getThreadByIdFromMock(threadId);
    if (!thread) {
      return null;
    }

    return {
      thread,
      comments: getThreadCommentsByIdFromMock(threadId),
    };
  },
};

export function getPrimaryNav() {
  return mockContentDataSource.getPrimaryNav();
}

export function getCategories() {
  return mockContentDataSource.getCategories();
}

export function getFeedData() {
  return mockContentDataSource.getFeedData();
}

export function getVibingItems(limit = 10) {
  return mockContentDataSource.getVibingItems(limit);
}

export function getCampaigns() {
  return mockContentDataSource.getCampaigns();
}

export function getNotificationsForUser(userId: string) {
  return mockContentDataSource.getNotificationsForUser(userId);
}

export function getDefaultSettings() {
  return mockContentDataSource.getDefaultSettings();
}

export function getTopPostHeroSlides() {
  return mockContentDataSource.getTopPostHeroSlides();
}

export function getPostBySlug(slug: string) {
  return mockContentDataSource.getPostBySlug(slug);
}

export function getUserById(userId: string) {
  return mockContentDataSource.getUserById(userId);
}

export function getUserByHandle(handle: string) {
  return mockContentDataSource.getUserByHandle(handle);
}

export function getPostsByCategorySlug(slug: string) {
  return mockContentDataSource.getPostsByCategorySlug(slug);
}

export function getPostsByAuthor(authorId: string) {
  return mockContentDataSource.getPostsByAuthor(authorId);
}

export function getCommentsByPostId(postId: string) {
  return mockContentDataSource.getCommentsByPostId(postId);
}

export function getCategoryBySlug(slug: string) {
  return mockContentDataSource.getCategoryBySlug(slug);
}

export function getUnreadNotifications(userId: string) {
  return mockContentDataSource.getUnreadNotifications(userId);
}

export function getLeaderboardWithUsers() {
  return mockContentDataSource.getLeaderboardWithUsers();
}

export function getThreads() {
  return mockContentDataSource.getThreads();
}

export function getThreadById(threadId: string) {
  return mockContentDataSource.getThreadById(threadId);
}

export function getThreadCommentsById(threadId: string) {
  return mockContentDataSource.getThreadCommentsById(threadId);
}

export function getThreadContextById(threadId: string) {
  return mockContentDataSource.getThreadContextById(threadId);
}

export function getThreadDiscussionData(threadId: string) {
  return mockContentDataSource.getThreadDiscussionData(threadId);
}
