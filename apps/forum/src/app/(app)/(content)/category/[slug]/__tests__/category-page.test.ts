import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/* S00-T04 acceptance (S00-SPEC §11, D-012): /category/[slug] renders the
 * LIVE feed filtered by post type (feed.list typeFilter) — the static
 * "Maya Chen" seed preview is gone. Header label + one-liner come from the
 * label map; unknown slugs 404. */

const here = join(__dirname, "..");
const read = (rel: string) => readFileSync(join(here, rel), "utf8").replace(/\r\n/g, "\n");

const pageSrc = read("page.tsx");
const labelsSrc = read("../../../../../lib/labels.ts");
const feedSrc = read("../../../../../components/feed/canonical-feed-client.tsx");

describe("S00-T04 — /category/[slug] is the live filtered feed", () => {
  it("the slug is passed to CanonicalFeedClient as the feed.list typeFilter", () => {
    expect(pageSrc).toContain("CanonicalFeedClient");
    expect(pageSrc).toContain("initialTypeFilter={slug}");
  });

  it("unknown slugs 404 — validation via the label map, not a hand-typed set", () => {
    expect(pageSrc).toContain("notFound()");
    expect(pageSrc).toContain("POST_TYPE_META[slug]");
  });

  it("header renders the label + the Discover one-liner from the label map", () => {
    expect(pageSrc).toContain("{meta.label}");
    expect(pageSrc).toContain("{meta.description}");
    expect(labelsSrc).toContain("Structured tool reviews with community verdicts.");
  });

  it("valid slugs = the ten schema type literals (spark in, qa out, launch_pad underscored)", () => {
    for (const k of ["news", "review", "compare", "help", "spark", "debate", "list", "showcase", "launch_pad", "gigs"]) {
      expect(labelsSrc, k).toMatch(new RegExp(`${k}: \\{ label:`));
    }
    expect(labelsSrc).not.toMatch(/\bqa\b/);
  });

  it("the static preview loader and its seed import are deleted", () => {
    expect(existsSync(join(here, "category-preview-loader.tsx"))).toBe(false);
    expect(pageSrc).not.toContain("_seed");
  });

  it("empty feed → designed Empty with a Write-one CTA to /new-post?type=…", () => {
    expect(feedSrc).toContain("emptyState");
    expect(pageSrc).toContain("Write one");
    expect(pageSrc).toContain("actionHref: `/new-post?type=${slug}`");
  });
});
