import { describe, it, expect } from "vitest";
import { slugFromTitle } from "../../convex/lib/distributionScores";

describe("slugFromTitle (CAP-051 member/editorial shape)", () => {
  it("lowercases, strips punctuation, and appends the last 6 of the post id", () => {
    expect(slugFromTitle("Demo: Why Claude Code changed my week", "k57abc123xyz")).toBe(
      "demo-why-claude-code-changed-my-week-123xyz",
    );
  });

  it("falls back to post- when the title is empty", () => {
    expect(slugFromTitle("", "abcdefghij")).toBe("post-efghij");
  });
});
