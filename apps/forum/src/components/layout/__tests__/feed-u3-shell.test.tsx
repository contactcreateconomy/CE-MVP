/**
 * FEED-U3 — the shell (FEED-DESIGN §8, §9.1, §9.3; Bible §3, §9, §13).
 *  1 menu island: frost-strong (L-68), sticky 12px, container width, radius xl,
 *    deeper shadow after 8px scroll; visitor / member; bell unread DOT; search widens
 *  2 mobile: top island 8px inset + full-width frosted tab bar, safe areas,
 *    active = brand + label, press feedback
 *  3 logo 3-segment reveal on first load only
 *  4 Start Discussion → frosted sheet (types from data; visitor → sign-in)
 *  5 scroll-edge fade under the island and the mobile sorter (no hard lines)
 *  6 reduced-motion paths
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  path: "/feed",
  auth: "unauthenticated" as "authenticated" | "unauthenticated" | "loading",
  unread: 0,
  convex: false,
  push: vi.fn(),
  openAuthModal: vi.fn(),
  reduced: false,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => h.path,
  useRouter: () => ({ push: h.push }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next-themes", () => ({ useTheme: () => ({ resolvedTheme: "light", setTheme: () => {} }) }));
vi.mock("@cemvp/convex-client", () => ({ isConvexConfigured: () => h.convex }));
vi.mock("convex/react", () => ({ useQuery: () => ({ page: [] }), useMutation: () => async () => {} }));
vi.mock("@cemvp/auth-ui", () => ({
  useAuth: () => ({
    authStatus: h.auth,
    user: h.auth === "authenticated" ? { name: "Ada Lovelace", handle: "ada" } : null,
    openAuthModal: h.openAuthModal,
    logout: () => {},
  }),
}));
vi.mock("@/providers/shared-data-context", () => ({
  useSharedData: () => ({
    unreadNotificationCount: h.unread,
    categoriesLoading: false,
    categories: [
      { key: "news", name: "News", description: "Industry news.", lockedByDefault: false },
      { key: "review", name: "Review", description: "Structured tool reviews with community verdicts.", lockedByDefault: false },
      { key: "compare", name: "Compare", description: "Side-by-side tool comparisons.", lockedByDefault: false },
      { key: "help", name: "Help", description: "Questions with accepted answers.", lockedByDefault: false },
      { key: "spark", name: "Spark", description: "Short ideas and provocations.", lockedByDefault: false },
      { key: "debate", name: "Debate", description: "Position-based discussions.", lockedByDefault: false },
      { key: "list", name: "List", description: "Ranked or curated lists.", lockedByDefault: false },
      { key: "showcase", name: "Showcase", description: "Project showcases with one outbound URL.", lockedByDefault: false },
      { key: "gigs", name: "Gigs", description: "", lockedByDefault: true },
    ],
  }),
}));
vi.mock("@/lib/motion", async (orig) => {
  const real = await orig<typeof import("@/lib/motion")>();
  return { ...real, usePrefersReducedMotion: () => h.reduced };
});

import { TopNav, resetLogoRevealForTests } from "../top-nav";
import { MobileTabBar } from "../mobile-tab-bar";
import { StartDiscussionHost } from "../start-discussion-host";
import { StartDiscussionSheet } from "@/components/feed/feed-start-sheet";
import { useStartSheet } from "@/stores/start-sheet-store";
import { composerTypeFromParam } from "@/lib/new-post/composer-type-param";

const REPO = resolve(__dirname, "../../../../../..");
const utilities = readFileSync(join(REPO, "packages/design-tokens/utilities.css"), "utf8");
const tokens = readFileSync(join(REPO, "packages/design-tokens/tokens.css"), "utf8");
const topNavSrc = readFileSync(join(__dirname, "../top-nav.tsx"), "utf8");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|css)$/.test(name) && !p.includes("__tests__")) out.push(p);
  }
  return out;
}

beforeEach(() => {
  h.path = "/feed";
  h.auth = "unauthenticated";
  h.unread = 0;
  h.convex = false;
  h.reduced = false;
  h.push.mockReset();
  h.openAuthModal.mockReset();
  resetLogoRevealForTests();
  useStartSheet.setState({ open: false, origin: null });
});
afterEach(() => {
  Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
});

describe("1 · menu island (§9.1, L-68)", () => {
  it("is a frost-strong island: sticky 12px from top (8px on phones), container width, radius xl", () => {
    render(<TopNav />);
    const island = screen.getByTestId("menu-island");
    expect(island).toHaveClass("frost-strong", "rounded-xl", "max-w-250");
    const header = screen.getByRole("banner");
    expect(header).toHaveClass("sticky", "top-2", "lg:top-3");
  });

  it("L-88 — turns solid (bg-surface, no frost) while the Start sheet is open, frost returns on close", () => {
    render(<TopNav />);
    const island = screen.getByTestId("menu-island");
    expect(island).toHaveClass("frost-strong");
    act(() => useStartSheet.getState().show("rail"));
    expect(island).toHaveClass("bg-surface");
    expect(island).not.toHaveClass("frost-strong");
    act(() => useStartSheet.getState().hide());
    expect(island).toHaveClass("frost-strong");
    expect(island).not.toHaveClass("bg-surface");
  });

  it("uses tokens only — no raw rgba / white-alpha / glass in the island", () => {
    expect(topNavSrc).not.toMatch(/rgba\(|bg-white\/|border-white\/|glass-|GlowingEffect/);
  });

  it("deepens its shadow after 8px of scroll (a raised layer, opacity only)", async () => {
    render(<TopNav />);
    const raised = screen.getByTestId("menu-island-raised");
    expect(raised).toHaveAttribute("data-raised", "false");
    expect(raised).toHaveClass("shadow-lg");
    Object.defineProperty(window, "scrollY", { value: 9, configurable: true });
    await act(async () => {
      fireEvent.scroll(window);
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    });
    expect(raised).toHaveAttribute("data-raised", "true");
  });

  it("visitor sees Login; member sees the account menu", () => {
    const { unmount } = render(<TopNav />);
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    unmount();
    h.auth = "authenticated";
    render(<TopNav />);
    expect(screen.getByRole("button", { name: "Account menu" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Login" })).toBeNull();
  });

  it("bell shows an unread DOT (no number), the count lives in the label", () => {
    h.auth = "authenticated";
    h.convex = true;
    h.unread = 3;
    render(<TopNav />);
    const bell = screen.getByRole("button", { name: "Notifications, 3 unread" });
    const dot = bell.querySelector("[data-testid='unread-dot']");
    expect(dot).not.toBeNull();
    expect(bell.textContent).not.toContain("3");
  });

  it("search widens on focus (no animated width — Bible §9.2 rule 5)", () => {
    render(<TopNav />);
    const field = screen.getByTestId("menu-search-field");
    expect(field).toHaveClass("max-w-(--container-search)", "focus-within:max-w-(--container-reading)");
    expect(field.className).not.toMatch(/transition-\[?[^ ]*max-w|transition-all/);
  });
});

describe("1 · glass-* retired (L-68: one glass family)", () => {
  it("no @utility glass-* and no --glass-* tokens", () => {
    expect(utilities).not.toMatch(/@utility glass-/);
    expect(tokens).not.toMatch(/--glass-/);
  });
  it("no glass-* class anywhere in the forum source", () => {
    const hits = walk(join(REPO, "apps/forum/src")).filter((f) => /\bglass-(chrome|strong|border)\b/.test(readFileSync(f, "utf8")));
    expect(hits).toEqual([]);
  });
});

describe("2 · mobile tab bar (§8, Bible §13)", () => {
  it("full-width frosted bar with safe-area padding, five tabs in order", () => {
    render(<MobileTabBar />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(nav).toHaveClass("frost-subtle", "inset-x-0", "bottom-0", "pb-safe", "lg:hidden");
    const labels = Array.from(nav.querySelectorAll("[data-tab-label]")).map((n) => n.textContent);
    expect(labels).toEqual(["Home", "Search", "Create", "Alerts", "Profile"]);
  });

  it("active tab = brand colour + label weight, aria-current", () => {
    h.path = "/feed";
    render(<MobileTabBar />);
    const home = screen.getByRole("link", { name: "Home" });
    expect(home).toHaveAttribute("aria-current", "page");
    expect(home).toHaveClass("text-brand-primary");
    expect(screen.getByRole("link", { name: "Alerts" })).not.toHaveClass("text-brand-primary");
  });

  it("every tab has press feedback; reduced motion drops the scale", () => {
    render(<MobileTabBar />);
    for (const name of ["Home", "Search", "Alerts", "Profile"]) {
      expect(screen.getByRole("link", { name })).toHaveClass("active:scale-97", "active:duration-press", "motion-reduce:active:scale-100");
    }
    expect(screen.getByRole("button", { name: "Create" })).toHaveClass("active:scale-97", "motion-reduce:active:scale-100");
  });

  it("Create has no glow at rest (L-69) and opens the Start sheet from the tab", () => {
    render(<MobileTabBar />);
    const create = screen.getByRole("button", { name: "Create" });
    expect(create.className).not.toMatch(/(^|\s)glow-/);
    fireEvent.click(create);
    expect(useStartSheet.getState()).toMatchObject({ open: true, origin: "tab" });
  });
});

describe("3 · logo reveal on first load only", () => {
  it("first mount plays the 3-segment reveal; a later mount does not", () => {
    const first = render(<TopNav />);
    expect(first.container.querySelectorAll(".logo-reveal-segment").length).toBeGreaterThan(0);
    first.unmount();
    const second = render(<TopNav />);
    expect(second.container.querySelectorAll(".logo-reveal-segment").length).toBe(0);
  });
});

describe("4 · Start Discussion sheet (§9.3, L-34)", () => {
  const types = [
    { key: "review", label: "Review", description: "Structured tool reviews." },
    { key: "debate", label: "Debate", description: "Position-based discussions." },
  ];

  it("member: heading + one row per type with its one-line description", () => {
    const onChoose = vi.fn();
    render(<StartDiscussionSheet open origin="rail" member types={types} onChoose={onChoose} onSignIn={() => {}} onClose={() => {}} />);
    expect(screen.getByRole("dialog", { name: "What do you want to start?" })).toBeInTheDocument();
    expect(screen.getByText("Position-based discussions.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Debate/ }));
    expect(onChoose).toHaveBeenCalledWith("debate");
  });

  it("visitor: sign-in instead of the types", () => {
    const onSignIn = vi.fn();
    render(<StartDiscussionSheet open origin="rail" member={false} types={types} onChoose={() => {}} onSignIn={onSignIn} onClose={() => {}} />);
    expect(screen.queryByRole("button", { name: /Debate/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(onSignIn).toHaveBeenCalled();
  });

  it("is a frosted L3 sheet that grows from its trigger (shared element, glide)", () => {
    render(<StartDiscussionSheet open origin="tab" member types={types} onChoose={() => {}} onSignIn={() => {}} onClose={() => {}} />);
    const panel = screen.getByRole("dialog");
    expect(panel).toHaveClass("frost-strong", "shadow-lg");
    expect(panel).toHaveAttribute("data-motion", "grow");
    expect(panel).toHaveAttribute("data-origin", "tab");
  });

  it("reduced motion: crossfade, no shared-element grow", () => {
    render(<StartDiscussionSheet open origin="rail" member reduced types={types} onChoose={() => {}} onSignIn={() => {}} onClose={() => {}} />);
    expect(screen.getByRole("dialog")).toHaveAttribute("data-motion", "fade");
  });

  it("host: data types (composable, unlocked) → choosing one routes to the existing composer", () => {
    h.auth = "authenticated";
    render(<StartDiscussionHost />);
    act(() => useStartSheet.getState().show("rail"));
    const rows = Array.from(document.querySelectorAll("[data-type]"));
    expect(rows.map((r) => r.getAttribute("data-type"))).toEqual(["review", "compare", "help", "spark", "debate", "list", "showcase"]);
    fireEvent.click(screen.getByRole("button", { name: /Help/ }));
    expect(h.push).toHaveBeenCalledWith("/new-post?type=help");
    expect(useStartSheet.getState().open).toBe(false);
  });

  it("host: visitor → sign-in opens the auth modal", () => {
    render(<StartDiscussionHost />);
    act(() => useStartSheet.getState().show("tab"));
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(h.openAuthModal).toHaveBeenCalledWith("login");
  });

  it("composer reads ?type= (help → qa, unknown → none)", () => {
    expect(composerTypeFromParam("help")).toBe("qa");
    expect(composerTypeFromParam("debate")).toBe("debate");
    expect(composerTypeFromParam("news")).toBeNull();
    expect(composerTypeFromParam("nope")).toBeNull();
    expect(composerTypeFromParam(null)).toBeNull();
  });
});

describe("5 · scroll-edge fade (Bible §3.2 rule 4)", () => {
  it("utilities.css owns the fade: canvas → transparent, no hard line", () => {
    expect(utilities).toMatch(/@utility scroll-edge-fade \{[\s\S]*?linear-gradient\(to bottom, var\(--bg-canvas\)/);
  });
  it("the island casts a fade, not a solid anti-bleed mask", () => {
    render(<TopNav />);
    expect(screen.getByTestId("menu-edge-fade")).toHaveClass("scroll-edge-fade");
    expect(topNavSrc).not.toMatch(/Anti-bleed solid mask/);
  });
});
