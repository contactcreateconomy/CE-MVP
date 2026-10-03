"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

export type AuthTone = "neutral" | "error" | "warning" | "success";

/** Field border by validation tone (v2: strength / match colouring). */
const TONE_BORDER: Record<AuthTone, string> = {
  neutral: "border-border-default focus:border-brand-primary/50",
  error: "border-feedback-error/70 focus:border-feedback-error",
  warning: "border-feedback-warning/70 focus:border-feedback-warning",
  success: "border-feedback-success/70 focus:border-feedback-success",
};

const TONE_BADGE: Record<AuthTone, string> = {
  neutral: "border-border-subtle bg-bg-overlay text-text-muted",
  error: "border-feedback-error/40 bg-feedback-error/12 text-feedback-error",
  warning: "border-feedback-warning/45 bg-feedback-warning/12 text-feedback-warning",
  success: "border-feedback-success/45 bg-feedback-success/12 text-feedback-success",
};

/** Small uppercase status chip inside a field (strength, match, verified). */
export function AuthBadge({ tone, id, children, className }: { tone: AuthTone; id?: string; children: ReactNode; className?: string }) {
  return (
    <span
      id={id}
      // size class kept outside cn(): twMerge would drop token type sizes next to a text colour
      className={
        "text-micro " +
        cn(
          "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-semibold uppercase tracking-wider transition-colors duration-normal",
          TONE_BADGE[tone],
          className,
        )
      }
    >
      {children}
    </span>
  );
}

export interface AuthFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className"> {
  id: string;
  label: string;
  error?: string | null;
  tone?: AuthTone;
  /** Rendered inside the field, right side (badge / inline action). */
  adornment?: ReactNode;
  /** Password show/hide toggle (v2 eye button). */
  revealable?: boolean;
  /** Below the field when there's no error (e.g. "Use a different email"). */
  hint?: ReactNode;
  /** v2: login labels are strong (11px, primary); sign-up labels soft (12px, secondary). */
  labelVariant?: "strong" | "soft";
  className?: string;
}

/**
 * Label + input + error, prototype-v2 `ui/input.tsx` look on S00 tokens.
 * 44px tall below `sm` (touch target), 40px from `sm` (v2).
 */
export function AuthField({
  id,
  label,
  error,
  tone = "neutral",
  adornment,
  revealable,
  hint,
  labelVariant = "strong",
  className,
  type = "text",
  ...input
}: AuthFieldProps) {
  const [revealed, setRevealed] = useState(false);
  const effectiveTone: AuthTone = error ? "error" : tone;
  const describedBy = [error ? `${id}-error` : null, adornment ? `${id}-status` : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={id}
        className={
          labelVariant === "strong"
            ? "block text-label-sm font-semibold text-text-primary"
            : "block text-caption font-medium text-text-secondary"
        }
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={revealable && revealed ? "text" : type}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={
            "text-body-sm " +
            cn(
              "h-11 w-full rounded-md border bg-bg-surface px-3 text-text-primary shadow-xs outline-hidden transition-[border-color,box-shadow] duration-normal placeholder:text-text-muted focus:ring-2 focus:ring-brand-primary/20 disabled:opacity-60 sm:h-10",
              TONE_BORDER[effectiveTone],
              revealable && adornment ? "pr-32" : adornment ? "pr-24" : revealable ? "pr-11" : null,
            )
          }
          {...input}
        />
        {adornment ? (
          <span
            id={`${id}-status`}
            className={cn("absolute top-1/2 flex -translate-y-1/2 items-center", revealable ? "right-11" : "right-2.5")}
          >
            {adornment}
          </span>
        ) : null}
        {revealable ? (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            disabled={input.disabled}
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
            className="focus-ring absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-text-muted transition-colors duration-normal hover:text-text-primary"
          >
            {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-caption text-feedback-error">
          {error}
        </p>
      ) : hint ? (
        <div>{hint}</div>
      ) : null}
    </div>
  );
}
