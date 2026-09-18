"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Switch — STYLE-KIT §11.2 TOGGLE / SWITCH: 44×24px, radius/full. Track off
 * bg zinc-700 (dark) / zinc-300 (light); track on bg/brand-primary; knob
 * 20px white circle shadow/sm; duration/fast transition. §11.8 matrix:
 * Default/Hover/Disabled/Active(on) — no Focus/Error rows (unlike
 * Checkbox) but focus-visible ring is still provided for keyboard a11y.
 *
 * Added in the 2026-09-18 screen audit: no boolean on/off primitive
 * existed in either app's `ui/` (only Checkbox, a materially different
 * affordance) despite §11.2 fully specifying one — screens contractually
 * requiring "Toggle / Switch" (e.g. CONTRACT-3-rulebook §6 per-rule
 * `enabled`) had silently substituted Checkbox. This is the missing
 * primitive, not a new invention — every value below is copied verbatim
 * from the STYLE-KIT block quoted above.
 */
export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Visually-hidden label for screen readers (§9.4 icon-only rule). */
  "aria-label": string;
}

export function Switch({
  checked,
  onCheckedChange,
  className,
  disabled,
  ...props
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full outline-hidden transition-colors duration-fast ease-out-cubic",
        checked ? "bg-brand-primary" : "bg-zinc-300 dark:bg-zinc-700",
        "focus-visible:ring-2 focus-visible:ring-brand-primary-hover focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas",
        "disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "inline-block size-5 rounded-full bg-white shadow-sm transition-transform duration-fast ease-out-cubic",
          checked ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
