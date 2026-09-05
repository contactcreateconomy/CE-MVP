import { describe, it, expect } from "vitest";
import { getCategoryTemplate } from "../registry";
import { ACTIVE_CATEGORY_KEYS, MEMBER_COMPOSABLE_CATEGORY_KEYS } from "@/types/category";

describe("Category Registry", () => {
  it("returns a template for every valid category key", () => {
    const keys = [
      "news",
      "review",
      "compare",
      "launch-pad",
      "debate",
      "help", // legacy key — resolves to the qa template
      "qa",
      "spark",
      "list",
      "showcase",
      "gigs",
    ];
    keys.forEach((key) => {
      const template = getCategoryTemplate(key);
      expect(template).not.toBeNull();
      expect(template?.key).toBe(key === "help" ? "qa" : key);
      expect(template?.Body).toBeDefined();
    });
  });

  it("exposes exactly the 8 active post types (spec taxonomy)", () => {
    expect([...ACTIVE_CATEGORY_KEYS].sort()).toEqual(
      ["compare", "debate", "list", "news", "qa", "review", "showcase", "spark"].sort(),
    );
  });

  it("member-composable types exclude news (platform-injected) and DAU-locked launch-pad/gigs", () => {
    expect(MEMBER_COMPOSABLE_CATEGORY_KEYS).not.toContain("news");
    expect(MEMBER_COMPOSABLE_CATEGORY_KEYS).not.toContain("launch-pad");
    expect(MEMBER_COMPOSABLE_CATEGORY_KEYS).not.toContain("gigs");
  });

  it("no template registers a ComposeForm (typed compose forms archived 2026-08-31)", () => {
    const keys = [
      "news",
      "review",
      "compare",
      "launch-pad",
      "debate",
      "qa",
      "list",
      "showcase",
      "gigs",
    ];
    keys.forEach((key) => {
      expect(getCategoryTemplate(key)?.ComposeForm).toBeUndefined();
    });
  });

  it("returns null for unknown category key", () => {
    expect(getCategoryTemplate("unknown-category")).toBeNull();
  });
});
