/** FEED-U1 — the canonical card (FEED-DESIGN §10, L-29/L-37/L-62–L-65, L-38). */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { FeedCardData, FeedFacet } from "../feed-display-types";
import { FeedCard } from "../feed-card";

const base: FeedCardData = {
  id: "p1",
  href: "/discussions/p1",
  type: "review",
  typeLabel: "Review",
  topicLabel: "Agents",
  title: "Cursor after six months",
  author: { name: "Rachel Moore", handle: "rachel", avatarUrl: null, levelLabel: "Nova" },
  timeLabel: "2h",
  coverImageUrl: null,
  facet: null,
  whyCare: null,
  gravity: 18,
  strings: 24,
  discussing: 24,
  participants: [],
  viewer: {},
};
const card = (over: Partial<FeedCardData> = {}) => ({ ...base, ...over });

describe("FeedCard footer (L-62, L-64, L-65)", () => {
  it("shows Gravity as a unit and strings", () => {
    render(<FeedCard card={card()} />);
    expect(screen.getByText("18G")).toBeTruthy();
    expect(screen.getByText("24 strings")).toBeTruthy();
    expect(document.querySelector("[data-discussing]")?.textContent).toBe("24 discussing");
  });
  it("no Gravity number at 0; empty strings invite", () => {
    render(<FeedCard card={card({ gravity: 0, strings: 0, discussing: 0 })} />);
    expect(screen.queryByText(/\dG$/)).toBeNull();
    expect(screen.getByText("No strings attached · start one")).toBeTruthy();
    expect(document.querySelector("[data-discussing]")).toBeNull();
  });
});

describe("G-switch (L-63)", () => {
  it("off at rest; tap = appreciate", () => {
    const onAppreciate = vi.fn();
    render(<FeedCard card={card()} onAppreciate={onAppreciate} />);
    const g = screen.getByRole("button", { name: /add gravity/i });
    expect(g.getAttribute("aria-pressed")).toBe("false");
    expect(g.getAttribute("data-on")).toBe("false");
    fireEvent.click(g);
    expect(onAppreciate).toHaveBeenCalledOnce();
  });
  it("on after any interaction; names why", () => {
    render(<FeedCard card={card({ viewer: { appreciated: true, saved: true } })} onAppreciate={() => {}} />);
    const g = screen.getByRole("button", { name: /you appreciated and saved this/i });
    expect(g.getAttribute("data-on")).toBe("true");
    expect(g.getAttribute("aria-pressed")).toBe("true");
  });
  it("a save alone slides the switch on, but is not an appreciation", () => {
    render(<FeedCard card={card({ viewer: { saved: true } })} onAppreciate={() => {}} />);
    const g = screen.getByRole("button", { name: /you saved this/i });
    expect(g.getAttribute("data-on")).toBe("true");
    expect(g.getAttribute("aria-pressed")).toBe("false");
  });
});

describe("Debate facet (L-29, L-37)", () => {
  const debate = (f: Partial<Extract<FeedFacet, { kind: "debate" }>>) =>
    card({ type: "debate", typeLabel: "Debate", facet: { kind: "debate", votes: 214, ...f } });
  it("before voting: two equal choices, no split anywhere", () => {
    const onVote = vi.fn();
    render(<FeedCard card={debate({ agreePct: null })} onVote={onVote} />);
    const agree = screen.getByRole("button", { name: "Agree" });
    const disagree = screen.getByRole("button", { name: "Disagree" });
    expect(agree.className).toBe(disagree.className);
    expect(screen.queryByText(/%/)).toBeNull();
    fireEvent.click(disagree);
    expect(onVote).toHaveBeenCalledWith("disagree");
  });
  it("after voting: the split appears", () => {
    render(<FeedCard card={debate({ viewerVote: "agree", agreePct: 62 })} onVote={() => {}} />);
    expect(screen.getByText("62%")).toBeTruthy();
    expect(screen.getByText("38%")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Agree" })).toBeNull();
  });
});

describe("identity (§10.1)", () => {
  it("labels editorial and persona authors", () => {
    const { unmount } = render(<FeedCard card={card({ author: { name: "Createconomy", handle: null, avatarUrl: null, isEditorial: true } })} />);
    expect(screen.getAllByText("Createconomy").length).toBeGreaterThan(1);
    unmount();
    render(<FeedCard card={card({ author: { name: "Atlas", handle: "atlas", avatarUrl: null, isPersona: true } })} />);
    expect(screen.getByText("AI persona")).toBeTruthy();
  });
  it("kind chip = type · topic; pinned + updated markers", () => {
    render(<FeedCard card={card({ pinned: true, updated: true })} />);
    expect(screen.getByText("Review")).toBeTruthy();
    expect(screen.getByText("Agents")).toBeTruthy();
    expect(screen.getByText("Pinned by Createconomy")).toBeTruthy();
    expect(screen.getByText(/Updated/)).toBeTruthy();
  });
});

describe("facets (§10.2)", () => {
  const cases: Array<[FeedFacet, string]> = [
    [{ kind: "review", tool: { name: "Cursor", price: "$20/mo" }, verdict: 4, community: 4.4, pro: "Fast edits", con: "Usage caps" }, "Usage caps"],
    [{ kind: "compare", tools: [{ name: "Descript", community: 4.3 }, { name: "Riverside" }], row: { label: "Offline mode", values: ["Yes", "No"] } }, "Offline mode:"],
    [{ kind: "help", problem: "Double-firing", resolvedBy: "maya" }, "Resolved ✓ by @maya"],
    [{ kind: "help", problem: "Seats" }, "Open"],
    [{ kind: "list", items: [{ label: "Framer", votes: 128 }], more: 12 }, "more"],
    [{ kind: "showcase", thing: "Onboarding pipeline", linkApproved: true }, "Project link"],
    [{ kind: "news", claim: "Chapter search for all", domain: "theverge.com" }, "theverge.com"],
    [{ kind: "meta", parts: ["Remote", "Contract"] }, "Contract"],
  ];
  it.each(cases)("%o renders", (facet, text) => {
    render(<FeedCard card={card({ facet })} />);
    expect(screen.getByText(text, { exact: false })).toBeTruthy();
  });
});

describe("no glow at rest (L-38)", () => {
  it("nothing on the card carries an unconditioned glow class", () => {
    const { container } = render(<FeedCard card={card({ viewer: { appreciated: true } })} onAppreciate={() => {}} />);
    const resting = Array.from(container.querySelectorAll("*"))
      .flatMap((el) => (el.getAttribute("class") ?? "").split(/\s+/))
      .filter((c) => /(^|:)glow-|shadow-glow/.test(c) && !/^(hover|active|focus-visible|group-hover)[:/]/.test(c));
    expect(resting).toEqual([]);
  });
});
