"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import { AuthField } from "./auth-field";
import type { LoginValues } from "./auth-display-types";
import { AuthCheckbox, AuthErrorBanner, AuthSubmitButton, AuthSwitchLine } from "./auth-parts";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface AuthLoginFormProps {
  submitting: boolean;
  /** Server-side error (wrong credentials, rate limit…), already human copy. */
  error: string | null;
  onSubmit: (values: LoginValues) => void;
  onSwitchToSignup: () => void;
  /** Absent → "Forgot password?" is not rendered (COPY-1: unbuilt = hidden). */
  onForgotPassword?: () => void;
  /** Absent/false → "Remember me" is not rendered (SCOPE, S01-SPEC). */
  showRememberMe?: boolean;
  defaultValues?: Partial<LoginValues>;
}

/** prototype-v2 `login-form.tsx` on S00 tokens. Client-side checks only. */
export function AuthLoginForm({
  submitting,
  error,
  onSubmit,
  onSwitchToSignup,
  onForgotPassword,
  showRememberMe,
  defaultValues,
}: AuthLoginFormProps) {
  const [email, setEmail] = useState(defaultValues?.email ?? "");
  const [password, setPassword] = useState(defaultValues?.password ?? "");
  const [rememberMe, setRememberMe] = useState(defaultValues?.rememberMe ?? false);
  const [tried, setTried] = useState(false);

  const normalized = email.trim().toLowerCase();
  const emailError =
    !tried && email.length === 0
      ? null
      : !normalized
        ? "Email is required."
        : !EMAIL_RE.test(normalized)
          ? "Use a valid email format."
          : null;
  const passwordError =
    !tried && password.length === 0
      ? null
      : !password
        ? "Password is required."
        : password.length < 8
          ? "Password must be at least 8 characters."
          : null;
  const valid = !emailError && !passwordError && normalized.length > 0 && password.length >= 8;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTried(true);
    if (!valid) return;
    onSubmit({ email: email.trim(), password, rememberMe });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <AuthField
        id="auth-login-email"
        label="Email"
        type="email"
        autoComplete="username"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={emailError}
        disabled={submitting}
      />
      <AuthField
        id="auth-login-password"
        label="Password"
        type="password"
        autoComplete="current-password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={passwordError}
        revealable
        disabled={submitting}
      />

      {showRememberMe || onForgotPassword ? (
        <div className="flex items-center justify-between gap-3">
          {showRememberMe ? (
            <AuthCheckbox checked={rememberMe} onChange={setRememberMe} disabled={submitting}>
              Remember me
            </AuthCheckbox>
          ) : (
            <span />
          )}
          {onForgotPassword ? (
            <button
              type="button"
              onClick={onForgotPassword}
              disabled={submitting}
              className="focus-ring rounded-sm text-caption font-medium text-brand-primary hover:underline"
            >
              Forgot password?
            </button>
          ) : null}
        </div>
      ) : null}

      {error ? <AuthErrorBanner>{error}</AuthErrorBanner> : null}

      <AuthSubmitButton disabled={submitting || !valid}>
        {submitting ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
            Signing in...
          </span>
        ) : (
          "Sign in"
        )}
      </AuthSubmitButton>

      <AuthSwitchLine prompt="New to Createconomy?" action="Create account" onClick={onSwitchToSignup} disabled={submitting} />
    </form>
  );
}
