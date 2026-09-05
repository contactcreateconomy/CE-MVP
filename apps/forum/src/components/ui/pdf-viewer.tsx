"use client";

import * as React from "react";
import { ExternalLink, FileWarning, Minus, Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Banner } from "@/components/ui/banner";
import { SkeletonImage } from "@/components/ui/skeleton";

/**
 * PdfViewer (A5) — STYLE-KIT §11.18. Chrome around a SANDBOXED iframe —
 * not a designed PDF.js theme. Delivery/CSP is product (CAP-211):
 * short-TTL signed URLs, sandboxed iframe + CSP, patched pdf.js, no app
 * cookies on the delivery origin — the consumer supplies the `src` and
 * the sandbox/CSP attributes via `frameProps`.
 *
 * States (resource-viewer contract): skeleton while the signed URL
 * resolves; §11.23 empty-state + Banner/error when blocked/corrupt;
 * anonymous teaser = same shell + empty-state + primary CTA (teaser
 * content is DEC-M10-VIEW-AUTH's, not invented here).
 */

export interface PdfViewerProps {
  /** Signed short-TTL URL from the clean delivery origin. */
  src?: string | null;
  title: string;
  /** §11.18 loading: signed-URL fetch (skeleton). */
  loading?: boolean;
  /** Blocked / corrupt / unsupported — empty-state + Banner/error. */
  error?: string;
  /** Anonymous teaser branch: same shell, CTA slot. */
  teaser?: { heading: string; description?: string; ctaLabel?: string; onCta?: () => void };
  onClose?: () => void;
  /** Pass-through sandbox/CSP attrs (product-owned delivery contract). */
  frameProps?: React.IframeHTMLAttributes<HTMLIFrameElement>;
  className?: string;
}

const ZOOM_STEPS = [100, 125, 150] as const;

export function PdfViewer({
  src,
  title,
  loading = false,
  error,
  teaser,
  onClose,
  frameProps,
  className,
}: PdfViewerProps) {
  const [zoomIndex, setZoomIndex] = React.useState(0);

  return (
    <div className={cn("flex min-h-screen flex-col bg-bg-canvas", className)}>
      {/* §11.18 toolbar: 40px, ghost controls, truncated title, close */}
      <div className="flex h-10 shrink-0 items-center gap-1 border-b border-border-subtle bg-bg-surface px-2">
        <span className="flex items-center gap-0.5">
          <Button
            size="sm"
            variant="ghost"
            aria-label="Zoom out"
            disabled={zoomIndex === 0}
            onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
          >
            <Minus className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            aria-label="Zoom in"
            disabled={zoomIndex === ZOOM_STEPS.length - 1}
            onClick={() => setZoomIndex((i) => Math.min(ZOOM_STEPS.length - 1, i + 1))}
          >
            <Plus className="size-4" />
          </Button>
        </span>
        <p className="min-w-0 flex-1 truncate px-2 text-sm font-semibold text-text-secondary">
          {title}
        </p>
        {src ? (
          <Button size="sm" variant="ghost" aria-label="Open in new tab" onClick={() => window.open(src, "_blank", "noopener")}>
            <ExternalLink className="size-4" />
          </Button>
        ) : null}
        {onClose ? (
          <Button size="sm" variant="ghost" aria-label="Close viewer" onClick={onClose}>
            <X className="size-4" />
          </Button>
        ) : null}
      </div>

      {/* §11.18 stage: bg/inset, centered card frame, 720px reading width */}
      <div className="flex flex-1 justify-center overflow-auto bg-bg-inset p-4">
        <div className="card-surface w-full max-w-(--container-reading) overflow-hidden shadow-sm">
          {loading ? (
            // §11.9 skeleton (signed-URL fetch)
            <div className="p-4">
              <SkeletonImage />
            </div>
          ) : error ? (
            <div className="space-y-3 p-4">
              <Banner variant="error">{error}</Banner>
              <EmptyState
                compact
                icon={<FileWarning className="size-5" />}
                heading="Content unavailable"
              />
            </div>
          ) : teaser || !src ? (
            teaser ? (
              <EmptyState
                icon={<FileWarning className="size-12" />}
                heading={teaser.heading}
                description={teaser.description}
                action={
                  teaser.ctaLabel && teaser.onCta
                    ? { label: teaser.ctaLabel, onClick: teaser.onCta }
                    : undefined
                }
              />
            ) : (
              <EmptyState
                compact
                icon={<FileWarning className="size-5" />}
                heading="No document"
              />
            )
          ) : (
            <iframe
              src={src}
              title={title}
              // §11.18: width 100%, min-height 70vh, radius 0 (nested in card)
              className="min-h-[70vh] w-full border-0"
              style={{ width: `${ZOOM_STEPS[zoomIndex]}%` }}
              {...frameProps}
            />
          )}
        </div>
      </div>
    </div>
  );
}
