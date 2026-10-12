/**
 * FEED-U3 — feed-page side of the shell: the mobile sorter sticks under the
 * top island with a scroll-edge fade (Bible §3.2 rule 4), and the rail pill
 * is the Start sheet's shared-element origin (§9.3).
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/feed", useRouter: () => ({ push: () => {} }) }));

import { FeedPageView } from "../feed-page-view";
import { FeedLeftNav } from "../feed-left-nav";

const props = {
  heroSlides: [],
  nav: { items: [{ key: "home", label: "All", href: "/feed" }], activeKey: "home" },
  sort: "hot" as const,
  onSortChange: () => {},
  listState: "empty" as const,
  cards: [],
  vibing: [],
  podium: { windowLabel: "this week", entries: [], leaderboardHref: "/leaderboard" },
};

describe("mobile sorter (§8: sticky under the top island)", () => {
  it("sticks under the island on phones with a scroll-edge fade, static on lg", () => {
    render(<FeedPageView {...props} />);
    const dock = screen.getByTestId("sorter-dock");
    expect(dock).toHaveClass("sticky", "top-16", "lg:static");
    expect(dock.querySelector(".scroll-edge-fade")).not.toBeNull();
  });
});

describe("rail Start Discussion pill", () => {
  it("is the shared-element origin of the Start sheet", () => {
    render(<FeedLeftNav items={props.nav.items} activeKey="home" onStartDiscussion={() => {}} />);
    expect(screen.getByRole("button", { name: "Start Discussion" })).toHaveAttribute("data-start-origin", "rail");
  });
});
