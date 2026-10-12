/**
 * FEED-U2 — L-78 (media tokens), L-79 (inline Hidden · Undo), L-80 (Gravity
 * wording), L-81 (crown contrast), L-82 (no "N discussing" label; debate
 * keeps "N voted · take a side").
 */
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { FeedCardData } from "../feed-display-types";
import { FeedCard } from "../feed-card";

const REPO = resolve(__dirname, "../../../../../..");
const read = (p: string) => readFileSync(join(REPO, p), "utf8");
const tokens = read("packages/design-tokens/tokens.css");

function block(css: string, opener: string): string {
  const start = css.indexOf(opener);
  let depth = 0;
  for (let i = css.indexOf("{", start); i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}" && --depth === 0) return css.slice(start, i + 1);
  }
  return "";
}
const token = (scope: string, name: string) => block(tokens, scope).match(new RegExp(`\\n\\s*${name}:\\s*([^;]+);`))?.[1]?.trim();

const card: FeedCardData = {
  id: "p1", href: "/discussions/p1", type: "debate", typeLabel: "Debate", topicLabel: null, title: "AI posts need a label",
  author: { name: "Lina Park", handle: "lina", avatarUrl: null }, timeLabel: "5h", coverImageUrl: null,
  facet: { kind: "debate", votes: 214, viewerVote: null, agreePct: null }, whyCare: null,
  gravity: 41, strings: 88, discussing: 57,
  participants: [{ name: "Dev Patel", handle: "dev", avatarUrl: null }, { name: "Maya Okafor", handle: "maya", avatarUrl: null }],
  viewer: {},
};

describe("L-82 — no 'N discussing' label, faces stay", () => {
  it("renders the faces but never the word 'discussing'", () => {
    const { container } = render(<FeedCard card={card} />);
    expect(container.textContent).not.toMatch(/discussing/i);
    expect(container.querySelectorAll("[data-faces] > *").length).toBe(2);
  });
  it("debate keeps 'N voted · take a side' before the vote, split hidden", () => {
    render(<FeedCard card={card} onVote={() => {}} />);
    expect(screen.getByText(/voted · take a side/)).toBeTruthy();
    expect(screen.queryByText(/%/)).toBeNull();
  });
  it("after the vote: 'N voted' without the invite, split shown", () => {
    render(<FeedCard card={{ ...card, facet: { kind: "debate", votes: 215, viewerVote: "agree", agreePct: 62 } }} onVote={() => {}} />);
    expect(screen.queryByText(/take a side/)).toBeNull();
    expect(screen.getByText("62%")).toBeTruthy();
  });
});

describe("L-79 — inline Hidden · Undo", () => {
  it("a hidden card collapses in place to 'Hidden · Undo'", () => {
    const onUndoHide = vi.fn();
    render(<FeedCard card={card} hidden onUndoHide={onUndoHide} />);
    expect(screen.getByText("Hidden")).toBeTruthy();
    expect(screen.queryByText("AI posts need a label")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(onUndoHide).toHaveBeenCalledOnce();
  });
  it("the page-level undo toast is gone from the feed view", () => {
    expect(read("apps/forum/src/components/feed/feed-page-view.tsx")).not.toMatch(/FeedUndoToast/);
  });
});

describe("L-80 — Gravity wording (no 'valued')", () => {
  it("lab fixtures speak Gravity", () => {
    const f = read("apps/forum/src/app/(app)/lab/feed/fixtures.ts");
    const strings = f.match(/`[^`]*`|"[^"\n]*"/g) ?? [];
    expect(strings.filter((s) => /\bvalued\b|Valuable/i.test(s))).toEqual([]);
    expect(f).toMatch(/\+14G in the last 3h/);
  });
});

describe("L-81 — crowns are visible in light (≥ 3:1 on the surface, WCAG 1.4.11)", () => {
  const hsl = (v: string) => {
    const [h, s, l] = v.match(/hsl\(([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/)!.slice(1).map(Number);
    const k = (n: number) => (n + h / 30) % 12;
    const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
    const f = (n: number) => l / 100 - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [f(0), f(8), f(4)];
  };
  const lum = (c: number[]) => {
    const [r, g, b] = c.map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a: string, b: string) => {
    const [x, y] = [lum(hsl(a)), lum(hsl(b))];
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  for (const rank of ["--rank-gold", "--rank-silver", "--rank-bronze"]) {
    it(`${rank} light ≥ 3:1, dark ≥ 3:1`, () => {
      expect(ratio(token(":root {", rank)!, token(":root {", "--bg-surface")!)).toBeGreaterThanOrEqual(3);
      expect(ratio(token(".dark {", rank)!, token(".dark {", "--bg-surface")!)).toBeGreaterThanOrEqual(3);
    });
  }
});

describe("L-78 — media overlay tokens", () => {
  it("tokens exist in both themes and the hero overlay uses them", () => {
    for (const t of ["--media-scrim", "--text-on-media"]) {
      expect(token(":root {", t), `${t} light`).toBeTruthy();
      expect(token(".dark {", t), `${t} dark`).toBeTruthy();
    }
    const hero = read("apps/forum/src/components/feed/feed-hero-carousel.tsx");
    expect(hero).toMatch(/media-scrim/);
    expect(hero).toMatch(/text-on-media/);
  });
});

describe("L-84 — /feed shows no sorter notes until the real windows exist", () => {
  it("the product container passes no sortNotes; the mechanism stays for the lab", () => {
    const client = read("apps/forum/src/components/feed/canonical-feed-client.tsx");
    expect(client).not.toMatch(/SORT_NOTES/);
    expect(client).not.toMatch(/sortNotes=/);
    // the mechanism is kept: the view still accepts an optional notes prop
    const view = read("apps/forum/src/components/feed/feed-page-view.tsx");
    expect(view).toMatch(/sortNotes\?:/);
  });
});
