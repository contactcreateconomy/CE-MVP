/** FEED-B1 #5 / L-67 — Iris is THE theme switch; Horizon survives only in the lab (?v=b). */
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { runThemeSwitch } from "../theme-transition";

/** jsdom has no View Transitions API — each test installs a fake. */
const vt = document as unknown as { startViewTransition?: unknown };
const REPO = resolve(__dirname, "../../../../..");

afterEach(() => {
  delete document.documentElement.dataset.themeSwitch;
  vt.startViewTransition = undefined;
});

function fakeTransition() {
  vt.startViewTransition = vi.fn((cb: () => void) => {
    cb();
    return { finished: new Promise<void>(() => {}) };
  });
}

describe("theme switch (L-67: Iris)", () => {
  it("no View Transitions support → applies instantly", () => {
    const apply = vi.fn();
    expect(runThemeSwitch({ apply, to: "dark" })).toBe("instant");
    expect(apply).toHaveBeenCalledOnce();
  });

  it("defaults to Iris, stamping origin and direction", () => {
    fakeTransition();
    const apply = vi.fn();
    expect(runThemeSwitch({ apply, to: "light", origin: { x: 10, y: 20 } })).toBe("iris");
    const root = document.documentElement;
    expect(apply).toHaveBeenCalledOnce();
    expect(root.dataset.themeSwitch).toBe("iris");
    expect(root.dataset.themeSwitchTo).toBe("light");
    expect(root.style.getPropertyValue("--theme-switch-x")).toBe("10px");
    expect(root.style.getPropertyValue("--theme-switch-y")).toBe("20px");
  });

  it("reduced motion → crossfade only", () => {
    fakeTransition();
    expect(runThemeSwitch({ apply: () => {}, to: "dark", reducedMotion: true })).toBe("fade");
    expect(document.documentElement.dataset.themeSwitch).toBe("fade");
  });

  it("Horizon is lab-only: not in shared CSS, only in the lab", () => {
    const shared = readFileSync(join(REPO, "packages/design-tokens/utilities.css"), "utf8");
    expect(shared).toMatch(/theme-switch-iris/);
    expect(shared).not.toMatch(/horizon|dusk|dawn/i);
    const lab = readFileSync(join(REPO, "apps/forum/src/app/(app)/lab/foundation/horizon.css"), "utf8");
    expect(lab).toMatch(/data-theme-switch="horizon"/);
  });

  it("the product theme toggle (top nav) uses the switch", () => {
    const nav = readFileSync(join(REPO, "apps/forum/src/components/layout/top-nav.tsx"), "utf8");
    expect(nav).toMatch(/runThemeSwitch\(/);
    expect(nav).not.toMatch(/variant:\s*"horizon"/);
  });
});
