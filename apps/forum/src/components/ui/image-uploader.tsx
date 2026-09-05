"use client";

import { useMutation } from "convex/react";
import { useCallback, useRef, useState } from "react";
import { ImagePlus, Upload, X } from "lucide-react";

import { api } from "@/lib/convex";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onUploadComplete: (url: string) => void;
  onError?: (error: string) => void;
  maxWidthPx?: number;
  aspectRatio?: string;
  className?: string;
  /** Current preview URL (for showing existing images) */
  value?: string;
  /** Called when the user clears the image */
  onClear?: () => void;
}

type UploadState = "idle" | "resizing" | "uploading" | "done" | "error";

export function ImageUploader({
  onUploadComplete,
  onError,
  maxWidthPx = 1200,
  aspectRatio,
  className,
  value,
  onClear,
}: ImageUploaderProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generateUrl = useMutation(api.forum.mutations.generateUploadUrl);

  const resizeFile = useCallback(
    (file: File): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidthPx) {
            height = Math.round((height * maxWidthPx) / width);
            width = maxWidthPx;
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas not supported"));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Failed to resize image"));
            },
            "image/jpeg",
            0.85,
          );
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = URL.createObjectURL(file);
      });
    },
    [maxWidthPx],
  );

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        const msg = "Only image files are supported";
        setErrorMsg(msg);
        onError?.(msg);
        return;
      }

      setState("resizing");
      setProgress(10);
      setErrorMsg(null);

      try {
        const resized = await resizeFile(file);
        setProgress(40);
        setState("uploading");

        const uploadUrl = await generateUrl();
        setProgress(60);

        const result = await fetch(uploadUrl, {
          method: "POST",
          body: resized,
        });

        if (!result.ok) {
          throw new Error("Upload failed");
        }

        setProgress(80);
        const { storageId } = (await result.json()) as { storageId: string };

        setPreview(URL.createObjectURL(resized));
        setProgress(100);
        setState("done");
        onUploadComplete(storageId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setErrorMsg(msg);
        setState("error");
        onError?.(msg);
      }
    },
    [generateUrl, onUploadComplete, onError, resizeFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const handleClear = useCallback(() => {
    setPreview(null);
    setState("idle");
    setProgress(0);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClear?.();
  }, [onClear]);

  const isUploading = state === "resizing" || state === "uploading";

  return (
    <div className={cn("relative", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleInputChange}
        aria-label="Upload image"
      />

      {preview ? (
        <div
          className="group relative overflow-hidden rounded-lg border border-(--border-default)"
          style={aspectRatio ? { aspectRatio } : undefined}
        >
          <img
            src={preview}
            alt="Upload preview"
            className="h-full w-full object-cover"
          />
          {!isUploading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="h-1 w-32 overflow-hidden rounded-full bg-white/30">
                <div
                  className="h-full rounded-full bg-white transition-all duration-slow"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
          }}
          role="button"
          tabIndex={0}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-(--border-default) bg-(--bg-surface) px-4 py-8 transition-colors hover:border-(--border-active) hover:bg-(--bg-overlay)",
            isUploading && "pointer-events-none opacity-60",
          )}
          style={aspectRatio ? { aspectRatio } : undefined}
          aria-label="Drop an image or click to upload"
        >
          {isUploading ? (
            <>
              <Upload className="h-6 w-6 animate-pulse text-(--text-muted)" />
              <div className="h-1 w-24 overflow-hidden rounded-full bg-(--border-default)">
                <div
                  className="h-full rounded-full bg-(--brand-primary) transition-all duration-slow"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-(--text-muted)">Uploading…</p>
            </>
          ) : (
            <>
              <ImagePlus className="h-6 w-6 text-(--text-muted)" />
              <p className="text-sm text-(--text-secondary)">
                Drop an image or <span className="text-(--brand-primary)">browse</span>
              </p>
              <p className="text-xs text-(--text-muted)">Max {maxWidthPx}px wide</p>
            </>
          )}
        </div>
      )}

      {errorMsg && (
        <p className="mt-1.5 text-xs text-(--feedback-error)">{errorMsg}</p>
      )}
    </div>
  );
}
