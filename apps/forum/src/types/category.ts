/**
 * Post-type taxonomy (spec-aligned, 2026-08-31 correction pass).
 *
 * 8 ACTIVE types (member-composable except news — see note): news · review ·
 * compare · help(qa) · spark · debate · list · showcase.
 * launch_pad + gigs are DAU-locked: hidden until the admin ~1000-DAU flip
 * (CAP-104 postTypeConfig.state), NOT point-paywalled.
 * spark is the ≤280-char statement type (CAP-186 feed nav · W3-E2 H-TYPE).
 *
 * Keys retain the repo's legacy "qa" spelling for the help type (the repo
 * migrated help→qa pre-spec); spec's canonical name is "help".
 */

export type CategoryKey =
  | "news"
  | "review"
  | "compare"
  | "qa"
  | "spark"
  | "debate"
  | "list"
  | "showcase"
  | "launch-pad"
  | "gigs";

/** The 8 active post types (excludes DAU-locked launch-pad/gigs). */
export const ACTIVE_CATEGORY_KEYS: readonly CategoryKey[] = [
  "news",
  "review",
  "compare",
  "qa",
  "spark",
  "debate",
  "list",
  "showcase",
] as const;

/** Types hidden until the admin DAU flip (CAP-104); never point-paywalled. */
export const DAU_LOCKED_CATEGORY_KEYS: readonly CategoryKey[] = ["launch-pad", "gigs"] as const;

/**
 * Types a MEMBER may compose (news excluded — platform-injected only via M2,
 * per CAP-086 / W2-E1).
 */
export const MEMBER_COMPOSABLE_CATEGORY_KEYS: readonly CategoryKey[] = [
  "review",
  "compare",
  "qa",
  "spark",
  "debate",
  "list",
  "showcase",
] as const;

export interface Category {
  key: CategoryKey;
  name: string;
  icon: string;
  description: string;
  primaryColor: string;
  /** DAU-locked (admin flip) — legacy point-paywall semantics removed. */
  lockedByDefault: boolean;
  pointsToUnlock?: number;
}
