"use client";

import type { ReactNode } from "react";
import { Link2Off } from "lucide-react";

import { cn } from "@/lib/utils";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/skeleton";

/**
 * Interstitial (A6) — STYLE-KIT §11.19. The /go disclosure PAGE —
 * distinct from Modal: no auto-dismiss, no accidental click-through
 * chrome; this IS the page (bg/canvas, min-height 100vh, no store
 * chrome).
 *
 * Structure is fixed; COPY IS FOUNDER/LEGAL-OWNED (go-redirect contract
 * States B + OQ3: "disclosure-copy, merchant-identification wording,
 * and manual-continue affordance are legal-adjacent and NOT invented
 * here") — every string arrives via props/slots.
 *
 * Product mandate (CAP-249): off-platform → NO auto-redirect; a loading
 * state renders only AFTER explicit Continue. Dead-link and gate-fail
 * are three DISTINCT states (contract States C), rendered via the
 * error/warning variants without reusing the Continue-primary styling.
 */

export type InterstitialVariant = "disclosure" | "dead-link" | "gate-fail" | "loading";

export interface InterstitialProps {
  variant?: InterstitialVariant;
  /** §11.19 Wordmark or Mark slot (24px usage per §10.2). */
  brand?: ReactNode;
  /** disclosure: heading/lg; dead-link/gate-fail: heading/sm + Banner. */
  title: string;
  body?: ReactNode;
  /** Merchant line: body/sm, text/muted — domain from approved fingerprint. */
  merchantLine?: string;
  /** Affiliate disclosure: caption, text/muted (DEC-S21 honest labels). */
  disclosureNote?: string;
  /** Continue (primary full width) — explicit only; off-platform never auto-redirects. */
  continueLabel?: string;
  onContinue?: () => void;
  /** Cancel (secondary full width, space/3 gap) → back. */
  cancelLabel?: string;
  onCancel?: () => void;
  /** dead-link / gate-fail strip copy (product supplies the copy family). */
  notice?: string;
  /** Copy length cap: 420px auth-card or 560px modal-md width (§11.19). */
  width?: "sm" | "md";
  className?: string;
}

export function Interstitial({
  variant = "disclosure",
  brand,
  title,
  body,
  merchantLine,
  disclosureNote,
  continueLabel,
  onContinue,
  cancelLabel,
  onCancel,
  notice,
  width = "sm",
  className,
}: InterstitialProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen flex-col items-center justify-center bg-bg-canvas p-6",
        "animate-overlay-fade-in motion-reduce:duration-instant",
        className,
      )}
    >
      <div
        className={cn(
          "w-full",
          // §11.19: 420px auth-card width OR 560px modal-md if copy is long
          width === "sm" ? "max-w-(--container-auth)" : "max-w-(--container-modal)",
        )}
      >
        {brand ? <div className="mb-6 flex justify-center [&_svg]:size-6">{brand}</div> : null}

        {variant === "dead-link" || variant === "gate-fail" ? (
          // §11.19 dead-link/gate-fail: Banner error|warning + heading/sm —
          // deliberately NOT the Continue-primary styling
          <div className="space-y-3">
            <Banner variant={variant === "dead-link" ? "error" : "warning"}>{notice}</Banner>
            <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
            {body ? <div className="text-sm text-text-secondary">{body}</div> : null}
            {onCancel ? (
              <Button variant="secondary" onClick={onCancel} className="mt-2">
                {cancelLabel ?? "Back"}
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">{title}</h1>
            {body ? (
              <div className="mt-3 text-base leading-relaxed text-text-secondary">{body}</div>
            ) : null}
            {merchantLine ? (
              <p className="mt-3 text-sm text-text-muted">{merchantLine}</p>
            ) : null}
            {disclosureNote ? (
              <p className="mt-1.5 text-xs text-text-muted">{disclosureNote}</p>
            ) : null}
            <div className="mt-6 flex flex-col gap-3">
              {variant === "loading" ? (
                // Loading renders ONLY after explicit Continue (no fake-CTA spinner)
                <div className="flex items-center justify-center gap-2 py-2.5">
                  <Spinner />
                  <span className="text-sm text-text-secondary">{title}</span>
                </div>
              ) : onContinue ? (
                <Button size="md" onClick={onContinue}>
                  {continueLabel ?? "Continue"}
                </Button>
              ) : null}
              {onCancel && variant !== "loading" ? (
                <Button size="md" variant="secondary" onClick={onCancel}>
                  {cancelLabel ?? "Cancel"}
                </Button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
