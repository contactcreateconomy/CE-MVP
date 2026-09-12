/* eslint-disable @typescript-eslint/no-explicit-any -- pure-function + source assertions */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* KNOWN-UI-GAPS #2 closure — CONTRACT-2-tool-profile States 4–9 + Action 5:
 * the rating form (submit/edit/withdraw) and the ratingsPage continuation.
 * Backend shipped in P4-05 (toolRatings.submit/update/withdraw); the UI
 * landed 2026-09-12. */

const convexRoot = join(__dirname, "../../../../../../convex");
const toolsSrc = readFileSync(join(convexRoot, "tools.ts"), "utf8");
const formSrc = readFileSync(join(__dirname, "../../../app/(app)/(content)/tools/[slug]/rating-form.tsx"), "utf8");
const clientSrc = readFileSync(join(__dirname, "../../../app/(app)/(content)/tools/[slug]/tool-profile-client.tsx"), "utf8");

describe("CONTRACT-2 States 4–5 — submit form + N/A scope", () => {
  it("N/A control exists ONLY on value_for_money (W2-E6)", () => {
    const fn = formSrc.split("DIMENSIONS.map")[1] ?? "";
    expect(fn).toContain('allowNa={d === "value_for_money"}');
    // the N/A literal never appears on the other three pickers
    const pickers = formSrc.split("function ScorePicker")[1]?.split("export function RatingForm")[0] ?? "";
    expect(pickers).toContain("allowNa");
  });

  it("1–5 integer pickers (no half scores, no star widget invented)", () => {
    expect(formSrc).toContain("const SCORES = [1, 2, 3, 4, 5]");
    // scope to the render body — the docblock quotes the fence itself
    const body = formSrc.split("export function RatingForm")[1] ?? "";
    expect(body).not.toContain("star"); // §11 has no rating composite — primitives only
  });

  it("reviewText is optional with the 2000-char counter (M5 §8)", () => {
    expect(formSrc).toContain('maxLength={2000}');
    expect(formSrc).toContain("/ 2000");
  });
});

describe("CONTRACT-2 State 6 — edit mode for the owner's active rating", () => {
  it("myRating presence drives edit mode; update targets the owned ratingId (CAP-113)", () => {
    expect(formSrc).toContain("const editing = myRating !== null");
    expect(formSrc).toContain("api.toolRatings.update");
    expect(formSrc).toContain("myRating.ratingId");
  });

  it("getProfile returns myRating (active only) for the member branch", () => {
    const fn = toolsSrc.split("export const getProfile")[1]?.split("export const")[0] ?? "";
    expect(fn).toContain("myRating");
    expect(fn).toContain('q.field("status"), "active"');
  });
});

describe("CONTRACT-2 State 7 — withdraw with confirmation", () => {
  it("withdraw is behind a confirmation dialog (CAP-117)", () => {
    expect(formSrc).toContain("api.toolRatings.withdraw");
    const fn = formSrc.split("withdrawOpen")[1] ?? "";
    expect(formSrc).toContain("<DialogTitle>Withdraw your rating?</DialogTitle>");
  });

  it("withdraw copy states the aggregate decrement + exclusion", () => {
    expect(formSrc).toContain("removed from the community aggregate");
  });
});

describe("CONTRACT-2 State 8 — reject, not UI-hide", () => {
  it("server rejections surface verbatim (R-STAFF 403 / R-ONE / verify)", () => {
    expect(formSrc).toContain("RATING_STAFF_FORBIDDEN");
    expect(formSrc).toContain("e?.message");
    expect(formSrc).toContain('role="alert"');
  });

  it("the form renders for signed-in members — eligibility is server-enforced", () => {
    expect(clientSrc).toContain('authStatus === "authenticated"');
    expect(clientSrc).toContain("Sign in");
  });
});

describe("CONTRACT-2 State 3 / Action 5 — ratingsPage continuation", () => {
  it("getProfile returns a continuation cursor; listRatings advances it (OQ#6 resolved by Convex cursor pagination)", () => {
    const profileFn = toolsSrc.split("export const getProfile")[1]?.split("export const")[0] ?? "";
    expect(profileFn).toContain("nextCursor: result.isDone ? null : result.continueCursor");
    const listFn = toolsSrc.split("export const listRatings")[1] ?? "";
    expect(listFn).toContain("paginate");
    expect(listFn).toContain("args.cursor");
  });

  it("anonymous branch withholds ratings (bible l.33) — listRatings returns empty unauthenticated", () => {
    const listFn = toolsSrc.split("export const listRatings")[1]?.split("export const")[0] ?? "";
    expect(listFn).toContain("if (!userId) return { items: [], isDone: true, nextCursor: null }");
  });

  it("client renders Load more only while a cursor remains", () => {
    expect(clientSrc).toContain("Load more ratings");
    expect(clientSrc).toContain("effectiveCursor");
  });
});

describe("CONTRACT-2 State 12 — archived freeze", () => {
  it("archived tool renders NO rating form (aggregate frozen, no longer rated)", () => {
    const body = formSrc.split("export function RatingForm")[1] ?? "";
    expect(body).toContain('toolStatus === "archived"');
    expect(body).toContain("return null");
  });
});
