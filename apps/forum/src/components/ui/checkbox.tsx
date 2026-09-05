"use client";

import * as React from "react";
import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Checkbox — STYLE-KIT §11.2 CHECKBOX: 16px box (size-4), radius/sm,
 * unchecked border/prominent transparent bg; checked brand/primary bg +
 * white check icon/xs; indeterminate brand/primary bg + white minus;
 * disabled 40%. §11.8 matrix adds Hover (unchecked → border/active) and
 * Error (invalid → border feedback/error). A1 bulk-select (§11.10) is the
 * primary consumer.
 */
export interface CheckboxProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  /** Header "select page" state when only part of the page is selected. */
  indeterminate?: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** §11.8 Error state: aria-invalid + feedback/error border. */
  invalid?: boolean;
  /** Visually-hidden label for screen readers (§9.4 icon-only rule). */
  "aria-label": string;
}

export function Checkbox({
  checked,
  indeterminate = false,
  onCheckedChange,
  invalid = false,
  className,
  disabled,
  ...props
}: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-invalid={invalid || undefined}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-sm border outline-hidden transition-colors duration-fast ease-out-cubic",
        checked || indeterminate
          ? "border-brand-primary bg-brand-primary text-text-inverse hover:border-brand-primary-hover"
          : cn(
              "bg-transparent",
              // §11.8 hover: unchecked border brightens toward active
              invalid ? "border-feedback-error hover:border-feedback-error" : "border-border-prominent hover:border-border-active",
            ),
        // §11.8 error: invalid checked box carries the error border instead
        invalid && (checked || indeterminate) && "border-feedback-error",
        "focus-visible:ring-2 focus-visible:ring-brand-primary-hover focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas",
        "disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
      {...props}
    >
      {indeterminate ? (
        <Minus className="size-3" aria-hidden />
      ) : checked ? (
        <Check className="size-3" aria-hidden />
      ) : null}
    </button>
  );
}
