"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

/**
 * Tooltip — STYLE-KIT §11.7 TOOLTIP: bg/surface-elevated, radius/md,
 * 4px 8px padding (px-2 py-1), caption 12px, max-w 240px (max-w-60),
 * 6px arrow (size-1.5) on the tooltip surface, fade in via the overlay
 * tokens with §11.7's 200ms appear delay (delayDuration — §7.1 has no
 * dedicated fast-fade step, so the overlay fade duration ships; logged
 * in RECONCILIATION-NOTE). Light mode: no inverted-zinc override — the
 * surface-elevated/text-primary token pair already flips for contrast.
 *
 * STATUS (AUDIT-LAYERS-1-2-3 FIX 5): no production consumers yet —
 * demonstrated on the /kit fixture (icon-only A1 row action); first
 * production consumers are the Phase-3+ admin consoles' icon-only row
 * actions (SLICE-P3-07/09/10/11, §11.10 "Row actions: icon-only →
 * aria-label + tooltip"). Do not delete.
 */
const TooltipProvider = TooltipPrimitive.Provider;
// §11.7: 200ms appear delay — Root-level prop (Radix default is 700ms)
const Tooltip = ({
  delayDuration = 200,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) => (
  <TooltipPrimitive.Root delayDuration={delayDuration} {...props} />
);
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, children, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-tooltip max-w-60 rounded-md border border-border-default bg-bg-surface-elevated px-2 py-1 text-xs text-text-primary shadow-md outline-hidden",
        // §11.7 fade — overlay tokens; reduced-motion safe via the app's
        // targeted kill-switch on these classes
        "data-[state=delayed-open]:animate-overlay-fade-in data-[state=closed]:animate-overlay-fade-out",
        className,
      )}
      {...props}
    >
      {children}
      {/* §11.7 arrow: 6px triangle on the tooltip surface (SVG geometry
          prop — the §11.7 literal; same prop class as sideOffset) */}
      <TooltipPrimitive.Arrow
        className="fill-bg-surface-elevated"
        width={6}
        height={6}
      />
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
