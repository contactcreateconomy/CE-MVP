import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ModeToggle from "../toggle-switch";
import { axe } from "vitest-axe";

/* First axe accessibility rules — Testing-Strategy row 7.
 * Pattern: render real components, run axe-core, assert ZERO violations.
 * vitest-axe@0.1 exports { axe, configureAxe } only (no toHaveNoViolations
 * matcher), so we assert on results.violations directly.
 *
 * ModeToggle is a radiogroup pattern (role=radio, aria-checked, roving
 * tabIndex, arrow-key handling) — exactly the kind of widget a11y regressions
 * hit. Radix primitives get covered as high-traffic components are added.
 */

describe("ModeToggle accessibility (axe)", () => {
  it("has no axe violations in the min state", async () => {
    const { container } = render(<ModeToggle value="min" onChange={() => {}} />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it("has no axe violations in the max state", async () => {
    const { container } = render(<ModeToggle value="max" onChange={() => {}} />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it("exposes the radiogroup semantics axe cannot check alone", () => {
    render(<ModeToggle value="min" onChange={() => {}} />);
    const group = screen.getByRole("radiogroup", { name: "Content view mode" });
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(2);
    expect(radios.map((r) => (r as HTMLElement).getAttribute("aria-checked"))).toEqual(["true", "false"]);
    expect(group).toBeTruthy();
  });
});
