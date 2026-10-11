/**
 * FEED-B1 #3 — useFeedMotion() must hydrate cleanly for reduced-motion
 * users: the server renders full motion (it cannot know the OS setting),
 * hydration must match that, and only then switch to crossfades.
 */
import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useFeedMotion } from "../motion";

function Probe() {
  const m = useFeedMotion();
  return <span data-testid="probe">{Object.keys(m.focusPull.hidden as object).join(",")}</span>;
}

function stubReducedMotion(matches: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("reduce") ? matches : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  }));
}

afterEach(() => vi.unstubAllGlobals());

describe("useFeedMotion hydration", () => {
  it("hydrates without mismatch, then applies reduced motion", async () => {
    stubReducedMotion(false); // the server never knows the OS setting
    const container = document.createElement("div");
    container.innerHTML = renderToString(<Probe />);
    expect(container.textContent).toBe("opacity,filter,scale,y");

    stubReducedMotion(true); // the reduced-motion user's browser
    const errors: unknown[] = [];
    await act(async () => {
      hydrateRoot(container, <Probe />, { onRecoverableError: (e) => errors.push(e) });
    });
    expect(errors).toEqual([]);
    expect(container.textContent).toBe("opacity");
  });
});
