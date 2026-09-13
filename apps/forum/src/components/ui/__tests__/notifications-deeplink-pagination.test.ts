import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* CODE-REVIEW fix tests — notification deep-links + list pagination.
 * (a) the bell's /discussions deep-link needs a real postSlug on the row
 *     (server-resolved: postSeoMeta slug preferred, raw posts._id
 *     fallback — posts/detail's B2 cutover resolver tolerates both);
 * (b) notifications.list must honor its cursor (keyset on by_user_unread)
 *     and return an uncapped unreadCount;
 * (c) the /notifications page consumes the cursor (Load-more). */

const convexRoot = join(__dirname, "../../../../../../convex");
const forumRoot = join(__dirname, "../../../..");
const read = (root: string, rel: string) => readFileSync(join(root, rel), "utf8");

const readsSrc = read(convexRoot, "notifications/reads.ts");
const topNavSrc = read(forumRoot, "src/components/layout/top-nav.tsx");
const pageSrc = read(forumRoot, "src/app/(app)/(shell)/notifications/notifications-page-client.tsx");

/* parseCursor is a pure helper — imported, not source-asserted. */
import { parseCursor } from "../../../../../../convex/notifications/reads";

describe("notifications.list cursor walk (CAP-568 pagination)", () => {
  it("parses the `<createdAtMs>:<notificationId>` boundary; junk and the dead pre-fix format are first-page", () => {
    expect(parseCursor("1757800000000:k57abc123")).toEqual({ createdAt: 1757800000000, id: "k57abc123" });
    expect(parseCursor(undefined)).toBeNull();
    expect(parseCursor("")).toBeNull();
    expect(parseCursor("n:1757800000000")).toBeNull(); // pre-fix format never produced a working walk
    expect(parseCursor("not-a-cursor")).toBeNull();
    expect(parseCursor("NaN:k57abc123")).toBeNull();
    expect(parseCursor("1757800000000:")).toBeNull();
  });

  it("the query READS its cursor arg and ranges the index below the boundary", () => {
    const body = readsSrc.split("export const list")[1];
    expect(body).toContain("parseCursor(args.cursor)");
    expect(body).toContain('lt("createdAt", boundary.createdAt)');
    // same-ms tie-break filters the (tiny) boundary-ms group on _id
    expect(body).toContain('.eq("createdAt", boundary.createdAt)');
    expect(body).toContain('q.lt(q.field("_id"), boundary.id)');
    // cursor advances to the last SERVED row, not a recomputed guess
    expect(body).toContain("`${last.createdAt}:${last._id}`");
    expect(body).not.toContain("rows.length + read.length > numItems"); // the old hasMore guess
  });

  it("unreadCount is a full count over the unread index — never capped by page size", () => {
    const body = readsSrc.split("export const list")[1];
    expect(body).toContain("unreadCount: unreadAll.length");
    expect(body).not.toContain("unreadCount: rows.length"); // the old numItems+1 cap
  });

  it("still recipient-private + newest-first (the CAP-568 invariants)", () => {
    const body = readsSrc.split("export const list")[1];
    expect(body).toContain('q.eq("recipientUserId", userId)');
    expect(body).toContain("b.createdAt - a.createdAt");
    expect(body).not.toContain("activityLedger");
  });
});

describe("notification deep-links (postSlug)", () => {
  it("reads.list resolves a thread ref per row: comment → host post, postSeoMeta slug preferred, raw id fallback", () => {
    const body = readsSrc.split("export const list")[1];
    expect(body).toContain('objectType === "post"');
    expect(body).toContain('objectType === "comment"');
    expect(body).toContain('withIndex("by_postId"'); // canonical slug lookup
    expect(body).toContain("postSlug: await threadRef(");
  });

  it("top-nav maps the server row's postSlug into the bell row (the link is no longer dead)", () => {
    expect(topNavSrc).toContain("postSlug: n.postSlug ?? undefined");
    // the deep-link target — [slug] tolerates postSeoMeta slugs and raw post ids
    expect(topNavSrc).toContain("`/discussions/${notification.postSlug}`");
  });
});

describe("/notifications page — cursor consumption (load-more)", () => {
  it("base query + appended continuation pages advance the list cursor", () => {
    expect(pageSrc).toContain("api.notifications.reads.list");
    expect(pageSrc).toContain("cursor: effectiveCursor ?? undefined");
    expect(pageSrc).toContain("Load more");
    const items = pageSrc.split("const items = [")[1].split("];")[0];
    expect(items).toContain("extraPages.flatMap");
  });
});
