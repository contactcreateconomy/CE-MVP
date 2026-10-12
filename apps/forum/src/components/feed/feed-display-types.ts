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
  | "launch_pad"
  | "gigs"
  | (string & {});

export type FeedSort = "top" | "hot" | "new" | "fav";

export interface FeedPerson {
  name: string;
  /** Without the "@". null → the handle line is not rendered. */
  handle: string | null;
  /** null → initials fallback (CR-003). */
  avatarUrl: string | null;
  /** AI persona — always shown with the "AI persona" label (L-36, AI disclosure). */
  isPersona?: boolean;
  /** Createconomy editorial identity — logo mark + "Createconomy" label (§10.1). */
  isEditorial?: boolean;
  /** Level name (M12), e.g. "Nova". null → no Level mark. */
  levelLabel?: string | null;
}

/** What the viewer has already done with this post — drives the G-switch
 *  (L-63: on once the viewer added Gravity in any way). Guests: {}. */
export interface FeedViewerInteractions {
  appreciated?: boolean;
  saved?: boolean;
  commented?: boolean;
  shared?: boolean;
}

/** Per-type facet (FEED-DESIGN §10.2). Every field renders only when present;
 *  display never invents a number (D-012). */
export type FeedFacet =
  | {
      kind: "review";
      /** null → no tool chip (the review row has no resolvable tool). */
      tool: { name: string; price?: string | null } | null;
      /** Author's verdict, 1–5. */
      verdict?: number | null;
      /** Community ★ (M5), shown beside the author's. */
      community?: number | null;
      pro?: string | null;
      con?: string | null;
    }
  | {
      kind: "compare";
      tools: Array<{ name: string; community?: number | null }>;
      /** The most-different grid row. */
      row?: { label: string; values: string[] } | null;
    }
  | {
      kind: "debate";
      votes: number;
      /** The viewer's vote; null → equal-weight Agree / Disagree (L-37). */
      viewerVote?: "agree" | "disagree" | null;
      /** Agree share 0–100 — only passed AFTER the viewer voted (L-29, no herding). */
      agreePct?: number | null;
    }
  | {
      kind: "help";
      problem?: string | null;
      /** Resolved without a named answerer still reads "Resolved ✓". */
      resolved?: boolean;
      resolvedBy?: string | null;
    }
  | { kind: "list"; items: Array<{ label: string; votes: number }>; more?: number }
  | { kind: "showcase"; thing?: string | null; linkApproved?: boolean }
  | { kind: "news"; claim?: string | null; domain?: string | null }
  /** Generic meta line (gigs / launch pad: role · employment · location). */
  | { kind: "meta"; parts: string[] };

/** The one fixed-height "why care now" line (§10.3; relationship beats life
 *  stage). The wiring composes it from projections; display only renders. */
export type FeedWhyCare =
  | { kind: "line"; text: string; rising?: boolean; detail?: string | null }
  | { kind: "comment"; author: string; body: string };

export interface FeedCardData {
  id: string;
  /** null → the title is not a link (post has no canonical slug yet). */
  href: string | null;
  type: FeedPostType;
  /** From the label map (postTypeConfig.label) — never the raw enum. */
  typeLabel: string;
  /** Main topic (L-23); null → kind chip shows the type only. */
  topicLabel?: string | null;
  title: string;
  author: FeedPerson;
  /** Relative time, already formatted ("2h"). */
  timeLabel: string;
  /** Revised after reactions (L-35). */
  updated?: boolean;
  /** Label-pinned by Createconomy (manual gate, never ranked by hand). */
  pinned?: boolean;
  /** null → text-only layout. */
  coverImageUrl: string | null;
  facet?: FeedFacet | null;
  whyCare?: FeedWhyCare | null;
  /** Public Gravity (L-59/L-64). null until the Gravity engine (L-83), 0 → no
   *  number shown; the adapter always sends null for now (lab fixtures may
   *  still pass a number to demo the display). */
  gravity: number | null;
  /** Strings = comments (L-65). */
  strings: number;
  /** Distinct humans in the discussion. Not shown on the card (L-82: faces
   *  only); kept for the wiring / author flux. */
  discussing: number;
  /** Up to 3 faces of people discussing. */
  participants: FeedPerson[];
  viewer: FeedViewerInteractions;
}

export interface FeedHeroMetric {
  kind: "reads" | "replies" | "shares";
  value: number;
}

export interface FeedHeroSlide {
  id: string;
  href: string;
  type: FeedPostType | null;
  /** Short label above the title — always present (§9.2): "Community top"
   *  (earned) · "Picked by Createconomy" (editorial) · "Featured" (promoted). */
  eyebrow: string;
  /** Promoted frame: max 1, bordered + labelled (L-30). */
  featured?: boolean;
  title: string;
  summary: string | null;
  imageUrl: string | null;
  ctaLabel: string;
  /** Only metrics that exist are passed — never zero-filled. */
  metrics: FeedHeroMetric[];
}

export interface FeedNavItem {
  /** "home", a post type, or a topic slug. */
  key: string;
  label: string;
  href: string;
  /** New since the viewer's last visit (§9.6). 0 / null → no count shown. */
  count?: number | null;
}

export interface FeedVibingItem {
  id: string;
  href: string;
  /** e.g. "Trending in Debate". */
  contextLabel: string;
  /** The hook, grounded in real numbers, ≤3 lines (§9.5). */
  title: string;
  /** Short form for the mobile ticker; falls back to the title. */
  shortTitle?: string | null;
  engagedCount: number;
  /** Promoted (max 1, always labelled, L-30). */
  featured?: boolean;
}

export type FeedPodiumWindow = "h24" | "d7" | "m1";

export interface FeedPodiumEntry {
  rank: number;
  person: FeedPerson;
  href: string | null;
  /** What they did, in plain words ("38 answers drew Gravity") — never opaque
   *  points (R-10). From the recognition projection. */
  did: string;
}

export interface FeedPodiumDimension {
  key: string;
  /** e.g. "Top helpers" (registry label, L-32). */
  label: string;
}
