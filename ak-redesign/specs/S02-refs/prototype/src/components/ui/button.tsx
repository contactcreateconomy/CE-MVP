import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary-hover)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)] disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] active:bg-[var(--brand-primary-pressed)] dark:electric-glow",
        secondary:
          "border border-[var(--border-prominent)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-overlay)] hover:border-[var(--border-active)]",
        ghost:
          "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)]",
        destructive:
          "bg-[var(--feedback-error)] text-white hover:opacity-90",
      },
      size: {
        xs: "h-7 px-2.5 text-[11px]",
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4 text-sm",
        lg: "h-10 px-5 text-base",
        xl: "h-12 px-6 text-base",
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
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
