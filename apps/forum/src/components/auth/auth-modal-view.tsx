"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

import type { AuthMode, AuthSocialProvider, EmailVerification, LoginValues, SignupValues } from "./auth-display-types";
import { AuthLoginForm } from "./auth-login-form";
import { AuthSignupForm } from "./auth-signup-form";
import { AuthSocialButtons } from "./auth-social-buttons";

export interface AuthModalViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  /** A request is in flight: fields, tabs and providers are disabled. */
  submitting: boolean;
  /** Server error for the active form (human copy). */
  error: string | null;
  /** Optional status banner above the title (v2 `authEnvironmentNote`). */
  notice?: string | null;
  onLogin: (values: LoginValues) => void;
  onSignup: (values: SignupValues) => void;
  /** Configured OAuth providers, in display order. Empty → no divider/buttons. */
  socialProviders: AuthSocialProvider[];
  onSocial: (provider: AuthSocialProvider) => void;
  onForgotPassword?: () => void;
  showRememberMe?: boolean;
  emailVerification?: EmailVerification;
  termsHref?: string;
  privacyHref?: string;
  /** Lab/review only: prefill so error states can be shown. */
  defaultLoginValues?: Partial<LoginValues>;
  defaultSignupValues?: Partial<SignupValues>;
}

const COPY: Record<AuthMode, { title: string; description: string }> = {
  login: { title: "Welcome back", description: "Log in to continue building your creator momentum." },
  signup: { title: "Create your account", description: "Join Createconomy and launch your creator stack." },
};

/**
 * Login / sign-up modal (S01) — prototype-v2 `packages/auth-ui/auth-modal.tsx`
 * as a display component: Radix Dialog, pop-in panel over a subtle glass
 * backdrop, segmented Login | Sign up switch with a sliding brand pill,
 * the active form, then "or continue with" providers.
 */
export function AuthModalView({
  open,
  onOpenChange,
  mode,
  onModeChange,
  submitting,
  error,
  notice,
  onLogin,
  onSignup,
  socialProviders,
  onSocial,
  onForgotPassword,
  showRememberMe,
  emailVerification,
  termsHref,
  privacyHref,
  defaultLoginValues,
  defaultSignupValues,
}: AuthModalViewProps) {
  const copy = COPY[mode];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Flex-centred (not translate-centred): Tailwind v4's separate `translate`
            property fights the pop keyframes (v2 note). */}
        <div className="fixed inset-0 z-modal-auth flex items-center justify-center p-[min(1.25rem,4vw)]">
          {/* Glass layer 1 of 2 max (D-007): the page behind blurs. */}
          <Dialog.Overlay className="auth-modal-overlay glass-chrome absolute inset-0" />

          <Dialog.Content
            // Focus the dialog itself on open (not the close button, not a field —
            // no keyboard pop on phones); Tab then reaches the first control.
            tabIndex={-1}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              (event.currentTarget as HTMLElement | null)?.focus();
            }}
            className="auth-modal-content relative z-10 max-h-[calc(100dvh-2rem)] w-[min(560px,94vw)] origin-center overflow-y-auto overscroll-contain rounded-modal-auth border border-border-default/60 bg-bg-surface/92 shadow-2xl outline-hidden"
          >
            <div className="relative px-5 pb-7 pt-6 sm:px-8">
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close"
                  className="focus-ring absolute right-2 top-2 flex size-11 items-center justify-center rounded-full text-text-muted transition-colors duration-normal hover:bg-bg-overlay hover:text-text-primary sm:right-5 sm:top-5 sm:size-7"
                >
                  <X className="size-4" />
                </button>
              </Dialog.Close>

              {notice ? (
                <div
                  role="status"
                  className="mb-4 rounded-lg border border-feedback-warning/40 bg-feedback-warning/10 px-3 py-2.5 text-body-sm text-text-primary"
                >
                  {notice}
                </div>
              ) : null}

              <div className="mb-5 text-center">
                <Dialog.Title className="text-heading-lg font-semibold text-text-primary sm:text-display-sm">{copy.title}</Dialog.Title>
                <Dialog.Description className="mt-2 text-body-sm text-text-secondary">{copy.description}</Dialog.Description>
              </div>

              {/* Segmented switch — sliding pill guides "you are here". */}
              <div className="relative mx-auto w-full rounded-menu border border-border-default/80 bg-bg-overlay/70 p-1.5 shadow-xs" role="tablist" aria-label="Choose login or sign up">
                <div
                  aria-hidden
                  className="glow-active pointer-events-none absolute bottom-1.5 top-1.5 w-[calc(50%-0.375rem)] rounded-menu-item bg-brand-primary transition-transform duration-slow ease-out-cubic motion-reduce:transition-none"
                  style={{ transform: `translateX(${mode === "signup" ? "100%" : "0%"})` }}
                />
                <div className="relative z-10 grid grid-cols-2 gap-1.5">
                  {(["login", "signup"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="tab"
                      aria-selected={mode === m}
                      onClick={() => onModeChange(m)}
                      disabled={submitting}
                      className={
                        "text-body-sm " +
                        cn(
                          "focus-ring min-h-11 rounded-menu-item px-3.5 py-2.5 font-semibold transition-colors duration-normal sm:min-h-0",
                          mode === m ? "text-text-inverse dark:text-text-primary" : "text-text-secondary hover:text-text-primary",
                        )
                      }
                    >
                      {m === "login" ? "Login" : "Sign up"}
                    </button>
                  ))}
                </div>
              </div>

              {/* v2: the form column is 3/4 wide and grows 2% in sign-up mode.
                  Full width below sm (v2's 3/4 truncates placeholders at 390). */}
              <div
                className={cn(
                  "mx-auto mt-4 w-full px-1 pb-1 transition-transform duration-slow ease-out motion-reduce:transition-none sm:w-3/4",
                  mode === "signup" ? "sm:scale-102" : "scale-100",
                )}
              >
                {mode === "login" ? (
                  <AuthLoginForm
                    key="login"
                    submitting={submitting}
                    error={error}
                    onSubmit={onLogin}
                    onSwitchToSignup={() => onModeChange("signup")}
                    onForgotPassword={onForgotPassword}
                    showRememberMe={showRememberMe}
                    defaultValues={defaultLoginValues}
                  />
                ) : (
                  <AuthSignupForm
                    key="signup"
                    submitting={submitting}
                    error={error}
                    onSubmit={onSignup}
                    onSwitchToLogin={() => onModeChange("login")}
                    emailVerification={emailVerification}
                    termsHref={termsHref}
                    privacyHref={privacyHref}
                    defaultValues={defaultSignupValues}
                  />
                )}
              </div>

              {socialProviders.length > 0 ? (
                <>
                  <div className="mx-auto my-4 flex w-full items-center gap-3 text-overline uppercase text-text-muted sm:w-3/4">
                    <span className="h-px flex-1 bg-border-subtle" />
                    <span>or continue with</span>
                    <span className="h-px flex-1 bg-border-subtle" />
                  </div>
                  <AuthSocialButtons
                    providers={socialProviders}
                    onSelect={onSocial}
                    disabled={submitting}
                    className="mx-auto w-full sm:w-3/4"
                  />
                </>
              ) : null}

              <div className="sr-only" aria-live="polite">
                {submitting ? "Processing authentication request" : (error ?? "")}
              </div>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
