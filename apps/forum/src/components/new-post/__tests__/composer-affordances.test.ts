import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* CODE-REVIEW PASS-2 — composer affordances:
 * 1. R-URL (CAP-087): the editor's autolink affordance accepted URLs the
 *    server ALWAYS rejects; the composer now mirrors the server rule via
 *    the shared pure predicate (convex/lib/urlGuards) — live inline warning
 *    + publish pre-flight, both using the server's verbatim string.
 * 2. coverImage was write-only: the composer now reads it back (restored
 *    draft storageId via media.getStorageUrl; pasted URL directly).
 *
 * The parity block runs the shared predicate against the ACTUAL server gate
 * (posts.checkNoUrls) over a corpus so the mirror cannot drift. */

const convexRoot = join(__dirname, "../../../../../../convex");
const forumRoot = join(__dirname, "../../..");
const composerSrc = readFileSync(join(forumRoot, "components/new-post/new-post-composer.tsx"), "utf8");
const blockSrc = readFileSync(join(forumRoot, "components/new-post/composer-product-block.tsx"), "utf8");
const publicSrc = readFileSync(join(convexRoot, "store/public.ts"), "utf8");

// Real modules (not source text) — posts.checkNoUrls is the enforced gate.
import { checkNoUrls } from "../../../../../../convex/posts";
import { bodyContainsDisallowedUrl, R_URL_BODY_PATTERNS } from "../../../../../../convex/lib/urlGuards";

describe("R-URL mirror (CAP-087) — shared predicate matches the server gate", () => {
  const REJECTED = [
    "Try https://example.com for details",
    "Try http://example.com for details",
    "See www.example.com for details",
    "Check example.com today", // bare domain.tld
    "Visit sub.domain.io for more",
    "reach me at hello@example.com", // email carries a bare domain
    "example (dot) com", // obfuscation
    "example [.] com",
    "example(.)com",
    "example\n(dot)\ncom",
    '<a href="https://x.co">click</a>', // pasted-HTML link mark
  ];
  const ACCEPTED = [
    "Plain prose with no links at all.",
    "Rated 4.5 stars, shipped v1.2 — decimals are not domains",
    "e.g. this and that", // abbreviation dots
    "notion dot com spelled out", // evasion forms are autoGate's, not R-URL's
    "[[product:k57abc123]] [[product:k42def789]]", // CAP-244 structured tokens
    "Pricing: $19/mo, up 12.5% MoM",
  ];

  it("every body the server rejects trips the mirror; every accepted body does not", () => {
    for (const body of REJECTED) {
      expect(bodyContainsDisallowedUrl(body), body).toBe(true);
      expect(() => checkNoUrls(body), body).toThrow("POST_URL_NOT_ALLOWED");
    }
    for (const body of ACCEPTED) {
      expect(bodyContainsDisallowedUrl(body), body).toBe(false);
      expect(() => checkNoUrls(body), body).not.toThrow();
    }
  });

  it("mirrors the five CAP-087 pattern classes (https?://, www., bare domain.tld, two obfuscation forms)", () => {
    expect(R_URL_BODY_PATTERNS).toHaveLength(5);
  });
});

describe("composer — autolink affordance + validation (reject-not-UI-hide)", () => {
  it("autolink is OFF: the editor no longer linkifies URLs the server always rejects", () => {
    expect(composerSrc).toContain("autolink: false");
    expect(composerSrc).not.toContain("autolink: true");
  });

  it("imports the SHARED predicate from convex/lib/urlGuards — no copied rule", () => {
    expect(composerSrc).toMatch(/from "\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/convex\/lib\/urlGuards"/);
    expect(composerSrc).toContain("bodyContainsDisallowedUrl");
  });

  it("live mirror surfaces the server's verbatim rejection string while writing", () => {
    expect(composerSrc).toContain("bodyUrlViolation");
    expect(composerSrc).toContain('role="alert"');
    expect(composerSrc).toContain("POST_URL_NOT_ALLOWED: user posts cannot contain URLs (CAP-087)");
  });

  it("publish pre-flight mirrors the server on the exact body being sent (server gate still authoritative)", () => {
    expect(composerSrc.indexOf("bodyContainsDisallowedUrl(body)")).toBeGreaterThan(0);
    // the server rejection path still surfaces verbatim (unchanged contract)
    expect(composerSrc).toContain("err instanceof Error ? err.message");
  });
});

describe("composer — coverImage read-back (contract OQ5: media ungoverned — minimal, flagged)", () => {
  it("restored-draft storageId resolves through media.getStorageUrl (guarded skip)", () => {
    expect(composerSrc).toContain("api.media.getStorageUrl");
    expect(composerSrc).toContain("isConvexConfigured()");
  });

  it("renders an honest preview with a remove affordance — never write-only", () => {
    expect(composerSrc).toContain('alt="Cover image preview"');
    expect(composerSrc).toContain('aria-label="Remove image"');
  });
});

describe("composer picker — pagination client", () => {
  it("accumulates cursor pages and offers Show more; the ≤5 cap stays TAGS PER POST", () => {
    expect(blockSrc).toContain("nextCursor");
    expect(blockSrc).toContain("Show more");
    expect(blockSrc).toContain("selected.length >= 5");
    expect(publicSrc).not.toContain(".take(5)");
  });
});
