import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { SIGNAL_LEVELS, TieredLadder } from "@/components/ui/tiered-ladder";

/* A8 tiered ladder — §11.26 locked constraints + CONTRACT-7-profile-economy
 * States G/H/I (CAP-313/312). */

describe("TieredLadder (A8 — §11.26 / profile-economy contract)", () => {
  it("renders exactly the ten signal.level literals, Multiverse at the top, Orbit at the bottom", () => {
    const { container } = render(<TieredLadder currentLevel="moon" />);
    const rungTexts = Array.from(container.querySelectorAll("span.text-xs.font-semibold")).map(
      (el) => el.textContent,
    );
    // masked silhouettes render dots; visible rungs render their names
    const reversed = [...SIGNAL_LEVELS].reverse();
    expect(rungTexts).toHaveLength(SIGNAL_LEVELS.length);
    // top rung is Multiverse (silhouette → masked), bottom is Orbit (achieved)
    expect(rungTexts[0]).toBe("···");
    expect(rungTexts[rungTexts.length - 1]).toBe("Orbit");
    // rung count matches the enum exactly — no invented eleventh rung
    expect(SIGNAL_LEVELS).toHaveLength(10);
    expect(reversed[0]).toBe("multiverse");
    expect(reversed[reversed.length - 1]).toBe("orbit");
  });

  it("current rung: brand fill + dark-only glow; below = text/primary; above = silhouette (bg/inset + lock)", () => {
    const { container } = render(<TieredLadder currentLevel="planet" />);
    const currentRung = container.querySelector("[aria-current='step']");
    expect(currentRung).not.toBeNull();
    expect(currentRung).toHaveClass("bg-brand-primary");
    expect(currentRung).toHaveClass("dark:shadow-glow-primary-sm");

    // silhouette rungs: inset surface + disabled text + lock icon
    const silhouettes = Array.from(container.querySelectorAll(".bg-bg-inset"));
    expect(silhouettes.length).toBe(SIGNAL_LEVELS.length - 5); // star..multiverse above planet
    expect(container.querySelectorAll("svg.lucide-lock").length).toBe(silhouettes.length);
    // achieved below + current: no inset fill
    expect(
      Array.from(container.querySelectorAll(".text-text-primary")).length,
    ).toBe(4); // orbit..moon achieved
  });

  it("CAP-312 opt-out unmounts the entire visualization — nothing renders", () => {
    const { container } = render(<TieredLadder currentLevel="star" optedOut />);
    expect(container.innerHTML).toBe("");
  });

  it("three-component progress renders under the NEXT milestone only (States G)", () => {
    const { container } = render(
      <TieredLadder
        currentLevel="comet"
        progress={{ reachPct: 64, signalPct: 41, sustainedPct: 12, sustainedLabel: "4 / 30 days" }}
      />,
    );
    const bars = container.querySelectorAll("[role='progressbar']");
    expect(bars.length).toBe(3);
    expect(bars[0]).toHaveAttribute("aria-valuenow", "64");
    expect(bars[1]).toHaveAttribute("aria-valuenow", "41");
    expect(bars[2]).toHaveAttribute("aria-valuenow", "12");
    expect(screen.getByText("4 / 30 days")).toBeDefined();
    // progress sits inside the "next" (moon) rung's block
    const moonRung = screen.getByText("Moon").closest("div");
    expect(moonRung?.parentElement?.querySelector("[role='progressbar']")).not.toBeNull();
  });

  it("revealState data overrides the default derivation (M12 progressive reveal)", () => {
    // pulsar explicitly revealed by definition data even though far above current
    const { container } = render(
      <TieredLadder
        currentLevel="orbit"
        rungs={[
          { level: "orbit" },
          { level: "comet" },
          { level: "moon" },
          { level: "planet" },
          { level: "star" },
          { level: "supernova" },
          { level: "pulsar", revealState: "visible", label: "Pulsar" },
          { level: "galaxy" },
          { level: "universe" },
          { level: "multiverse" },
        ]}
      />,
    );
    expect(screen.getByText("Pulsar")).toBeDefined();
    // pulsar's cell is not an inset silhouette
    expect(screen.getByText("Pulsar").closest("div")).not.toHaveClass("bg-bg-inset");
  });

  it("level-up only: SCALE REVEAL rides the current rung when justLeveledUp", () => {
    const { container } = render(<TieredLadder currentLevel="star" justLeveledUp />);
    expect(container.querySelector("[aria-current='step']")).toHaveClass("animate-scale-reveal");
    const { container: browsing } = render(<TieredLadder currentLevel="star" />);
    expect(browsing.querySelector("[aria-current='step']")).not.toHaveClass("animate-scale-reveal");
  });

  it("loading renders ten skeleton rungs; assignment status pill renders on the current rung (States H)", () => {
    const { container, rerender } = render(<TieredLadder currentLevel="moon" loading />);
    expect(container.querySelectorAll("[aria-busy='true']").length).toBe(1);

    rerender(<TieredLadder currentLevel="moon" assignmentStatus="holdover" />);
    expect(screen.getByText("holdover")).toBeDefined();
    expect(screen.getByText("holdover").closest("[aria-current='step']")).not.toBeNull();
  });
});
