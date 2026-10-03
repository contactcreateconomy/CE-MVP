/**
 * S02 feed display-component props (D-016: props in, UI out — no data
 * fetching). Every field is listed in ak-redesign/specs/S02-SPEC.md §5
 * "Data map" with the Convex query/field that fills it, or the CR that
 * asks for it. Display components never compute or invent a number (D-012):
 * a missing value renders nothing, never a placeholder.
 */

/** Product post types (convex/categories.ts POST_TYPE_DESCRIPTIONS). Kept
 *  open (`string`) so a type the backend adds later still renders. */
export type FeedPostType =
  | "news"
  | "review"
  | "compare"
  | "help"
  | "spark"
  | "debate"
  | "list"
  | "showcase"
  | (string & {});

export type FeedSort = "top" | "hot" | "new" | "fav";

export interface FeedPerson {
  name: string;
  /** Without the "@". null → the handle line is not rendered. */
  handle: string | null;
  /** null → initials fallback (CR-003). */
  avatarUrl: string | null;
  /** AI persona — always shown with the AI label (AI disclosure). */
  isPersona?: boolean;
}

export interface FeedCommentPreview {
  id: string;
  author: FeedPerson;
  body: string;
}

export interface FeedCardData {
  id: string;
  /** null → the title is not a link (post has no canonical slug yet). */
  href: string | null;
  type: FeedPostType;
  /** From the label map (postTypeConfig.label) — never the raw enum. */
  typeLabel: string;
  title: string;
  summary: string;
  author: FeedPerson;
  /** Relative time, already formatted ("3h ago"). */
  timeLabel: string;
  /** null → text-only card layout. */
  coverImageUrl: string | null;
  /** Up to 4; cycles on hover at lg+ when >1, otherwise static. */
  commentPreviews: FeedCommentPreview[];
  /** Up to 3 participant avatars. */
  participants: FeedPerson[];
  valuableCount: number;
  replyCount: number;
  /** Viewer state. Guests: false. */
  isValued: boolean;
  isSaved: boolean;
  /** Rising flag from the trend projection. */
  isRising?: boolean;
}

export interface FeedHeroMetric {
  kind: "reads" | "replies" | "shares";
  value: number;
}

export interface FeedHeroSlide {
  id: string;
  href: string;
  type: FeedPostType | null;
  /** Short label above the title (e.g. "Community top"). */
  eyebrow: string;
  title: string;
  summary: string | null;
  imageUrl: string | null;
  ctaLabel: string;
  /** Only metrics that exist are passed — never zero-filled. */
  metrics: FeedHeroMetric[];
}

export interface FeedNavItem {
  /** "home" or a post type. */
  key: string;
  label: string;
  href: string;
}

export interface FeedVibingItem {
  id: string;
  href: string;
  /** e.g. "Trending in Debate". */
  contextLabel: string;
  title: string;
  engagedCount: number;
}

export type FeedPodiumWindow = "h24" | "d7" | "m1";

export interface FeedPodiumEntry {
  rank: number;
  person: FeedPerson;
  href: string | null;
  points: number;
}
