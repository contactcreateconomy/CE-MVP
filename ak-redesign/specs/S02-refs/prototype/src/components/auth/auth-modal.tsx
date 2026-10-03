"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, X } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

export function AuthModal() {
  const {
    isAuthModalOpen,
    authMode,
    isSubmitting,
    authError,
    openAuthModal,
    closeAuthModal,
    clearAuthError,
    login,
    signup,
    socialLogin,
  } = useAuth();

  return (
    <Dialog.Root open={isAuthModalOpen} onOpenChange={(open) => (open ? openAuthModal(authMode) : closeAuthModal())}>
      <Dialog.Portal>
        <Dialog.Overlay className="auth-modal-overlay fixed inset-0 z-[70] bg-[color:var(--bg-canvas)]/68 backdrop-blur-md" />

        <Dialog.Content
          className={cn(
            "auth-modal-content fixed left-1/2 top-1/2 z-[80] w-[min(520px,94vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[20px] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)] outline-none",
            "origin-center",
          )}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-[var(--brand-primary)]/70" />

          <div className="relative p-5 sm:p-6">
            <Dialog.Close asChild>
              <button
                type="button"
                className="absolute right-5 top-5 rounded-full p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-overlay)] hover:text-[var(--text-primary)]"
                aria-label="Close authentication dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>

            <div className="mb-5 text-center">
              <Dialog.Title className="text-[28px] font-semibold leading-tight text-[var(--text-primary)] sm:text-3xl">
                {authMode === "login" ? "Welcome back" : "Create your account"}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-[var(--text-secondary)]">
                {authMode === "login"
                  ? "Log in to continue building your creator momentum."
                  : "Join Createconomy and launch your creator stack."}
              </Dialog.Description>
            </div>

            <div className="relative rounded-[12px] bg-[var(--bg-overlay)] p-1">
              <div
                className="pointer-events-none absolute bottom-1 top-1 w-[calc(50%-0.25rem)] rounded-[10px] bg-[var(--brand-primary)] shadow-[0_8px_24px_rgba(14,165,233,0.24)] transition-transform duration-300 ease-out"
                style={{ transform: `translateX(${authMode === "signup" ? "100%" : "0%"})` }}
              />

              <div className="relative z-10 grid grid-cols-2 gap-1">
                <button
                  type="button"
                  className={cn(
                    "rounded-[10px] px-3 py-2 text-xs font-semibold transition-colors duration-200",
                    authMode === "login" ? "text-black" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
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
                    "rounded-[10px] px-3 py-2 text-xs font-semibold transition-colors duration-200",
                    authMode === "signup" ? "text-black" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
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
                "mt-4 px-2 pb-1 transition-transform duration-300 ease-out",
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

            <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
              <span className="h-px flex-1 bg-[var(--border-subtle)]" />
              <span>or continue with</span>
              <span className="h-px flex-1 bg-[var(--border-subtle)]" />
            </div>

            <SocialLoginButtons isSubmitting={isSubmitting} onSocialLogin={socialLogin} />

            <div className="mt-4 rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2 text-[11px] text-[var(--text-secondary)]">
              <p className="inline-flex items-center gap-1.5">
                <ArrowRight className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                Frontend-only mock flow for now. Convex auth integration will replace backend hooks later.
              </p>
            </div>

            {authMode === "login" ? (
              <div className="mt-3 rounded-[12px] border border-[var(--border-active)]/45 bg-[var(--bg-overlay)] px-3 py-2 text-[11px] text-[var(--text-secondary)]">
                <p>
                  Test credentials — Email: <span className="font-semibold text-[var(--text-primary)]">Devtest</span> | Pass: <span className="font-semibold text-[var(--text-primary)]">123456</span>
                </p>
              </div>
            ) : null}

            <div className="sr-only" aria-live="polite">
              {isSubmitting ? "Processing authentication request" : authError ? authError : "Authentication form ready"}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
