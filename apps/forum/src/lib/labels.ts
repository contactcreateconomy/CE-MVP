/**
 * Label maps — S00-SPEC §10 (COPY-1, D-011): every enum a user sees maps to
 * human copy; unknown keys hide the element instead of rendering raw. T04
 * ships the post-type map (§11 category headers); T13 extends this file to
 * the remaining domains (notifications, badges, profile fields, …).
 *
 * Values mirror the canonical registry verbatim: labels from postTypeConfig
 * (convex/seed.ts POST_TYPE_CONFIG_ROWS) and one-liners from the Discover
 * copy (convex/categories.ts POST_TYPE_DESCRIPTIONS). launch_pad / gigs are
 * DAU-locked types with no Discover one-liner yet — header renders label
 * only, never an invented description.
 */
export interface PostTypeMeta {
  label: string;
  /** One-line description (Discover copy). Empty for types with no copy. */
  description: string;
}

export const POST_TYPE_META: Record<string, PostTypeMeta> = {
  review: { label: "Review", description: "Structured tool reviews with community verdicts." },
  compare: { label: "Compare", description: "Side-by-side tool comparisons." },
  help: { label: "Help", description: "Questions with accepted answers." },
  spark: { label: "Spark", description: "Short ideas and provocations." },
  debate: { label: "Debate", description: "Position-based discussions." },
  list: { label: "List", description: "Ranked or curated lists." },
  showcase: { label: "Showcase", description: "Project showcases with one outbound URL." },
  news: { label: "News (editorial)", description: "Platform-injected industry news." },
  launch_pad: { label: "Launch Pad", description: "" },
  gigs: { label: "Gigs", description: "" },
};
