/** FEED-U2 — adapter: feed.list / getChrome payload → display props (D-012: no source → nothing). */
import { describe, expect, it } from "vitest";

import { relativeTime, toCardData, toHeroSlides, toNavItems, toPodium, toVibingItems } from "../feed-adapter";

const NOW = Date.UTC(2026, 9, 12, 12, 0, 0);
const labels = (t: string) => ({ review: "Review", debate: "Debate", spark: "Spark" })[t] ?? null;

const rawCard = {
  postId: "p1", slug: "cursor-review-abc", coverImage: "https://cdn.test/c.jpg", type: "review", title: "Cursor after six months",
  authorName: "Rachel Moore", publishedAt: NOW - 2 * 3600_000, oneLiner: "Six months in", runningCommentRef: null,
  discussingCount: 24, avatarUserIds: [], engagement: { valuable: 17.6, replies: 23, saves: 3, reads: 40 }, rising: true,
  author: { name: "Rachel Moore", handle: "rachel", avatarUrl: "https://cdn.test/a.jpg", kind: "user", level: "moon" },
  facet: { kind: "review", tool: { name: "Cursor", price: "$20/mo" }, verdict: 4, community: 4.4, pro: "Fast", con: "Caps" },
  bestComment: { author: "lina", body: "the checklist saved me a week" },
  participants: [{ name: "Lina Park", handle: "lina", avatarUrl: null, kind: "user", level: null }],
  viewer: { saved: true },
};

describe("toCardData", () => {
  it("maps the full payload", () => {
    const c = toCardData(rawCard, labels, NOW);
    expect(c).toMatchObject({
      id: "p1", href: "/discussions/cursor-review-abc", type: "review", typeLabel: "Review", title: "Cursor after six months",
      timeLabel: "2h", coverImageUrl: "https://cdn.test/c.jpg", gravity: null, strings: 23, discussing: 24, viewer: { saved: true },
      author: { name: "Rachel Moore", handle: "rachel", avatarUrl: "https://cdn.test/a.jpg", isPersona: false, isEditorial: false, levelLabel: "Moon" },
      facet: { kind: "review", tool: { name: "Cursor", price: "$20/mo" }, verdict: 4, community: 4.4, pro: "Fast", con: "Caps" },
      whyCare: { kind: "comment", author: "lina", body: "the checklist saved me a week" },
    });
    expect(c.participants).toEqual([{ name: "Lina Park", handle: "lina", avatarUrl: null, isPersona: false, isEditorial: false, levelLabel: null }]);
    expect(c.topicLabel).toBeNull(); // no source yet (L-23)
  });

  it("L-83 — no G count until the Gravity engine (B2a): the valuable-score stand-in renders nothing", () => {
    // rawCard.engagement.valuable = 17.6 — the interim mapping must be gone.
    expect(toCardData(rawCard, labels, NOW).gravity).toBeNull();
  });

  it("an old payload (no additive fields) still renders, with nothing invented", () => {
    const old = { ...rawCard, author: undefined, facet: undefined, bestComment: undefined, participants: undefined, viewer: undefined, coverImage: null, slug: null };
    const c = toCardData(old, labels, NOW);
    expect(c.author).toEqual({ name: "Rachel Moore", handle: null, avatarUrl: null });
    expect(c.facet).toBeNull();
    expect(c.participants).toEqual([]);
    expect(c.viewer).toEqual({});
    expect(c.href).toBeNull();
    expect(c.coverImageUrl).toBeNull();
    // rising without numbers → the bare marker, no invented count
    expect(c.whyCare).toEqual({ kind: "line", rising: true, text: "" });
  });

  it("no comment and not rising → no why line", () => {
    expect(toCardData({ ...rawCard, bestComment: null, rising: false }, labels, NOW).whyCare).toBeNull();
  });

  it("persona / editorial authors are flagged; unknown type falls back to a readable label", () => {
    const c = toCardData({ ...rawCard, type: "launch_pad", author: { name: "Atlas", handle: null, avatarUrl: null, kind: "persona", level: null } }, labels, NOW);
    expect(c.author.isPersona).toBe(true);
    expect(c.typeLabel).toBe("Launch pad");
  });
});

describe("relativeTime", () => {
  it("now / m / h / d / date", () => {
    expect(relativeTime(NOW - 20_000, NOW)).toBe("now");
    expect(relativeTime(NOW - 38 * 60_000, NOW)).toBe("38m");
    expect(relativeTime(NOW - 5 * 3600_000, NOW)).toBe("5h");
    expect(relativeTime(NOW - 3 * 86_400_000, NOW)).toBe("3d");
    expect(relativeTime(Date.UTC(2026, 6, 4), NOW)).toBe("Jul 4");
  });
});

describe("chrome", () => {
  it("hero: slides need a slug; media wins over the cover; labels by disclosure class", () => {
    const slides = toHeroSlides([
      { postId: "p1", slug: "a", title: "A", summary: "S", type: "review", coverImage: "https://c/1", mediaUrl: "https://m/1", ctaLabel: null, isCommunityTop: true, disclosureClass: "community_top" },
      { postId: "p2", slug: "b", title: "B", summary: null, type: "news", coverImage: null, mediaUrl: null, ctaLabel: "Read", isCommunityTop: false, disclosureClass: "editorial" },
      { postId: "p3", slug: null, title: "C", isCommunityTop: false },
    ]);
    expect(slides.map((s) => s.id)).toEqual(["p1", "p2"]);
    expect(slides[0]).toMatchObject({ href: "/discussions/a", eyebrow: "Community top", imageUrl: "https://m/1", summary: "S", type: "review", ctaLabel: "Open discussion" });
    expect(slides[1]).toMatchObject({ eyebrow: "Picked by Createconomy", imageUrl: null, ctaLabel: "Read" });
  });

  it("vibing: only post trends with a title + slug; grounded hook wins", () => {
    const items = toVibingItems(
      [
        { objectType: "post", objectId: "p1", hook: null, humans: 512, title: "AI posts need a label", slug: "ai", postType: "debate" },
        { objectType: "tool", objectId: "t1", hook: null, humans: 9, title: null, slug: null, postType: null },
      ],
      [{ postId: "p1", label: "Featured" }],
      labels,
    );
    expect(items).toEqual([
      { id: "p1", href: "/discussions/ai", contextLabel: "Trending in Debate", title: "AI posts need a label", shortTitle: "AI posts need a label", engagedCount: 512, featured: true },
    ]);
  });

  it("podium: forming → null; entries carry no invented 'what they did'", () => {
    expect(toPodium({ forming: true }).entries).toBeNull();
    const p = toPodium({ forming: false, entries: [{ userId: "u1", rank: 1, points: 412, trend: "up", displayName: "Maya", handle: "maya", avatarUrl: null, level: "star" }] });
    expect(p.entries).toEqual([{ rank: 1, person: { name: "Maya", handle: "maya", avatarUrl: null, levelLabel: "Star" }, href: "/users/maya", did: "" }]);
  });

  it("nav: All first, then active types as /feed?category=", () => {
    expect(toNavItems([{ type: "review", label: "Review" }])).toEqual([
      { key: "home", label: "All", href: "/feed" },
      { key: "review", label: "Review", href: "/feed?category=review" },
    ]);
  });
});
