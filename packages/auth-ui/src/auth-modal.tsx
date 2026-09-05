"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { LoginForm } from "./login-form";
import { SignupForm } from "./signup-form";
import { SocialLoginButtons } from "./social-login-buttons";
import { cn } from "./utils/cn";
import { useAppAuth } from "./app-auth-provider";

export function AuthModal() {
  const {
    isAuthModalOpen,
    authMode,
    isSubmitting,
    authError,
    authEnvironmentNote,
    openAuthModal,
    closeAuthModal,
    clearAuthError,
    login,
    signup,
    socialLogin,
  } = useAppAuth();

  return (
    <Dialog.Root open={isAuthModalOpen} onOpenChange={(open) => (open ? openAuthModal(authMode) : closeAuthModal())}>
      <Dialog.Portal>
        {/*
          Flex-center the panel instead of fixed + translate utilities. Tailwind v4 can emit the
          `translate` property separately from `transform`, which fights our modal keyframes and
          can leave the dialog at the static position (top-left).
        */}
        <div className="auth-modal-portal-root fixed inset-0 z-70 flex items-center justify-center p-[min(1.25rem,4vw)]">
          <Dialog.Overlay className="auth-modal-overlay absolute inset-0 bg-bg-canvas/68 backdrop-blur-md" />

          <Dialog.Content
            className={cn(
              "auth-modal-content relative z-10 w-[min(560px,94vw)] overflow-hidden rounded-[20px] border border-white/10 bg-(--bg-surface)/92 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_32px_80px_rgba(0,0,0,0.55)] outline-hidden",
              "origin-center",
            )}
          >
            <div className="relative px-7 sm:px-8 pt-6 pb-7">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="absolute right-5 top-5 rounded-full p-1.5 text-text-muted transition-colors hover:bg-bg-overlay hover:text-text-primary"
                  aria-label="Close authentication dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>

              {authEnvironmentNote ? (
                <div
                  role="status"
                  className="mb-4 rounded-[12px] border border-feedback-warning/40 bg-feedback-warning/10 px-3 py-2.5 text-left text-sm text-text-primary"
                >
                  {authEnvironmentNote}
                </div>
              ) : null}

              <div className="mb-5 text-center">
                <Dialog.Title className="text-[28px] font-semibold leading-tight text-text-primary sm:text-3xl">
                  {authMode === "login" ? "Welcome back" : "Create your account"}
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-text-secondary">
                  {authMode === "login"
                    ? "Log in to continue building your creator momentum."
                    : "Join Createconomy and launch your creator stack."}
                </Dialog.Description>
              </div>

              <div className="relative mx-auto w-full rounded-[14px] border border-border-default/80 bg-bg-overlay/70 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div
                  className="pointer-events-none absolute bottom-1.5 top-1.5 w-[calc(50%-0.375rem)] rounded-[11px] bg-brand-primary shadow-[0_8px_24px_rgba(14,165,233,0.24)] transition-transform duration-300 ease-out"
                  style={{ transform: `translateX(${authMode === "signup" ? "100%" : "0%"})` }}
                />

                <div className="relative z-10 grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    className={cn(
                      "rounded-[11px] px-3.5 py-2.5 text-sm font-semibold transition-colors duration-200",
                      authMode === "login" ? "text-white" : "text-text-secondary hover:text-text-primary",
                    )}
                    onClick={() => {
                      clearAuthError();
                      openAuthModal("login");
                    }}
                    disabled={isSubmitting}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "rounded-[11px] px-3.5 py-2.5 text-sm font-semibold transition-colors duration-200",
                      authMode === "signup" ? "text-white" : "text-text-secondary hover:text-text-primary",
                    )}
                    onClick={() => {
                      clearAuthError();
                      openAuthModal("signup");
                    }}
                    disabled={isSubmitting}
                  >
                    Sign up
                  </button>
                </div>
              </div>

              <div
                className={cn(
                  "mx-auto mt-4 w-3/4 px-1 pb-1 transition-transform duration-300 ease-out",
                  authMode === "signup" ? "scale-[1.02]" : "scale-100",
                )}
              >
                {authMode === "login" ? (
                  <LoginForm
                    isSubmitting={isSubmitting}
                    authError={authError}
                    onSubmit={login}
                    onSwitchToSignup={() => {
                      clearAuthError();
                      openAuthModal("signup");
                    }}
                  />
                ) : (
                  <SignupForm
                    isSubmitting={isSubmitting}
                    authError={authError}
                    onSubmit={signup}
                    onSwitchToLogin={() => {
                      clearAuthError();
                      openAuthModal("login");
                    }}
                  />
                )}
              </div>

              <div className="mx-auto my-4 flex w-3/4 items-center gap-3 text-[11px] uppercase tracking-[0.12em] text-text-muted">
                <span className="h-px flex-1 bg-border-subtle" />
                <span>or continue with</span>
                <span className="h-px flex-1 bg-border-subtle" />
              </div>

              <SocialLoginButtons isSubmitting={isSubmitting} onSocialLogin={socialLogin} />

              <div className="sr-only" aria-live="polite">
                {isSubmitting ? "Processing authentication request" : authError ? authError : "Authentication form ready"}
              </div>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
