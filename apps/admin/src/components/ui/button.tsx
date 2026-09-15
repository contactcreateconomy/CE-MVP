import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Button — STYLE-KIT §11.1. All states per §11.8 matrix:
 * default/hover/active/focus/disabled (+loading via `loading` prop).
 * Tokens only — no raw hex/px (Layer 2 discipline).
 */
const buttonVariants = cva(
  // Base: focus ring (2px offset, brand-hover per §11.1), disabled 40%
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium outline-hidden transition-[background-color,border-color,color,box-shadow,transform] duration-normal ease-out-cubic focus-visible:ring-2 focus-visible:ring-brand-primary-hover focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0",  {
    variants: {
      variant: {
        // §11.1 PRIMARY: brand bg, white text, glow sm (dark), hover lift + glow md
        primary:
          "bg-brand-primary text-text-inverse hover:-translate-y-px hover:bg-brand-primary-hover hover:shadow-glow-primary-md active:translate-y-0 active:bg-brand-primary-pressed active:shadow-glow-primary-sm dark:shadow-glow-primary-sm",
        // §11.1 SECONDARY: outlined
        secondary:
          "border border-border-prominent bg-transparent text-text-primary hover:border-border-active hover:bg-bg-overlay active:bg-bg-surface-elevated",
        // §11.1 GHOST: no border, minimal
        ghost:
          "bg-transparent text-text-secondary hover:bg-bg-overlay hover:text-text-primary active:bg-bg-surface-elevated",
        // §11.1 DESTRUCTIVE: feedback/error ramp (error → error-border → error-deep via opacity steps)
        destructive:
          "bg-feedback-error text-text-inverse hover:brightness-90 active:brightness-75 focus-visible:ring-feedback-error",
      },
      size: {
        // §11.1 sizes (h × px + type + icon) — type sizes on the §3 scale:
        // label/sm, label/md, body/sm, body/md (rem, grid-locked)
        xs: "h-7 px-2.5 text-label-sm [&_svg]:size-3.5",
        sm: "h-8 px-3 text-label-md [&_svg]:size-4",
        md: "h-9 px-4 text-body-sm [&_svg]:size-5",
        lg: "h-10 px-5 text-body-md [&_svg]:size-5",
        xl: "h-12 px-6 text-body-md [&_svg]:size-6",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** §11.1 LOADING: spinner replaces/besides text; keeps variant bg, disables interaction */
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading = false, disabled, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin" aria-hidden />
        ) : null}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
