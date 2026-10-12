import type { CSSProperties, SVGProps } from "react";

import { cn } from "@/lib/utils";

interface CreateconomyLogoMarkProps extends Omit<SVGProps<SVGSVGElement>, "color"> {
  size?: number | string;
  markColor?: string;
  decorative?: boolean;
  title?: string;
  /** 3-segment reveal (left → top-right → bottom-right), once on mount.
   *  Reduced motion → no animation (utilities.css `.logo-reveal-segment`). */
  reveal?: boolean;
}

/** Gap between the three segments, in viewBox units (mark = 22 × 22).
 *  Dark mode widens the gaps ~15% (L-42): a light mark on a dark ground
 *  spreads optically (irradiation) and the gaps read thinner. */
const GAP_LIGHT = 2;
const GAP_DARK = 2.3;

const n = (v: number) => String(+v.toFixed(4));

/** The three segments with REAL gaps (transparent — no canvas-coloured
 *  separators, so the mark sits cleanly on frost, photos, any surface).
 *  Gaps are centred on x = 11 (vertical) and y = 11 (horizontal). */
function segments(gap: number) {
  const left = 11 - gap / 2; // left half-disc: circle (10, 11) r10, x ≤ left
  const right = 11 + gap / 2; // right column starts here
  const top = 11 - gap / 2; // top-right quarter: circle (12, 10) r9, y ≤ top
  const dyL = Math.sqrt(100 - (left - 10) ** 2);
  const yTop = 10 - Math.sqrt(81 - (right - 12) ** 2);
  const xRight = 12 + Math.sqrt(81 - (top - 10) ** 2);
  return {
    leftHalf: `M${n(left)} ${n(11 - dyL)}A10 10 0 0 0 ${n(left)} ${n(11 + dyL)}Z`,
    topQuarter: `M${n(right)} ${n(yTop)}A9 9 0 0 1 ${n(xRight)} ${n(top)}H${n(right)}Z`,
    square: { x: n(right), size: n(21 - right) },
  };
}

function Mark({ gap, reveal, className }: { gap: number; reveal: boolean; className: string }) {
  const s = segments(gap);
  const seg = (i: number) =>
    reveal ? { className: "logo-reveal-segment", style: { "--i": i } as CSSProperties } : {};
  return (
    <g data-logo-gaps={gap === GAP_DARK ? "dark" : "light"} data-gap={gap} className={className}>
      <path d={s.leftHalf} {...seg(0)} />
      <path d={s.topQuarter} {...seg(1)} />
      <rect x={s.square.x} y={s.square.x} width={s.square.size} height={s.square.size} {...seg(2)} />
    </g>
  );
}

export function CreateconomyLogoMark({
  size = 32,
  markColor = "var(--brand-primary)",
  decorative = true,
  title,
  reveal = false,
  className,
  ...props
}: CreateconomyLogoMarkProps) {
  return (
    <svg
      viewBox="0 0 22 22"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      fill={markColor}
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": title ?? "Createconomy logo" })}
      {...props}
    >
      {!decorative && title ? <title>{title}</title> : null}
      <Mark gap={GAP_LIGHT} reveal={reveal} className="dark:hidden" />
      <Mark gap={GAP_DARK} reveal={reveal} className="hidden dark:inline" />
    </svg>
  );
}
