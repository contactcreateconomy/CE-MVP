"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import type { LoginPayload } from "./types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface LoginFormProps {
  isSubmitting: boolean;
  authError: string | null;
  onSubmit: (payload: LoginPayload) => Promise<void>;
  onSwitchToSignup: () => void;
}

export function LoginForm({ isSubmitting, authError, onSubmit, onSwitchToSignup }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<string | null>(null);

  const normalizedEmail = email.trim().toLowerCase();

  const emailError = useMemo(() => {
    if (!triedSubmit && email.length === 0) {
      return null;
    }

    if (!normalizedEmail) {
      return "Email is required.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return "Use a valid email format.";
    }

    return null;
  }, [email, normalizedEmail, triedSubmit]);

  const passwordError = useMemo(() => {
    if (!triedSubmit && password.length === 0) {
      return null;
    }

    if (!password) {
      return "Password is required.";
    }

    if (password.length < 8) {
      return "Password must be at least 8 characters.";
    }

    return null;
  }, [password, triedSubmit]);

  const isFormValid =
    !emailError && !passwordError && normalizedEmail.length > 0 && password.length >= 8;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTriedSubmit(true);
    setForgotPasswordMessage(null);

    if (!isFormValid) {
      return;
    }

    await onSubmit({
      email: email.trim(),
      password,
      rememberMe,
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div className="space-y-1.5">
        <label htmlFor="auth-login-email" className="text-[11px] font-semibold text-text-primary">
          Email
        </label>
        <Input
          id="auth-login-email"
          type="email"
          autoComplete="username"
          placeholder="Enter your email"
          className="border-border-default bg-bg-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? "auth-login-email-error" : undefined}
          disabled={isSubmitting}
        />
        {emailError ? (
          <p id="auth-login-email-error" className="text-xs text-feedback-error">
            {emailError}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="auth-login-password" className="text-[11px] font-semibold text-text-primary">
          Password
        </label>
        <div className="relative">
          <Input
            id="auth-login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            className="border-border-default bg-bg-surface pr-11 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(passwordError)}
            aria-describedby={passwordError ? "auth-login-password-error" : undefined}
            disabled={isSubmitting}
          />
          <button
            type="button"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-primary"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((previous) => !previous)}
            disabled={isSubmitting}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {passwordError ? (
          <p id="auth-login-password-error" className="text-xs text-feedback-error">
            {passwordError}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-xs text-text-secondary">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="h-3.5 w-3.5 rounded-sm border border-border-default"
            disabled={isSubmitting}
          />
          Remember me
        </label>

        <button
          type="button"
          className="text-xs font-medium text-brand-primary hover:underline"
          onClick={() =>
            setForgotPasswordMessage("Password reset is not enabled yet. Contact support if you are locked out.")
          }
          disabled={isSubmitting}
        >
          Forgot password?
        </button>
      </div>

      {forgotPasswordMessage ? <p className="text-xs text-text-secondary">{forgotPasswordMessage}</p> : null}

      {authError ? (
        <p className="rounded-sm border border-feedback-error/40 bg-feedback-error/10 px-3 py-2 text-xs text-feedback-error">
          {authError}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || !isFormValid}>
        {isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in...
          </span>
        ) : (
          "Sign in"
        )}
      </Button>

      <p className="text-center text-xs text-text-secondary">
        New to Createconomy?{" "}
        <button
          type="button"
          className="font-semibold text-brand-primary hover:underline"
          onClick={onSwitchToSignup}
          disabled={isSubmitting}
        >
          Create account
        </button>
      </p>
    </form>
  );
}
