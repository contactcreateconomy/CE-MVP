import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Textarea — STYLE-KIT §11.2 TEXTAREA. Same chrome as Text Input
 * (bg/surface, border/default, radius/md, hover/focus/error/disabled)
 * with min-height 80px and vertical-only resize. Character counter is
 * the caller's responsibility (caption, text/muted, bottom-right).
 *
 * Error state: pass `aria-invalid` — border flips to feedback/error
 * (error message itself is the caller's responsibility per §11.2).
 */
export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-20 w-full resize-y rounded-md border border-border-default bg-bg-surface px-3 py-2.5 text-sm text-text-primary outline-none transition-[border-color,box-shadow] duration-normal ease-out-cubic",
          "hover:border-border-prominent",
          "focus-visible:border-border-active focus-visible:shadow-glow-primary-border",
          "aria-invalid:border-feedback-error",
          "disabled:cursor-not-allowed disabled:bg-bg-inset disabled:text-text-disabled",
          "placeholder:text-text-muted",
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";

export { Textarea };
