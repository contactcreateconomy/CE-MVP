/* eslint-disable @typescript-eslint/no-explicit-any -- Convex-edge mocks + source assertions */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

/* Code-review regression tests for the /feed read path + thread comment
 * accumulation. Four confirmed defects:
 *   1. organic feed truncated the scan BEFORE the type gates (underfilled
 *      type-filtered pages + early-ending pagination),
 *   2. subscription re-pushes re-appended the accumulated page (duplicate
 *      cards/comments once a cursor was set),
 *   3. /feed?category= was never wired to the type filter,
 *   4. the organic walk read each post twice (gate read + card read). */

const convexRoot = join(__dirname, "../../../../../../convex");
const feedSrc = readFileSync(join(convexRoot, "feed.ts"), "utf8");
const pageSrc = readFileSync(join(__dirname, "../../../app/(app)/(shell)/feed/page.tsx"), "utf8");
const clientSrc = readFileSync(join(__dirname, "../../feed/canonical-feed-client.tsx"), "utf8");
const threadSrc = readFileSync(join(__dirname, "../../discussion/canonical-thread.tsx"), "utf8");

/* ---- render-mock boundary (convex/react + the two client-only deps) ---- */

const mocks = vi.hoisted(() => ({
  chrome: undefined as any,
  list: undefined as any,
  thread: undefined as any,
  listArgs: [] as any[],
}));

vi.mock("convex/react", () => ({
  useQuery: (_api: any, args: any) => {
    if (args === "skip") return undefined;
    if (args && typeof args === "object" && "sortMode" in args) {
      // both feed.list and comments.reads.list carry sortMode
      mocks.listArgs.push(args);
      return mocks.list;
    }
    if (args && typeof args === "object" && "postId" in args) return mocks.thread;
    return mocks.chrome;
  },
  useMutation: () => vi.fn(),
}));
vi.mock("@cemvp/convex-client", () => ({ isConvexConfigured: () => true }));
vi.mock("@cemvp/auth-ui", () => ({ useAuth: () => ({ authStatus: "unauthenticated" }) }));

import { CanonicalFeedClient } from "@/components/feed/canonical-feed-client";
import { CanonicalThread } from "@/components/discussion/canonical-thread";

afterEach(cleanup);

/* ---- 1 + 4: convex/feed.ts organic walk (source assertions) ---- */

describe("review fix — feed pre-filter truncation + double read (convex/feed.ts)", () => {
  it("the organic walk no longer truncates the scan before the gates (no take(PAGE + 10))", () => {
    expect(feedSrc).not.toContain("take(PAGE + 10)");
    // gates run INSIDE the walk, on fetched posts, before the page is minted
    expect(feedSrc).toContain("if (args.typeFilter && post.type !== args.typeFilter) continue;");
  });

  it("each lap reads strictly below the boundary in the index range (CAP-198 snapshot walk)", () => {
    expect(feedSrc).toMatch(/q\.lt\(keyField, boundary\)/);
    // cursor mints only on a FULL page of matching cards
    expect(feedSrc).toContain("nextCursor = row[keyField]");
  });

  it("a scan-cap short page keeps a live cursor — pagination never reports a false 'done'", () => {
    expect(feedSrc).toContain("SCAN_CAP");
    expect(feedSrc).toContain("nextCursor = boundary");
  });

  it("the gated post read is reused for card assembly — no second fetch", () => {
    expect(feedSrc).toContain("const card = await assembleCard(ctx, row, post);");
    expect(feedSrc).toContain("fetchedPost ?? (await ctx.db.get(score.postId))");
  });
});

/* ---- 3: /feed?category= wiring ---- */

describe("review fix — /feed?category= wired to the type filter", () => {
  it("the page reads the category param and passes it as the initial type filter", () => {
    expect(pageSrc).toContain("searchParams");
    expect(pageSrc).toContain("initialTypeFilter");
    // the client taxonomy's legacy "qa" key maps to the canonical "help" literal
    expect(pageSrc).toContain("CATEGORY_KEY_TO_POST_TYPE");
    expect(pageSrc).toContain('qa: "help"');
  });

  it("the client seeds its type-filter state from the prop and resets the walk when it changes", () => {
    expect(clientSrc).toContain("useState<string | null>(initialTypeFilter)");
    expect(clientSrc).toMatch(/setTypeFilter\(initialTypeFilter\)/);
  });

  it("the initial filter reaches feed.list as typeFilter (render)", () => {
    mocks.chrome = { hero: [], vibing: [], featured: [], podium: { forming: true }, typeNav: [] };
    mocks.list = { page: [], cursor: null };
    mocks.listArgs.length = 0;
    render(<CanonicalFeedClient initialTypeFilter="help" />);
    expect(mocks.listArgs.at(-1)?.typeFilter).toBe("help");
  });
});

/* ---- 2: push-safe page accumulation (both components, render) ---- */

const feedCard = (n: number) => ({
  postId: `p${n}`,
  type: "spark",
  title: `Post ${n}`,
  authorName: "Member",
  publishedAt: 0,
  oneLiner: "one-liner",
  discussingCount: 0,
  engagement: { valuable: 0, replies: 0, saves: 0, reads: 0 },
  rising: false,
});

