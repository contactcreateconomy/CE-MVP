import { describe, it, expect } from "vitest";

function viralityScore(
  upvotes: number,
  commentsCount: number,
  views: number,
): number {
  return upvotes * 1.2 + commentsCount * 2 + views * 0.06;
}

describe("Virality Score", () => {
  it("comments weigh more than upvotes per unit", () => {
    const commentScore = viralityScore(0, 10, 0);
    const upvoteScore = viralityScore(10, 0, 0);
    expect(commentScore).toBeGreaterThan(upvoteScore);
  });

  it("returns 0 for all-zero post", () => {
    expect(viralityScore(0, 0, 0)).toBe(0);
  });

  it("upvotes contribute linearly", () => {
    const score1 = viralityScore(1, 0, 0);
    const score5 = viralityScore(5, 0, 0);
    expect(score5).toBeCloseTo(score1 * 5);
  });

  it("views have lowest weight per unit", () => {
    const viewScore = viralityScore(0, 0, 10);
    const upvoteScore = viralityScore(10, 0, 0);
    expect(viewScore).toBeLessThan(upvoteScore);
  });
});
