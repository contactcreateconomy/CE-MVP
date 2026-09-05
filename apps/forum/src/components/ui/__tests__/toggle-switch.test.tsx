import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";

import ModeToggle, { type ToggleMode } from "@/components/ui/toggle-switch";

/* Stage-2 audit FIX 2: toggle-switch hand-rolls keyboard-nav/focus logic
 * (handleKeyDown + querySelectorAll('[role="radio"]')) that tsc/build cannot
 * verify — these are the behavior tests covering exactly that runtime logic. */

function StatefulToggle({ start }: { start: ToggleMode }) {
  const [value, setValue] = React.useState<ToggleMode>(start);
  return <ModeToggle value={value} onChange={setValue} />;
}

describe("ModeToggle (toggle-switch) — runtime keyboard/focus logic", () => {
  it("radiogroup semantics: one radio checked per side, roving tabIndex follows value", () => {
    render(<ModeToggle value="min" onChange={() => {}} />);
    const group = screen.getByRole("radiogroup", { name: "Content view mode" });
    const min = screen.getByRole("radio", { name: "Minimal view" });
    const max = screen.getByRole("radio", { name: "Maximum view" });
    expect(min).toHaveAttribute("aria-checked", "true");
    expect(max).toHaveAttribute("aria-checked", "false");
    expect(min.tabIndex).toBe(0);
    expect(max.tabIndex).toBe(-1);
    expect(group).toHaveAttribute("data-state", "min");
  });

  it("ArrowRight on min: selects max, fires onChange exactly once, moves focus to the max radio", () => {
    const onChange = vi.fn();
    render(<ModeToggle value="min" onChange={onChange} />);
    const min = screen.getByRole("radio", { name: "Minimal view" });
    min.focus();
    expect(document.activeElement).toBe(min);

    fireEvent.keyDown(min, { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("max");
    // the hand-rolled querySelectorAll focus move actually ran
    expect(document.activeElement).toBe(screen.getByRole("radio", { name: "Maximum view" }));
  });

  it("ArrowLeft on max: selects min and moves focus to the min radio", () => {
    const onChange = vi.fn();
    render(<ModeToggle value="max" onChange={onChange} />);
    const max = screen.getByRole("radio", { name: "Maximum view" });
    max.focus();
    fireEvent.keyDown(max, { key: "ArrowLeft" });
    expect(onChange).toHaveBeenCalledWith("min");
    expect(document.activeElement).toBe(screen.getByRole("radio", { name: "Minimal view" }));
  });

  it("Arrow keys are symmetric (either direction from either side flips the two-state toggle)", () => {
    const onChange = vi.fn();
    const { rerender } = render(<ModeToggle value="min" onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("radio", { name: "Minimal view" }), { key: "ArrowLeft" });
    expect(onChange).toHaveBeenCalledWith("max");
    rerender(<ModeToggle value="max" onChange={onChange} />);
    fireEvent.keyDown(screen.getByRole("radio", { name: "Maximum view" }), { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith("min");
  });

  it("non-arrow keys do nothing; re-selecting the current side fires no onChange", () => {
    const onChange = vi.fn();
    render(<ModeToggle value="min" onChange={onChange} />);
    const min = screen.getByRole("radio", { name: "Minimal view" });
    fireEvent.keyDown(min, { key: "Enter" });
    fireEvent.keyDown(min, { key: " " });
    fireEvent.click(min); // already selected → guarded by handleSelect
    expect(onChange).not.toHaveBeenCalled();
  });

  it("controlled state drives data-state + aria (integration with parent state)", () => {
    render(<StatefulToggle start="min" />);
    const group = screen.getByRole("radiogroup");
    expect(group).toHaveAttribute("data-state", "min");
    fireEvent.click(screen.getByRole("radio", { name: "Maximum view" }));
    expect(group).toHaveAttribute("data-state", "max");
    const max = screen.getByRole("radio", { name: "Maximum view" });
    expect(max).toHaveAttribute("aria-checked", "true");
    // roving tabindex follows the new value
    expect(max.tabIndex).toBe(0);
    expect(screen.getByRole("radio", { name: "Minimal view" }).tabIndex).toBe(-1);
  });
});
