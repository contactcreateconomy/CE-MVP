"use client";

import { CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck, ShieldEllipsis, ShieldX } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SignupPayload } from "@/types";

interface SignupFormProps {
  isSubmitting: boolean;
  authError: string | null;
  onSubmit: (payload: SignupPayload) => Promise<void>;
  onSwitchToLogin: () => void;
}

type PasswordStrength = {
  label: "Very weak" | "Weak" | "Fair" | "Good" | "Strong";
  statusClass: string;
  inputClass: string;
};

function getPasswordStrength(password: string): PasswordStrength {
  if (!password.length) {
    return {
      label: "Very weak",
      statusClass: "border-[var(--border-subtle)] bg-[var(--bg-overlay)] text-[var(--text-muted)]",
      inputClass: "",
    };
  }

  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^\w\s]/.test(password)) score += 1;

  if (score <= 1) {
    return {
      label: "Weak",
      statusClass: "border-[var(--feedback-error)]/40 bg-[var(--feedback-error)]/12 text-[var(--feedback-error)]",
      inputClass: "border-[var(--feedback-error)]/70 focus:border-[var(--feedback-error)]",
    };
  }

  if (score === 2) {
    return {
      label: "Fair",
      statusClass: "border-orange-400/45 bg-orange-400/12 text-orange-300",
      inputClass: "border-orange-400/70 focus:border-orange-300",
    };
  }

  if (score === 3) {
    return {
      label: "Good",
      statusClass: "border-yellow-400/45 bg-yellow-400/12 text-yellow-300",
      inputClass: "border-yellow-400/70 focus:border-yellow-300",
    };
  }

  return {
    label: "Strong",
    statusClass: "border-[var(--feedback-success)]/45 bg-[var(--feedback-success)]/12 text-[var(--feedback-success)]",
    inputClass: "border-[var(--feedback-success)]/70 focus:border-[var(--feedback-success)]",
  };
}


