"use client";

import { Chrome, Facebook, Github } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SocialAuthProvider } from "@/types";

interface SocialLoginButtonsProps {
  isSubmitting: boolean;
  onSocialLogin: (provider: SocialAuthProvider) => void;
}

type SocialProviderMeta = {
  provider: SocialAuthProvider;
  label: string;
  Icon: typeof Chrome;
  colorClass: string;
  buttonClass: string;
};

const socialProviders: SocialProviderMeta[] = [
  {
    provider: "google",
    label: "Continue with Google",
    Icon: Chrome,
    colorClass: "text-[#EA4335]",
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
    <div className="flex flex-col items-center gap-2.5">
      {socialProviders.map(({ provider, label, Icon, colorClass, buttonClass }) => (
        <Button
          key={provider}
          type="button"
          variant="secondary"
          size="md"
          disabled={isSubmitting}
          className={cn(
            "group inline-flex w-auto min-w-[286px] items-center justify-center gap-2.5 px-8 transition-[color,border-color,box-shadow,transform] duration-200 hover:-translate-y-px",
            buttonClass,
          )}
          onClick={() => onSocialLogin(provider)}
        >
          <Icon className={cn("h-4 w-4 shrink-0 transition-[color,filter] duration-200 group-hover:drop-shadow-[0_0_8px_currentColor]", colorClass)} />
          <span>{label}</span>
        </Button>
      ))}
    </div>
  );
}
