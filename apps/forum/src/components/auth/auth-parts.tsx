"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Primary submit — the screen's one CTA (`.glow-cta`, dark only per D-007).
 *  v2 keeps white text on brand in both themes; `--text-inverse` is near-black
 *  in dark, so dark uses `--text-primary` (near-white). */
export function AuthSubmitButton({ className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      className={
        "text-body-md " +
        cn(
          "glow-cta focus-ring inline-flex h-11 w-full items-center justify-center rounded-md bg-brand-primary px-5 font-medium text-text-inverse transition-[background-color,transform,opacity] duration-normal ease-out-cubic hover:bg-brand-primary-hover active:scale-97 active:bg-brand-primary-pressed disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none dark:text-text-primary sm:h-10",
          className,
        )
      }
      {...props}
    >
      {children}
    </button>
  );
}

export function AuthErrorBanner({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-sm border border-feedback-error/40 bg-feedback-error/10 px-3 py-2 text-caption text-feedback-error">
      {children}
    </p>
  );
}

export function AuthCheckbox({
  checked,
  onChange,
  disabled,
  children,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={"text-caption " + cn("inline-flex min-h-11 cursor-pointer items-start gap-2 text-text-secondary sm:min-h-0", className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="focus-ring mt-0.5 size-3.5 shrink-0 rounded-sm border border-border-default accent-brand-primary"
      />
      <span>{children}</span>
    </label>
  );
}

export function AuthSwitchLine({
  prompt,
  action,
  onClick,
  disabled,
}: {
  prompt: string;
  action: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <p className="text-center text-caption text-text-secondary">
      {prompt}{" "}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="focus-ring rounded-sm font-semibold text-brand-primary hover:underline"
      >
        {action}
      </button>
    </p>
  );
}
