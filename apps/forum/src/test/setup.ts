import "@testing-library/jest-dom/vitest";

// jsdom has no matchMedia; components read prefers-reduced-motion through it
// (lib/motion usePrefersReducedMotion). Default: no preference. Tests that
// need a specific answer stub it themselves (vi.stubGlobal).
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

// jsdom has no IntersectionObserver (motion's useInView in the feed hero).
// Inert stub: nothing is ever "in view" unless a test drives it.
if (typeof window !== "undefined" && typeof window.IntersectionObserver !== "function") {
  class InertIntersectionObserver {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  window.IntersectionObserver = InertIntersectionObserver as unknown as typeof IntersectionObserver;
}
