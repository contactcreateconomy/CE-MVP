"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LoginPayload } from "@/types";

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
  const isDevtestLogin = normalizedEmail === "devtest";

  const emailError = useMemo(() => {
    if (!triedSubmit && email.length === 0) {
      return null;
    }

    if (!normalizedEmail) {
      return "Email is required.";
    }

    if (isDevtestLogin) {
      return null;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return "Use a valid email format.";
    }

    return null;
  }, [email, normalizedEmail, isDevtestLogin, triedSubmit]);

  const passwordError = useMemo(() => {
    if (!triedSubmit && password.length === 0) {
      return null;
    }

    if (!password) {
      return "Password is required.";
    }

    if (isDevtestLogin) {
      if (password !== "123456") {
        return "For devtest login use password 123456.";
      }

      return null;
    }

    if (password.length < 8) {
      return "Password must be at least 8 characters.";
    }

    return null;
  }, [password, isDevtestLogin, triedSubmit]);

  const isFormValid =
    !emailError &&
    !passwordError &&
    normalizedEmail.length > 0 &&
    (isDevtestLogin ? password === "123456" : password.length >= 8);

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
        <label htmlFor="auth-login-email" className="text-xs font-medium text-[var(--text-secondary)]">
          Email
        </label>
        <Input
          id="auth-login-email"
          type="text"
          autoComplete="username"
          placeholder="Enter your email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? "auth-login-email-error" : undefined}
          disabled={isSubmitting}
        />
        {emailError ? (
          <p id="auth-login-email-error" className="text-xs text-[var(--feedback-error)]">
            {emailError}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="auth-login-password" className="text-xs font-medium text-[var(--text-secondary)]">
          Password
        </label>
        <div className="relative">
          <Input
            id="auth-login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="pr-11"
            aria-invalid={Boolean(passwordError)}
            aria-describedby={passwordError ? "auth-login-password-error" : undefined}
            disabled={isSubmitting}
          />
          <button
            type="button"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((previous) => !previous)}
            disabled={isSubmitting}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {passwordError ? (
          <p id="auth-login-password-error" className="text-xs text-[var(--feedback-error)]">
            {passwordError}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="h-3.5 w-3.5 rounded border border-[var(--border-default)]"
            disabled={isSubmitting}
          />
          Remember me
        </label>

        <button
          type="button"
          className="text-xs font-medium text-[var(--brand-primary)] hover:underline"
          onClick={() => setForgotPasswordMessage("If that email is registered, we will send reset instructions.")}
          disabled={isSubmitting}
        >
          Forgot password?
        </button>
      </div>

      {forgotPasswordMessage ? <p className="text-xs text-[var(--text-secondary)]">{forgotPasswordMessage}</p> : null}

      {authError ? (
        <p className="rounded-[var(--radius-sm)] border border-[var(--feedback-error)]/40 bg-[var(--feedback-error)]/10 px-3 py-2 text-xs text-[var(--feedback-error)]">
          {authError}
        </p>
      ) : null}

      <Button type="submit" size="md" className="w-full" disabled={isSubmitting || !isFormValid}>
        {isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in...
          </span>
        ) : (
          "Sign in"
        )}
      </Button>

      <p className="text-center text-xs text-[var(--text-secondary)]">
        New to Createconomy?{" "}
        <button
          type="button"
          className="font-semibold text-[var(--brand-primary)] hover:underline"
          onClick={onSwitchToSignup}
          disabled={isSubmitting}
        >
          Create account
        </button>
      </p>
    </form>
  );
}
