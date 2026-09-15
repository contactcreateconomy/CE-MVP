"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/skeleton";

/**
 * Select — STYLE-KIT §11.2 SELECT: input-like trigger (bg/surface,
 * border/default, radius/md) + chevron; dropdown bg/surface-elevated,
 * shadow/lg, radius/menu, max-height 300px scrollable (max-h-75).
 * States per §11.8: default/hover/focus/error(aria-invalid)/disabled +
 * loading (§11.8 matrix Select Loading ✓ — `loading` swaps the chevron
 * for a spinner and disables the trigger).
 */
const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    /** §11.8 Loading: spinner replaces the chevron; trigger disabled. */
    loading?: boolean;
  }
>(({ className, children, loading = false, disabled, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    disabled={disabled || loading}
    className={cn(
      "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-primary outline-hidden transition-[border-color,box-shadow] duration-normal ease-out-cubic",
      "hover:border-border-prominent",
      "focus-visible:border-border-active focus-visible:shadow-glow-primary-border",
      "aria-invalid:border-feedback-error",
      "disabled:cursor-not-allowed disabled:bg-bg-inset disabled:text-text-disabled",
      "data-placeholder:text-text-muted",
      className,
    )}
    {...props}
  >
    {children}
    {loading ? (
      <Spinner className="size-4" />
    ) : (
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="size-4 text-text-muted" />
      </SelectPrimitive.Icon>
    )}
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      className={cn(
        "z-dropdown max-h-75 min-w-32 overflow-hidden rounded-menu border border-border-default bg-bg-surface-elevated shadow-lg outline-hidden data-[state=open]:animate-soft-float",
        position === "popper" && "w-full min-w-[var(--radix-select-trigger-width)]",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ScrollUpButton className="flex items-center justify-center py-1">
        <ChevronUp className="size-4 text-text-muted" />
      </SelectPrimitive.ScrollUpButton>
      <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      <SelectPrimitive.ScrollDownButton className="flex items-center justify-center py-1">
        <ChevronDown className="size-4 text-text-muted" />
      </SelectPrimitive.ScrollDownButton>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer items-center rounded-menu-item py-2 pl-8 pr-2.5 text-sm text-text-primary outline-hidden transition-colors duration-normal ease-out-cubic select-none data-highlighted:bg-bg-overlay data-disabled:pointer-events-none data-disabled:opacity-40",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex size-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="size-4 text-brand-primary" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-2.5 py-1.5 text-xs font-medium text-text-muted", className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border-subtle", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
};
