/**
 * FEED-U2 — the shell hands /feed to the canonical feed view: no AppShell
 * hero / sidebars there (FeedPageView owns them), and the autoplay hero is
 * gone everywhere (L-31: the shell hero is feed-hero-carousel, L-43).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const nav = vi.hoisted(() => ({ path: "/feed" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.path, useRouter: () => ({ push: () => {} }), useSearchParams: () => new URLSearchParams() }));
vi.mock("@/components/layout/left-sidebar", () => ({ LeftSidebar: () => <nav data-testid="left" /> }));
vi.mock("@/components/layout/right-sidebar", () => ({ RightSidebar: () => <aside data-testid="right" /> }));
vi.mock("@cemvp/convex-client", () => ({ isConvexConfigured: () => true }));
vi.mock("convex/react", () => ({ useQuery: () => ({ hero: [{ postId: "p1", slug: "a", title: "A", isCommunityTop: true }] }) }));

import { ConditionalLeftSidebar } from "../conditional-left-sidebar";
import { ConditionalRightSidebar } from "../conditional-right-sidebar";
import { TopPostHeroSection } from "../top-post-hero-section";

const dir = join(__dirname, "..");

describe("shell on /feed", () => {
  it("renders no hero and no sidebars on /feed", () => {
    nav.path = "/feed";
    const { container } = render(
      <>
        <TopPostHeroSection />
        <ConditionalLeftSidebar />
        <ConditionalRightSidebar />
      </>,
    );
    expect(container.innerHTML).toBe("");
  });
  it("keeps them on other shell routes; the hero is the canonical carousel", () => {
    nav.path = "/about";
    const { getByTestId, getByLabelText } = render(
      <>
        <TopPostHeroSection />
        <ConditionalLeftSidebar />
        <ConditionalRightSidebar />
      </>,
    );
    expect(getByTestId("left")).toBeTruthy();
    expect(getByTestId("right")).toBeTruthy();
    expect(getByLabelText("Highlights")).toBeTruthy();
  });
  it("the autoplay carousel is gone (L-31) and AppShell uses the conditional left rail", () => {
    expect(existsSync(join(dir, "../feed/top-post-hero-carousel.tsx"))).toBe(false);
    const shell = readFileSync(join(dir, "app-shell.tsx"), "utf8");
    expect(shell).toContain("<ConditionalLeftSidebar />");
    expect(readFileSync(join(dir, "top-post-hero-section.tsx"), "utf8")).toContain("FeedHeroCarousel");
  });
});
