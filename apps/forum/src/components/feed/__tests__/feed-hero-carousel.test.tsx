/** FEED-U1 — hero tease → reveal ends (L-31) and the hero never auto-rotates (R-06). */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { FeedHeroSlide } from "../feed-display-types";
import { FeedHeroCarousel } from "../feed-hero-carousel";

const slide = (id: string): FeedHeroSlide => ({ id, href: "/x", type: "news", eyebrow: "Community top", title: `Title ${id}`, summary: null, imageUrl: null, ctaLabel: "Open discussion", metrics: [] });

beforeEach(() => {
  sessionStorage.clear();
  vi.useFakeTimers();
  // Everything is in view: drive motion's useInView.
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(private cb: IntersectionObserverCallback) {}
      observe(el: Element) {
        this.cb([{ isIntersecting: true, target: el, intersectionRatio: 1 } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
      }
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("FeedHeroCarousel", () => {
  it("tease → reveal finishes (frame 1 sharpens instead of staying blurred)", async () => {
    const { container } = render(<FeedHeroCarousel slides={[slide("a"), slide("b"), slide("c")]} />);
    const hero = () => container.querySelector("section")!.getAttribute("data-hero-state");
    await act(async () => {});
    expect(hero()).toBe("teasing");
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(hero()).toBe("ready");
  });

  it("never auto-rotates", async () => {
    const { container } = render(<FeedHeroCarousel slides={[slide("a"), slide("b"), slide("c")]} />);
    await act(async () => {
      vi.advanceTimersByTime(20_000);
    });
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe("1 / 3");
  });
});
