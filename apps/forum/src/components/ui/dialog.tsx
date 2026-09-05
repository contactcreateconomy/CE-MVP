"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Dialog — STYLE-KIT §11.7 MODAL. Backdrop 60% + blur(4px), container
 * bg/surface-elevated, radius/xl, shadow/xl; backdrop fade + scale-reveal
 * using the app's real modal tokens (duration-modal-in / ease-pop-in).
 * Widths via size prop → container tokens: sm 420 (auth) / md 560 (§11.7
 * md) / lg = modal-media 1200 — the showcase lightbox, per real app
 * usage (RECONCILIATION-NOTE #7); NOT §11.7's generic 720 text-modal
 * width. A 720 reading-width modal is md + max-w-(--container-reading).
 */
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-dropdown bg-black/60 backdrop-blur-[length:var(--blur-overlay)] data-[state=open]:animate-overlay-fade-in data-[state=closed]:animate-overlay-fade-out",

      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const dialogContentBase =
  "fixed left-1/2 top-1/2 z-dropdown -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border-default bg-bg-surface-elevated p-6 shadow-xl outline-hidden data-[state=open]:animate-modal-pop-in data-[state=closed]:animate-modal-pop-out";

const dialogSizes = {
  sm: "w-(--container-auth)",
  md: "max-w-(--container-modal)",
  lg: "w-(--container-modal-media)",
} as const;

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: keyof typeof dialogSizes;
  showClose?: boolean;
}

type DialogContentPropsRef = React.ElementRef<typeof DialogPrimitive.Content>;

const DialogContent = React.forwardRef<DialogContentPropsRef, DialogContentProps>(
  ({ className, children, size = "md", showClose = true, ...props }, ref) => (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(dialogContentBase, dialogSizes[size], className)}
        {...props}
      >
        {children}
        {showClose ? (
          <DialogPrimitive.Close
            className="absolute right-4 top-4 rounded-md p-1 text-text-muted outline-hidden transition-colors duration-normal ease-out-cubic hover:bg-bg-overlay hover:text-text-primary focus-visible:ring-2 focus-visible:ring-brand-primary-hover"
            aria-label="Close"
          >
            <X className="size-5" />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPortal>
  ),
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mb-4 space-y-1.5 text-left", className)} {...props} />
);

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-text-primary", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-text-secondary", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

/** §11.7 footer: right-aligned action row over a subtle divider. */
const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "mt-6 flex flex-col-reverse gap-2 border-t border-border-subtle pt-4 sm:flex-row sm:justify-end",
      className,
    )}
    {...props}
  />
);

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogOverlay,
};
