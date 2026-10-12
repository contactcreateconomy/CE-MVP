/**
 * FEED-B1 #4 — logo mark: real (transparent) gaps by geometry, dark-mode gaps
 * ~15% wider (L-42), optional 3-segment reveal. #6 — CanonicalFeedClient
 * no longer renders its own hero grid (FEED-GAP F-2).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CreateconomyLogoMark } from "../createconomy-logo-mark";

describe("CreateconomyLogoMark (L-42)", () => {
  const gapOf = (c: HTMLElement, v: string) => Number(c.querySelector(`[data-logo-gaps="${v}"]`)?.getAttribute("data-gap"));

  it("gaps are real (transparent geometry), never painted in canvas colour", () => {
    const { container } = render(<CreateconomyLogoMark />);
    expect(container.querySelector('[fill="var(--bg-canvas)"]')).toBeNull();
    for (const v of ["light", "dark"]) {
      const g = gapOf(container, v);
      const group = container.querySelector(`[data-logo-gaps="${v}"]`)!;
      // left half-disc ends, and the square starts, half a gap from the centre line x=11
      expect(group.querySelector("path")?.getAttribute("d")).toMatch(new RegExp(`^M${11 - g / 2} `));
      expect(Number(group.querySelector("rect")?.getAttribute("x"))).toBeCloseTo(11 + g / 2, 5);
    }
  });

  it("dark gaps are ~15% wider than light gaps", () => {
    const { container } = render(<CreateconomyLogoMark />);
    expect(gapOf(container, "light")).toBe(2);
    expect(gapOf(container, "dark") / gapOf(container, "light")).toBeCloseTo(1.15, 2);
    expect(container.querySelector('[data-logo-gaps="light"]')?.getAttribute("class")).toContain("dark:hidden");
    expect(container.querySelector('[data-logo-gaps="dark"]')?.getAttribute("class")).toContain("dark:inline");
  });

  it("reveal plays the three segments in order", () => {
    const { container } = render(<CreateconomyLogoMark reveal />);
    const segs = container.querySelectorAll('[data-logo-gaps="light"] .logo-reveal-segment');
    expect(segs.length).toBe(3);
    expect(Array.from(segs).map((s) => (s as SVGElement).style.getPropertyValue("--i"))).toEqual(["0", "1", "2"]);
    const still = render(<CreateconomyLogoMark />).container;
    expect(still.querySelector(".logo-reveal-segment")).toBeNull();
  });
});

describe("CanonicalFeedClient hero (FEED-GAP F-2)", () => {
  const src = readFileSync(join(__dirname, "../../feed/canonical-feed-client.tsx"), "utf8");
  it("does not render its own hero grid or print disclosureClass", () => {
    expect(src).not.toMatch(/chrome\?\.hero/);
    expect(src).not.toMatch(/disclosureClass/);
  });
});