const threadComment = (n: number) => ({
  id: `c${n}`,
  depth: 0,
  authorName: "Member",
  aiBadged: false,
  body: `Comment ${n}`,
  tombstone: false,
  authorIntent: null,
  editedAt: null,
  createdAt: 0,
  counts: { valuable: 0, replies: 0, saves: 0 },
  viewer: null,
});

describe("review fix — duplicate cards on subscription push (CanonicalFeedClient)", () => {
  beforeEach(() => {
    mocks.chrome = { hero: [], vibing: [], featured: [], podium: { forming: true }, typeNav: [] };
    mocks.listArgs.length = 0;
  });

  it("a re-push of the current page replaces the tail instead of re-appending it", () => {
    mocks.list = { page: [feedCard(1), feedCard(2)], cursor: 5 };
    const { rerender } = render(<CanonicalFeedClient />);
    expect(screen.getAllByText("Post 1")).toHaveLength(1);
    expect(screen.getAllByText("Post 2")).toHaveLength(1);

    // Load more → cursor walk appends the next page exactly once
    mocks.list = { page: [feedCard(3), feedCard(4)], cursor: null };
    fireEvent.click(screen.getByText("Load more"));
    expect(screen.getAllByText("Post 3")).toHaveLength(1);
    expect(screen.getAllByText("Post 4")).toHaveLength(1);

    // Reactive subscription re-push (fresh result identity, same page data)
    // must NOT re-append the accumulated page.
    mocks.list = { page: [feedCard(3), feedCard(4)], cursor: null };
    rerender(<CanonicalFeedClient />);
    expect(screen.queryAllByText("Post 1")).toHaveLength(1);
    expect(screen.queryAllByText("Post 2")).toHaveLength(1);
    expect(screen.queryAllByText("Post 3")).toHaveLength(1);
    expect(screen.queryAllByText("Post 4")).toHaveLength(1);
  });

  it("appends are deduped by postId even if a page overlaps the walk", () => {
    mocks.list = { page: [feedCard(1)], cursor: 5 };
    const { rerender } = render(<CanonicalFeedClient />);
    mocks.list = { page: [feedCard(1), feedCard(2)], cursor: null }; // p1 re-served on page 2
    fireEvent.click(screen.getByText("Load more"));
    rerender(<CanonicalFeedClient />);
    expect(screen.queryAllByText("Post 1")).toHaveLength(1);
    expect(screen.getAllByText("Post 2")).toHaveLength(1);
  });
});

describe("review fix — duplicate comments on subscription push (CanonicalThread)", () => {
  beforeEach(() => {
    mocks.thread = {
      stats: { humanCommentCount: 0, personaCommentCount: 0 },
      allowedSortModes: ["best"],
      help: null,
    };
    mocks.listArgs.length = 0;
  });

  it("a re-push of the current page replaces the tail instead of re-appending it", () => {
    mocks.list = { page: [threadComment(1), threadComment(2)], cursor: "cur1" };
    const { rerender } = render(<CanonicalThread postId="p1" archived={false} />);
    expect(screen.getAllByText("Comment 1")).toHaveLength(1);
    expect(screen.getAllByText("Comment 2")).toHaveLength(1);

    mocks.list = { page: [threadComment(3), threadComment(4)], cursor: null };
    fireEvent.click(screen.getByText("Load more"));
    expect(screen.getAllByText("Comment 3")).toHaveLength(1);
    expect(screen.getAllByText("Comment 4")).toHaveLength(1);

    mocks.list = { page: [threadComment(3), threadComment(4)], cursor: null };
    rerender(<CanonicalThread postId="p1" archived={false} />);
    expect(screen.queryAllByText("Comment 1")).toHaveLength(1);
    expect(screen.queryAllByText("Comment 2")).toHaveLength(1);
    expect(screen.queryAllByText("Comment 3")).toHaveLength(1);
    expect(screen.queryAllByText("Comment 4")).toHaveLength(1);
  });
});

/* structural guardrails for both accumulation effects */
describe("review fix — accumulation effect structure (source)", () => {
  it("both effects key off page result AND cursor (a cursor change is a new fetch, not a re-push)", () => {
    expect(clientSrc).toContain("}, [page, cursor]);");
    expect(threadSrc).toContain("}, [listPage, cursor]);");
  });

  it("the unconditional append that duplicated on re-push is gone from both components", () => {
    expect(clientSrc).not.toContain("[...prev, page.page]");
    expect(threadSrc).not.toContain("[...prev, listPage.page]");
    // replace-tail + dedupe-by-id are the two merge modes
    expect(clientSrc).toContain("prev.slice(0, -1)");
    expect(clientSrc).toContain("new Set(prev.flat().map((c: any) => c.postId))");
    expect(threadSrc).toContain("prev.slice(0, -1)");
    expect(threadSrc).toContain("new Set(prev.flat().map((c) => c.id))");
  });
});
