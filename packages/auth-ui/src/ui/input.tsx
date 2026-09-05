import * as React from "react";

import { cn } from "../utils/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "h-10 w-full rounded-md border border-border-default bg-bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted outline-hidden transition-[border-color,box-shadow] duration-200 focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/20",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
