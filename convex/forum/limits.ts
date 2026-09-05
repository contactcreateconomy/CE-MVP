/** Content and feed limits for scale / abuse resistance. */

export const MAX_POST_TITLE_LEN = 200;
export const MAX_POST_SUMMARY_LEN = 600;
export const MAX_POST_BODY_LEN = 80_000;

/** Max posts scanned for hot/top ranking (bounded read). */
export const FEED_HOT_RANK_WINDOW = 400;

/** Default page size for feed pagination. */
export const FEED_PAGE_DEFAULT = 24;
export const FEED_PAGE_MAX = 48;

/** Comment previews per post on feed surfaces. */
export const FEED_COMMENTS_PREVIEW_PER_POST = 6;

/** Bounded search: max posts from recent window, max user rows. */
export const SEARCH_MAX_POSTS_SCAN = 400;
export const SEARCH_MAX_USERS_SCAN = 200;
export const SEARCH_MAX_RESULTS_EACH = 40;

/** Related / trending slugs resolved per discussion route (cap). */
export const DISCUSSION_RELATED_CAP = 8;
export const DISCUSSION_TRENDING_CAP = 8;

/** Max body length for a comment (characters). */
export const MAX_COMMENT_BODY_LEN = 10_000;

/** Profile field limits. */
export const MAX_PROFILE_NAME_LEN = 80;
export const MAX_PROFILE_BIO_LEN = 1_000;
export const MAX_PROFILE_HANDLE_LEN = 40;

export const RATE_WINDOWS_MS = {
  createPost: 60 * 60 * 1000,
  createComment: 60 * 60 * 1000,
  toggleUpvote: 60 * 1000,
  toggleFavorite: 60 * 1000,
  createReport: 60 * 60 * 1000,
} as const;

export const RATE_MAX_PER_WINDOW = {
  createPost: 30,
  createComment: 60,
  toggleUpvote: 200,
  toggleFavorite: 200,
  createReport: 10,
} as const;

export type RateKind = keyof typeof RATE_WINDOWS_MS;
