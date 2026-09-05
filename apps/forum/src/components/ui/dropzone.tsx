"use client";

import * as React from "react";
import {
  CheckCircle2,
  FileUp,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Banner } from "@/components/ui/banner";
import { Spinner } from "@/components/ui/skeleton";

/**
 * FileDropzone (A4) — STYLE-KIT §11.17. Contribute (CAP-202) + media
 * upload (CAP-012). Composes inset surface + dashed border + Banner for
 * the state strips — no second surface.
 *
 * Status states are product-named, visuals only (§11.17): scanning /
 * quarantine / reject / success ride Banner variants inside the zone.
 * The contract's 10-value status enum (uploading·quarantined·scanning·
 * rights_review·content_review·accepted_for_forge·rejected·
 * forge_consumed·legal_hold·deleted) is the consumer's chip data; the
 * zone itself only renders the five specced visual states.
 *
 * Disabled (contribute E3 disabled-render): controls present, not
 * actionable — 40% opacity, no drag. Accepted types / max size are the
 * consumer's (contribute OQ5) — pass through as native input attrs.
 */

export type DropzoneStatus = "idle" | "scanning" | "quarantine" | "rejected" | "success";

export interface DropzoneFileChip {
  id: string;
  name: string;
}

export interface DropzoneProps {
  status?: DropzoneStatus;
  /** Status strip copy (product-owned; no invented strings here). */
  statusMessage?: string;
  /** §11.17 disabled/flag-off: present but not actionable. */
  disabled?: boolean;
  onFilesAdded?: (files: File[]) => void;
  /** File chips (Tag mechanism + filename + X ghost). */
  files?: DropzoneFileChip[];
  onFileRemoved?: (id: string) => void;
  title?: string;
  hint?: string;
  accept?: string;
  multiple?: boolean;
  className?: string;
  id?: string;
}

export function FileDropzone({
  status = "idle",
  statusMessage,
  disabled = false,
  onFilesAdded,
  files = [],
  onFileRemoved,
  title = "Upload a file",
  hint = "Drag & drop or browse. Files are scanned before review.",
  accept,
  multiple,
  className,
  id,
}: DropzoneProps) {
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || disabled) return;
    onFilesAdded?.(Array.from(fileList));
  };

  const statusBanner =
    status === "scanning" ? (
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Spinner />
        {statusMessage}
      </div>
    ) : status === "quarantine" ? (
      <Banner variant="warning">{statusMessage}</Banner>
    ) : status === "rejected" ? (
      <Banner variant="error">{statusMessage}</Banner>
    ) : status === "success" ? (
      <div className="flex items-center gap-2">
        <CheckCircle2 className="size-5 text-feedback-success" aria-hidden />
        <span className="text-sm text-text-secondary">{statusMessage}</span>
      </div>
    ) : null;

  return (
    <div className={cn("w-full", className)} id={id}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label={title}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          // §11.17 default: bg/inset, 1px dashed border/default, radius/lg
          "flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-8 text-center outline-hidden transition-colors duration-fast ease-out-cubic",
          disabled ? "cursor-not-allowed border-border-default opacity-40" : "cursor-pointer border-border-default bg-bg-inset",
          // §11.17 hover/drag-over: dashed border/active + info bg
          !disabled && (dragOver ? "border-border-active bg-feedback-info/10" : "hover:border-border-active"),
          // §11.17 reject: error border dashed
          status === "rejected" && "border-feedback-error",
          // §11.17 focus (keyboard file input): glow/primary-border
          "focus-visible:shadow-glow-primary-border",
        )}
      >
        <FileUp className="size-8 text-text-muted" aria-hidden />
        <p className="mt-2 text-sm font-semibold text-text-primary">{title}</p>
        <p className="mt-1 max-w-75 text-sm text-text-muted">{hint}</p>
        {statusBanner ? <div className="mt-4 w-full max-w-sm">{statusBanner}</div> : null}
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 ? (
        // §11.17 file chips: Tag + filename body/sm + X ghost
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {files.map((f) => (
            <li
              key={f.id}
              className="inline-flex items-center gap-1.5 rounded-md border border-border-default bg-bg-surface-elevated px-2 py-1 text-sm text-text-secondary"
            >
              <span className="max-w-48 truncate">{f.name}</span>
              {onFileRemoved ? (
                <button
                  type="button"
                  className="rounded-sm p-0.5 text-text-muted outline-hidden transition-colors duration-fast ease-out-cubic hover:text-text-primary focus-visible:ring-2 focus-visible:ring-brand-primary-hover"
                  aria-label={`Remove ${f.name}`}
                  onClick={() => onFileRemoved(f.id)}
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
