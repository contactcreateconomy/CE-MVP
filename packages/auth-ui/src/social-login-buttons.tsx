"use client";

import { Facebook, Github } from "lucide-react";

/* Google "G" logo as inline SVG — matches lucide h-4 w-4 sizing */
function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

import type { SocialAuthProvider } from "./types";
import { cn } from "./utils/cn";
import { Button } from "./ui/button";

interface SocialLoginButtonsProps {
  isSubmitting: boolean;
  onSocialLogin: (provider: SocialAuthProvider) => void;
}

type SocialProviderMeta = {
  provider: SocialAuthProvider;
  label: string;
  Icon: typeof GoogleLogo | typeof Github;
  colorClass: string;
  buttonClass: string;
};

const socialProviders: SocialProviderMeta[] = [
  {
    provider: "google",
    label: "Continue with Google",
    Icon: GoogleLogo,
    colorClass: "",
    buttonClass:
      "hover:border-[#EA4335]/70 hover:text-[#EA4335] hover:shadow-[0_0_0_1px_rgba(234,67,53,0.32),0_0_18px_rgba(234,67,53,0.22)] focus-visible:ring-[#EA4335]/45",
  },
  {
    provider: "github",
    label: "Continue with GitHub",
    Icon: Github,
    colorClass: "text-[#2DA44E]",
    buttonClass:
      "hover:border-[#2DA44E]/70 hover:text-[#2DA44E] hover:shadow-[0_0_0_1px_rgba(45,164,78,0.32),0_0_18px_rgba(45,164,78,0.22)] focus-visible:ring-[#2DA44E]/45",
  },
  {
    provider: "facebook",
    label: "Continue with Facebook",
    Icon: Facebook,
    colorClass: "text-[#1877F2]",
    buttonClass:
      "hover:border-[#1877F2]/70 hover:text-[#1877F2] hover:shadow-[0_0_0_1px_rgba(24,119,242,0.32),0_0_18px_rgba(24,119,242,0.22)] focus-visible:ring-[#1877F2]/45",
  },
];

export function SocialLoginButtons({ isSubmitting, onSocialLogin }: SocialLoginButtonsProps) {
  return (
    <div className="mx-auto flex w-3/4 flex-col gap-2.5">
      {socialProviders.map(({ provider, label, Icon, colorClass, buttonClass }) => (
        <Button
          key={provider}
          type="button"
          variant="secondary"
          size="md"
          disabled={isSubmitting}
          className={cn(
            "group inline-flex w-full items-center justify-center gap-2.5 border-border-default bg-bg-overlay/50 px-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-[color,border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-border-active",
            buttonClass,
          )}
          onClick={() => onSocialLogin(provider)}
        >
          <Icon
            className={cn(
              "h-4 w-4 shrink-0 transition-[color,filter] duration-200 group-hover:drop-shadow-[0_0_8px_currentColor]",
              colorClass,
            )}
          />
          <span>{label}</span>
        </Button>
      ))}
    </div>
  );
}
