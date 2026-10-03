"use client";

import { Facebook, Github } from "lucide-react";

import { cn } from "@/lib/utils";

import type { AuthSocialProvider } from "./auth-display-types";

/** Google "G" mark — the provider's own artwork (brand asset, not UI colour). */
function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

/** Per-provider tint (STYLE-KIT §2.5a `social/*`). v2's coloured hover glow
 *  (box-shadow + icon drop-shadow) is not ported — D-007 (S01-SPEC §4). */
const PROVIDERS: Record<
  AuthSocialProvider,
  { label: string; Icon: typeof Github | typeof GoogleLogo; icon: string; hover: string }
> = {
  google: {
    label: "Continue with Google",
    Icon: GoogleLogo,
    icon: "",
    hover: "hover:border-social-google/70 hover:text-social-google",
  },
  github: {
    label: "Continue with GitHub",
    Icon: Github,
    icon: "text-social-github",
    hover: "hover:border-social-github/70 hover:text-social-github",
  },
  facebook: {
    label: "Continue with Facebook",
    Icon: Facebook,
    icon: "text-social-facebook",
    hover: "hover:border-social-facebook/70 hover:text-social-facebook",
  },
};

export interface AuthSocialButtonsProps {
  providers: AuthSocialProvider[];
  onSelect: (provider: AuthSocialProvider) => void;
  disabled?: boolean;
  className?: string;
}

export function AuthSocialButtons({ providers, onSelect, disabled, className }: AuthSocialButtonsProps) {
  if (providers.length === 0) return null;
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      {providers.map((provider) => {
        const p = PROVIDERS[provider];
        return (
          <button
            key={provider}
            type="button"
            onClick={() => onSelect(provider)}
            disabled={disabled}
            className={
              "text-body-sm " +
              cn(
                "focus-ring group inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-md border border-border-default bg-bg-overlay/50 px-8 font-medium text-text-primary shadow-xs transition-[color,border-color,transform] duration-normal ease-out-cubic hover:-translate-y-px active:scale-97 disabled:pointer-events-none disabled:opacity-40 motion-reduce:transform-none sm:h-9",
                p.hover,
              )
            }
          >
            <p.Icon className={cn("size-4 shrink-0", p.icon)} />
            <span>{p.label}</span>
          </button>
        );
      })}
    </div>
  );
}
