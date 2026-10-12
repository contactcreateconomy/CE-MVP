/**
 * FEED-B1 fix-3 #5 — /lab/feed hydrates cleanly: next-themes knows the
 * theme only on the client, so the toolbar's theme label must not differ
 * between the server render and hydration.
 */
import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const theme = vi.hoisted(() => ({ resolvedTheme: undefined as string | undefined }));
vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: theme.resolvedTheme, setTheme: () => {} }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => {} }),
  usePathname: () => "/lab/feed",
  useSearchParams: () => new URLSearchParams(),
}));

import { LabFeedClient } from "../feed-lab-client";

vi.stubGlobal("matchMedia", (query: string) => ({
  matches: false,
  media: query,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  onchange: null,
  dispatchEvent: () => false,
}));

const props = { initialState: "ready", showToolbar: true, typeFilter: "home", heroMode: "default" } as const;

describe("LabFeedClient hydration", () => {
  it("server (theme unknown) and client (dark) hydrate without mismatch", async () => {
    theme.resolvedTheme = undefined; // server: next-themes cannot know
    const container = document.createElement("div");
    container.innerHTML = renderToString(<LabFeedClient {...props} />);

    theme.resolvedTheme = "dark"; // browser
    const errors: unknown[] = [];
    await act(async () => {
      hydrateRoot(container, <LabFeedClient {...props} />, { onRecoverableError: (e) => errors.push(e) });
    });
    expect(errors.map(String)).toEqual([]);
    expect(container.textContent).toContain("Dark");
  });
});
