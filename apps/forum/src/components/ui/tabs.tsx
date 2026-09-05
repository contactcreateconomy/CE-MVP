"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

/**
 * Tabs — STYLE-KIT §11.4 nav-item states mapped to tab semantics:
 * default text/secondary, hover bg/overlay + text/primary, focus-visible
 * brand ring (§11.8 matrix), active(on) text-link with 2px brand underline
 * (§11.4 left-border adapted to horizontal tab form). Disabled 40%.
 */
const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center justify-center gap-1 rounded-full border border-border-default bg-bg-inset p-0.5 text-text-muted",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
      className={cn(
      "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold outline-hidden transition-colors duration-normal ease-out-cubic",
      "text-text-secondary hover:bg-bg-overlay hover:text-text-primary",
      // §11.4 nav-item Active adapted to horizontal tab form:
      // bg/overlay + text/link + 2px brand underline (bottom border)
      "data-[state=active]:bg-bg-overlay data-[state=active]:text-text-link data-[state=active]:border-b-2 data-[state=active]:border-b-brand-primary",
      // §11.8 matrix Tab Focus ✓: visible keyboard ring (offset clears the pill)
      "focus-visible:ring-2 focus-visible:ring-brand-primary-hover focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas",
      "disabled:pointer-events-none disabled:opacity-40",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("mt-2 outline-hidden", className)}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
