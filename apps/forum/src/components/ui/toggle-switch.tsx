"use client";

/**
 * ModeToggle — horizontal split-pill toggle for MIN / MAX content view modes.
 *
 * Visual layout:
 *   MIN active → | MIN | ⊕ |
 *   MAX active → | ⊖ | MAX |
 *
 * The active side cross-fades from icon (Minus/Plus in circle) into the full
 * word (MIN/MAX) with a spring animation.
 */

import { useCallback, useEffect, useRef } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToggleMode = "min" | "max";

export interface ModeToggleProps {
  value: ToggleMode;
  onChange: (value: ToggleMode) => void;
  className?: string;
}

export default function ModeToggle({ value, onChange, className }: ModeToggleProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rootRef.current) {
      rootRef.current.setAttribute("data-state", value);
    }
  }, [value]);

  const handleSelect = useCallback(
    (side: ToggleMode) => {
      if (side !== value) onChange(side);
    },
    [value, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, side: ToggleMode) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const next: ToggleMode = side === "min" ? "max" : "min";
        onChange(next);
        const root = rootRef.current;
        if (root) {
          const buttons = root.querySelectorAll<HTMLButtonElement>('[role="radio"]');
          const target = Array.from(buttons).find((btn) => btn.dataset.side === next);
          target?.focus();
        }
      }
    },
    [onChange]
  );

  return (
    <div
      ref={rootRef}
      role="radiogroup"
      aria-label="Content view mode"
      data-state={value}
      className={cn("toggle-root", className)}
    >
      <div className="toggle-indicator" aria-hidden="true" />

      <button
        role="radio"
        aria-checked={value === "min"}
        aria-label="Minimal view"
        data-side="min"
        tabIndex={value === "min" ? 0 : -1}
        className="toggle-half left-half"
        onClick={() => handleSelect("min")}
        onKeyDown={(e) => handleKeyDown(e, "min")}
      >
        <span className="toggle-letter" aria-hidden="true">
          <Minus className="toggle-lucide" strokeWidth={2.5} />
        </span>
        <span className="toggle-word" aria-hidden="true">MIN</span>
      </button>

      <button
        role="radio"
        aria-checked={value === "max"}
        aria-label="Maximum view"
        data-side="max"
        tabIndex={value === "max" ? 0 : -1}
        className="toggle-half right-half"
        onClick={() => handleSelect("max")}
        onKeyDown={(e) => handleKeyDown(e, "max")}
      >
        <span className="toggle-letter" aria-hidden="true">
          <Plus className="toggle-lucide" strokeWidth={2.5} />
        </span>
        <span className="toggle-word" aria-hidden="true">MAX</span>
      </button>
    </div>
  );
}