export function SignupForm({ isSubmitting, authError, onSubmit, onSwitchToLogin }: SignupFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);

  const emailSyntaxIsValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);

  const nameError = useMemo(() => {
    if (!triedSubmit && name.length === 0) {
      return null;
    }

    if (!name.trim()) {
      return "Full name is required.";
    }

    if (name.trim().length < 2) {
      return "Full name must be at least 2 characters.";
    }

    return null;
  }, [name, triedSubmit]);

  const emailError = useMemo(() => {
    if (!triedSubmit && email.length === 0) {
      return null;
    }

    if (!email.trim()) {
      return "Email is required.";
    }

    if (!emailSyntaxIsValid) {
      return "Enter a valid email address.";
    }

    if (!emailVerified) {
      return "Verify your email to continue.";
    }

    return null;
  }, [email, emailSyntaxIsValid, emailVerified, triedSubmit]);

  const passwordError = useMemo(() => {
    if (!triedSubmit && password.length === 0) {
      return null;
    }

    if (password.length < 8) {
      return "Password must be at least 8 characters.";
    }

    return null;
  }, [password, triedSubmit]);

  const confirmPasswordError = useMemo(() => {
    if (!triedSubmit && confirmPassword.length === 0) {
      return null;
    }

    if (!confirmPassword) {
      return "Please confirm your password.";
    }

    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }

    return null;
  }, [confirmPassword, password, triedSubmit]);

  const termsError = triedSubmit && !acceptedTerms ? "You must accept the terms to continue." : null;

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  const isFormValid =
    !nameError &&
    !emailError &&
    !passwordError &&
    !confirmPasswordError &&
    !termsError &&
    emailVerified &&
    !!name.trim() &&
    !!email.trim() &&
    password.length >= 8;

  const requestOtp = async () => {
    if (!emailSyntaxIsValid || !email.trim()) {
      setOtpError("Enter a valid email address first.");
      return;
    }

    setSendingOtp(true);
    setOtpError(null);
    setOtpMessage(null);
    setEmailVerified(false);
    setOtpRequested(true);

    await new Promise((resolve) => setTimeout(resolve, 900));

    setSendingOtp(false);
    setOtpMessage(`OTP sent to ${email.trim()}.`);
  };

  const verifyOtp = () => {
    if (otpCode.trim() !== "123456") {
      setEmailVerified(false);
      setOtpError("Incorrect OTP. Use 123456 for mock verification.");
      return;
    }

    setEmailVerified(true);
    setOtpError(null);
    setOtpMessage("Email verified successfully.");
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailVerified(false);
    setOtpRequested(false);
    setOtpCode("");
    setOtpError(null);
    setOtpMessage(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTriedSubmit(true);

    if (!isFormValid) {
      return;
    }

    await onSubmit({
      name: name.trim(),
      email: email.trim(),
      password,
      confirmPassword,
      acceptedTerms,
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div className="space-y-1.5">
        <label htmlFor="auth-signup-name" className="text-xs font-medium text-[var(--text-secondary)]">
          Full name
        </label>
        <Input
          id="auth-signup-name"
          autoComplete="name"
          placeholder="Enter your full name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={Boolean(nameError)}
          aria-describedby={nameError ? "auth-signup-name-error" : undefined}
          disabled={isSubmitting}
        />
        {nameError ? (
          <p id="auth-signup-name-error" className="text-xs text-[var(--feedback-error)]">
            {nameError}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="auth-signup-email" className="text-xs font-medium text-[var(--text-secondary)]">
          Email
        </label>
        <div className="relative">
          <Input
            id="auth-signup-email"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => handleEmailChange(event.target.value)}
            className="pr-24"
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? "auth-signup-email-error" : undefined}
            disabled={isSubmitting || sendingOtp}
          />
          <button
            type="button"
            onClick={requestOtp}
            disabled={isSubmitting || sendingOtp}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-[var(--bg-overlay)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--border-subtle)] disabled:opacity-60"
          >
            {sendingOtp ? "Sending..." : emailVerified ? "Verified" : "Verify"}
          </button>
        </div>

        {otpRequested ? (
          <div className="animate-soft-float space-y-2 rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-overlay)]/55 p-2.5">
            <label htmlFor="auth-signup-otp" className="text-[11px] font-medium text-[var(--text-secondary)]">
              OTP verification code
            </label>
            <div className="flex gap-2">
              <Input
                id="auth-signup-otp"
                inputMode="numeric"
                placeholder="Enter OTP"
                maxLength={6}
                value={otpCode}
                onChange={(event) => {
                  setOtpCode(event.target.value.replace(/\D/g, ""));
                  setOtpError(null);
                }}
                disabled={isSubmitting || sendingOtp || emailVerified}
              />
              <Button
                type="button"
                variant="secondary"
                className="shrink-0"
                onClick={verifyOtp}
                disabled={isSubmitting || sendingOtp || otpCode.length < 6 || emailVerified}
              >
                {emailVerified ? "Done" : "Confirm"}
              </Button>
            </div>

            <div className="min-h-[18px] text-xs">
              {sendingOtp ? (
                <span className="inline-flex items-center gap-1.5 text-[var(--text-secondary)]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Waiting for OTP delivery...
                </span>
              ) : null}

              {!sendingOtp && otpMessage ? (
                <span className="inline-flex items-center gap-1.5 text-[var(--feedback-success)]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {otpMessage}
                </span>
              ) : null}

              {!sendingOtp && otpError ? (
                <span className="inline-flex items-center gap-1.5 text-[var(--feedback-error)]">
                  <ShieldX className="h-3.5 w-3.5" />
                  {otpError}
                </span>
              ) : null}

              {!sendingOtp && !otpMessage && !otpError && otpRequested ? (
                <span className="inline-flex items-center gap-1.5 text-[var(--text-muted)]">
                  <ShieldEllipsis className="h-3.5 w-3.5" />
                  Use 123456 for this frontend mock flow.
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

        {emailError ? (
          <p id="auth-signup-email-error" className="text-xs text-[var(--feedback-error)]">
            {emailError}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="auth-signup-password" className="text-xs font-medium text-[var(--text-secondary)]">
          Password
        </label>
        <div className="relative">
          <Input
            id="auth-signup-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={cn(
              "pr-[126px]",
              !passwordError && password.length > 0 ? passwordStrength.inputClass : undefined,
              passwordError ? "border-[var(--feedback-error)]/70 focus:border-[var(--feedback-error)]" : undefined,
            )}
            aria-invalid={Boolean(passwordError)}
            aria-describedby={
              passwordError ? "auth-signup-password-error" : password.length > 0 ? "auth-signup-password-status" : undefined
            }
            disabled={isSubmitting}
          />

          {password.length > 0 ? (
            <span
              id="auth-signup-password-status"
              className={cn(
                "pointer-events-none absolute right-10 top-1/2 -translate-y-1/2 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors duration-200",
                passwordStrength.statusClass,
              )}
            >
              {passwordStrength.label}
            </span>
          ) : null}

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
          <p id="auth-signup-password-error" className="text-xs text-[var(--feedback-error)]">
            {passwordError}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="auth-signup-confirm-password" className="text-xs font-medium text-[var(--text-secondary)]">
          Confirm password
        </label>
        <div className="relative">
          <Input
            id="auth-signup-confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={cn(
              "pr-[132px]",
              confirmPassword.length > 0 && passwordsMatch
                ? "border-[var(--feedback-success)]/70 focus:border-[var(--feedback-success)]"
                : undefined,
              confirmPassword.length > 0 && !passwordsMatch ? "border-orange-400/70 focus:border-orange-300" : undefined,
            )}
            aria-invalid={Boolean(confirmPasswordError)}
            aria-describedby={
              confirmPasswordError
                ? "auth-signup-confirm-password-error"
                : confirmPassword.length > 0
                  ? "auth-signup-confirm-password-status"
                  : undefined
            }
            disabled={isSubmitting}
          />

          {confirmPassword.length > 0 ? (
            <span
              id="auth-signup-confirm-password-status"
              className={cn(
                "pointer-events-none absolute right-10 top-1/2 -translate-y-1/2 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors duration-200",
                passwordsMatch
                  ? "border-[var(--feedback-success)]/45 bg-[var(--feedback-success)]/12 text-[var(--feedback-success)]"
                  : "border-orange-400/45 bg-orange-400/12 text-orange-300",
              )}
            >
              {passwordsMatch ? "Matched" : "Yet to match"}
            </span>
          ) : null}

          <button
            type="button"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            onClick={() => setShowConfirmPassword((previous) => !previous)}
            disabled={isSubmitting}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {confirmPasswordError ? (
          <p id="auth-signup-confirm-password-error" className="text-xs text-[var(--feedback-error)]">
            {confirmPasswordError}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label className="inline-flex items-start gap-2 text-xs text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 rounded border border-[var(--border-default)]"
            disabled={isSubmitting}
          />
          <span>
            I agree to the <span className="font-medium text-[var(--text-primary)]">Terms</span> and <span className="font-medium text-[var(--text-primary)]">Privacy Policy</span>.
          </span>
        </label>
        {termsError ? <p className="text-xs text-[var(--feedback-error)]">{termsError}</p> : null}
      </div>

      {authError ? (
        <p className="rounded-[var(--radius-sm)] border border-[var(--feedback-error)]/40 bg-[var(--feedback-error)]/10 px-3 py-2 text-xs text-[var(--feedback-error)]">
          {authError}
        </p>
      ) : null}

      <Button type="submit" size="md" className="w-full" disabled={isSubmitting || !isFormValid}>
        {isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating account...
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Create account
          </span>
        )}
      </Button>

      <p className="text-center text-xs text-[var(--text-secondary)]">
        Already have an account?{" "}
        <button
          type="button"
          className="font-semibold text-[var(--brand-primary)] hover:underline"
          onClick={onSwitchToLogin}
          disabled={isSubmitting}
        >
          Sign in
        </button>
      </p>
    </form>
  );
}
