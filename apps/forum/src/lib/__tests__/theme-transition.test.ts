/** FEED-B1 #5 — theme switch variants Iris / Horizon behind ?v=a|b (O-04). */
import { afterEach, describe, expect, it, vi } from "vitest";

import { runThemeSwitch, themeSwitchVariant } from "../theme-transition";

/** jsdom has no View Transitions API — each test installs a fake. */
const vt = document as unknown as { startViewTransition?: unknown };

afterEach(() => {
  delete document.documentElement.dataset.themeSwitch;
  vt.startViewTransition = undefined;
});

describe("theme switch variants", () => {
  it("?v=a → iris, ?v=b → horizon, otherwise none", () => {
    expect(themeSwitchVariant("a")).toBe("iris");
    expect(themeSwitchVariant("b")).toBe("horizon");
    expect(themeSwitchVariant(undefined)).toBeNull();
    expect(themeSwitchVariant("c")).toBeNull();
  });

  it("no View Transitions support → applies instantly", () => {
    const apply = vi.fn();
    expect(runThemeSwitch({ apply, variant: "iris", to: "dark" })).toBe("instant");
    expect(apply).toHaveBeenCalledOnce();
  });

  it("variant + support → runs inside a view transition, stamps variant, origin and direction", () => {
    const apply = vi.fn();
    let finish!: () => void;
    vt.startViewTransition = vi.fn((cb: () => void) => {
      cb();
      return { finished: new Promise<void>((r) => (finish = r)) };
    });
    expect(runThemeSwitch({ apply, variant: "iris", to: "light", origin: { x: 10, y: 20 } })).toBe("iris");
    const root = document.documentElement;
    expect(apply).toHaveBeenCalledOnce();
    expect(root.dataset.themeSwitch).toBe("iris");
    expect(root.dataset.themeSwitchTo).toBe("light");
    expect(root.style.getPropertyValue("--theme-switch-x")).toBe("10px");
    expect(root.style.getPropertyValue("--theme-switch-y")).toBe("20px");
    finish();
  });

  it("reduced motion → crossfade only", () => {
    vt.startViewTransition = vi.fn((cb: () => void) => {
      cb();
      return { finished: new Promise<void>(() => {}) };
    });
    expect(runThemeSwitch({ apply: () => {}, variant: "horizon", to: "dark", reducedMotion: true })).toBe("fade");
    expect(document.documentElement.dataset.themeSwitch).toBe("fade");
  });

  it("no variant → instant even when supported", () => {
    vt.startViewTransition = vi.fn();
    expect(runThemeSwitch({ apply: () => {}, variant: null, to: "dark" })).toBe("instant");
    expect(vt.startViewTransition).not.toHaveBeenCalled();
  });
});
