import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

interface CreateconomyLogoMarkProps extends Omit<SVGProps<SVGSVGElement>, "color"> {
  size?: number | string;
  markColor?: string;
  separatorColor?: string;
  decorative?: boolean;
  title?: string;
}

export function CreateconomyLogoMark({
  size = 32,
  markColor = "var(--brand-primary)",
  separatorColor = "var(--bg-canvas)",
  decorative = true,
  title,
  className,
  ...props
}: CreateconomyLogoMarkProps) {
  return (
    <svg
      viewBox="0 0 22 22"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": title ?? "Createconomy logo" })}
      {...props}
    >
      {!decorative && title ? <title>{title}</title> : null}

      <g fill={markColor}>
        <path d="M10 1A10 10 0 0 0 10 21Z" />
        <path d="M12 1A9 9 0 0 1 21 10H12Z" />
        <rect x="12" y="12" width="9" height="9" />
      </g>

      <g fill={separatorColor}>
        <rect x="10" y="1" width="2" height="20" />
        <rect x="12" y="10" width="9" height="2" />
      </g>
    </svg>
  );
}
