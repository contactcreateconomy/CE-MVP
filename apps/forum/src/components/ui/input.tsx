import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Input — STYLE-KIT §11.2 TEXT INPUT. States per §11.8:
 * default/hover/focus/error/disabled. Tokens only.
 *
 * Error state: pass `aria-invalid` — border flips to feedback/error
 * (error message itself is the caller's responsibility per §11.2).
 */
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          // Base: bg/surface, border/default, 36px md height (h-9), radius/md, 10px/12px padding
          "h-9 w-full rounded-md border border-border-default bg-bg-surface px-3 py-2.5 text-sm text-text-primary outline-none transition-[border-color,box-shadow] duration-normal ease-out-cubic",
          // Hover: border/prominent
          "hover:border-border-prominent",
          // Focus: border/active + glow/primary-border
          "focus-visible:border-border-active focus-visible:shadow-glow-primary-border",
          // Error (aria-invalid): border feedback/error
          "aria-invalid:border-feedback-error",
          // Disabled: bg/inset, text/disabled, no interaction
          "disabled:cursor-not-allowed disabled:bg-bg-inset disabled:text-text-disabled",
          // Placeholder
          "placeholder:text-text-muted",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export { Input };
