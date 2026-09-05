"use client";

import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { type ChangeEvent, type FormEvent, type KeyboardEvent, type ClipboardEvent, useEffect, useMemo, useRef, useState } from "react";

import type { SignupPayload } from "./types";
import { cn } from "./utils/cn";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

/* ── Placeholder backend functions ── */

async function sendOtpCode(_email: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 600));
  return "123456";
}

async function verifyOtpCode(_email: string, code: string): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 500));
  return code === "123456";
}

/* ── Types ── */

type EmailVerifyStep = "idle" | "verifying" | "error" | "verified";

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
      statusClass: "border-border-subtle bg-bg-overlay text-text-muted",
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
      statusClass: "border-feedback-error/40 bg-feedback-error/12 text-feedback-error",
      inputClass: "border-feedback-error/70 focus:border-feedback-error",
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
    statusClass: "border-feedback-success/45 bg-feedback-success/12 text-feedback-success",
    inputClass: "border-feedback-success/70 focus:border-feedback-success",
  };
}

export function SignupForm({ isSubmitting, authError, onSubmit, onSwitchToLogin }: SignupFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);

  // Email verification state
  const [emailVerifyStep, setEmailVerifyStep] = useState<EmailVerifyStep>("idle");
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [otpErrorMessage, setOtpErrorMessage] = useState<string | null>(null);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

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

    return null;
  }, [email, emailSyntaxIsValid, triedSubmit]);

  const emailVerifyError = useMemo(() => {
    if (triedSubmit && emailSyntaxIsValid && emailVerifyStep !== "verified") {
      return "Please verify your email before signing up.";
    }
    return null;
  }, [triedSubmit, emailSyntaxIsValid, emailVerifyStep]);

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
    !!name.trim() &&
    !!email.trim() &&
    password.length >= 8 &&
    emailVerifyStep === "verified";

  /* ── OTP handlers ── */

  const handleVerifyClick = async () => {
    if (!emailSyntaxIsValid || isSubmitting) return;
    setIsOtpLoading(true);
    try {
      await sendOtpCode(email.trim());
      setEmailVerifyStep("verifying");
      setOtpDigits(Array(6).fill(""));
      setOtpErrorMessage(null);
    } catch {
      setOtpErrorMessage("Could not send verification code. Please try again.");
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    if (emailVerifyStep === "error") setEmailVerifyStep("verifying");

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (next.every((d) => d !== "") && digit) {
      handleOtpSubmit(next.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const next = [...otpDigits];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setOtpDigits(next);
    if (emailVerifyStep === "error") setEmailVerifyStep("verifying");
    const focusIdx = Math.min(text.length, 5);
    otpRefs.current[focusIdx]?.focus();
    if (next.every((d) => d !== "")) handleOtpSubmit(next.join(""));
  };

  const handleOtpSubmit = async (code: string) => {
    setIsOtpLoading(true);
    try {
      const valid = await verifyOtpCode(email.trim(), code);
      if (valid) {
        setEmailVerifyStep("verified");
        setOtpErrorMessage(null);
      } else {
        setEmailVerifyStep("error");
        setOtpErrorMessage("Invalid code. Please try again.");
      }
    } catch {
      setEmailVerifyStep("error");
      setOtpErrorMessage("Verification failed. Please try again.");
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleChangeEmail = () => {
    setEmail("");
    setEmailVerifyStep("idle");
    setOtpDigits(Array(6).fill(""));
    setOtpErrorMessage(null);
  };

  const handleResendCode = async () => {
    setOtpDigits(Array(6).fill(""));
    setOtpErrorMessage(null);
    setEmailVerifyStep("verifying");
    await sendOtpCode(email.trim());
  };

  /* ── Focus management ── */

  useEffect(() => {
    if (emailVerifyStep === "verifying" || emailVerifyStep === "error") {
      const timer = setTimeout(() => otpRefs.current[0]?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [emailVerifyStep]);

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

  const isOtpVisible = emailVerifyStep === "verifying" || emailVerifyStep === "error";
  const isEmailVisible = emailVerifyStep === "idle" || emailVerifyStep === "verified";

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div className="space-y-1.5">
        <label htmlFor="auth-signup-name" className="text-xs font-medium text-text-secondary">
          Full name
        </label>
        <Input
          id="auth-signup-name"
          autoComplete="name"
          placeholder="Enter your full name"
          className="border-border-default bg-bg-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={Boolean(nameError)}
          aria-describedby={nameError ? "auth-signup-name-error" : undefined}
          disabled={isSubmitting}
        />
        {nameError ? (
          <p id="auth-signup-name-error" className="text-xs text-feedback-error">
            {nameError}
          </p>
        ) : null}
      </div>

      {/* ── Email verification section ── */}
      <div className="relative min-h-[88px]">
        {/* Layer 1: Email input */}
        <div
          className={cn(
            "space-y-1.5 transition-[opacity,transform] duration-300 ease-out",
            isEmailVisible ? "opacity-100 translate-y-0" : "pointer-events-none absolute inset-0 opacity-0 -translate-y-1",
          )}
        >
          <label htmlFor="auth-signup-email" className="text-xs font-medium text-text-secondary">
            Email
          </label>
          <div className="relative">
            <Input
              id="auth-signup-email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              className={cn(
                "bg-bg-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
                emailVerifyStep === "verified"
                  ? "border-feedback-success/70 pr-24"
                  : emailSyntaxIsValid
                    ? "border-border-default pr-20"
                    : "border-border-default",
              )}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (emailVerifyStep === "verified") setEmailVerifyStep("idle");
              }}
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? "auth-signup-email-error" : undefined}
              disabled={isSubmitting}
            />

            {/* Inline Verify button — matches password strength badge format */}
            {emailSyntaxIsValid && emailVerifyStep === "idle" && (
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-feedback-success/45 bg-feedback-success/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-feedback-success transition-[background-color,opacity] duration-200 hover:bg-feedback-success/20 active:bg-feedback-success/30"
                onClick={handleVerifyClick}
                disabled={isSubmitting || isOtpLoading}
              >
                {isOtpLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Verify"}
              </button>
            )}

            {/* Verified badge */}
            {emailVerifyStep === "verified" && (
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-md border border-feedback-success/45 bg-feedback-success/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-feedback-success transition-[opacity,transform] duration-200">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </span>
            )}
          </div>
          {emailVerifyStep === "verified" ? (
            <button
              type="button"
              className="text-[11px] font-medium text-brand-primary hover:underline"
              onClick={handleChangeEmail}
              disabled={isSubmitting}
            >
              Use a different email
            </button>
          ) : emailError ? (
            <p id="auth-signup-email-error" className="text-xs text-feedback-error">
              {emailError}
            </p>
          ) : emailVerifyError ? (
            <p className="text-xs text-feedback-error">{emailVerifyError}</p>
          ) : null}
        </div>

        {/* Layer 2: OTP input */}
        <div
          className={cn(
            "transition-[opacity,transform] duration-300 ease-out",
            isOtpVisible ? "opacity-100 translate-y-0" : "pointer-events-none absolute inset-0 opacity-0 translate-y-1",
            emailVerifyStep === "error" && "animate-[auth-otp-shake_0.4s_ease-in-out]",
          )}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span>
                Code sent to <span className="font-medium text-text-primary">{email}</span>
              </span>
            </div>

            <div role="group" aria-label="Enter verification code" className="flex items-center justify-center gap-2">
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : undefined}
                  maxLength={1}
                  value={digit}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleOtpDigitChange(i, e.target.value)}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => handleOtpKeyDown(i, e)}
                  onPaste={i === 0 ? handleOtpPaste : undefined}
                  disabled={isSubmitting || isOtpLoading}
                  aria-label={`Digit ${i + 1} of 6`}
                  className={cn(
                    "h-11 w-11 rounded-lg border bg-bg-surface text-center text-lg font-semibold text-text-primary outline-hidden transition-[border-color,box-shadow] duration-200",
                    digit
                      ? "border-brand-primary/60 ring-2 ring-brand-primary/25 shadow-[0_0_8px_rgba(14,165,233,0.2)]"
                      : "border-border-default shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] [.dark_&]:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]",
                    emailVerifyStep === "error" && !digit && "border-feedback-error/60",
                  )}
                />
              ))}
            </div>

            {emailVerifyStep === "error" && otpErrorMessage ? (
              <p role="alert" className="text-center text-xs text-feedback-error">
                {otpErrorMessage}
              </p>
            ) : null}

            <div className="flex items-center justify-between">
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-text-secondary transition-colors hover:text-text-primary"
                onClick={handleChangeEmail}
                disabled={isSubmitting}
              >
                <ArrowLeft className="h-3 w-3" />
                Change email
              </button>
              <button
                type="button"
                className="text-[11px] font-medium text-brand-primary transition-colors hover:text-brand-primary/80"
                onClick={handleResendCode}
                disabled={isSubmitting || isOtpLoading}
              >
                Resend code
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="auth-signup-password" className="text-xs font-medium text-text-secondary">
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
              "border-border-default bg-bg-surface pr-[126px] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
              !passwordError && password.length > 0 ? passwordStrength.inputClass : undefined,
              passwordError ? "border-feedback-error/70 focus:border-feedback-error" : undefined,
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
                "pointer-events-none absolute right-10 top-1/2 -translate-y-1/2 rounded-md border border-gray-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors duration-200",
                passwordStrength.statusClass,
              )}
            >
              {passwordStrength.label}
            </span>
          ) : null}

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
          <p id="auth-signup-password-error" className="text-xs text-feedback-error">
            {passwordError}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="auth-signup-confirm-password" className="text-xs font-medium text-text-secondary">
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
              "border-border-default bg-bg-surface pr-[132px] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
              confirmPassword.length > 0 && passwordsMatch
                ? "border-feedback-success/70 focus:border-feedback-success"
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
                "pointer-events-none absolute right-10 top-1/2 -translate-y-1/2 rounded-md border border-gray-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors duration-200",
                passwordsMatch
                  ? "border-feedback-success/45 bg-feedback-success/12 text-feedback-success"
                  : "border-orange-400/45 bg-orange-400/12 text-orange-300",
              )}
            >
              {passwordsMatch ? "Matched" : "Yet to match"}
            </span>
          ) : null}

          <button
            type="button"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-primary"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            onClick={() => setShowConfirmPassword((previous) => !previous)}
            disabled={isSubmitting}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {confirmPasswordError ? (
          <p id="auth-signup-confirm-password-error" className="text-xs text-feedback-error">
            {confirmPasswordError}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label className="inline-flex items-start gap-2 text-xs text-text-secondary">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 rounded-sm border border-border-default"
            disabled={isSubmitting}
          />
          <span>
            I agree to the <span className="font-medium text-text-primary">Terms</span> and{" "}
            <span className="font-medium text-text-primary">Privacy Policy</span>.
          </span>
        </label>
        {termsError ? <p className="text-xs text-feedback-error">{termsError}</p> : null}
      </div>

      {authError ? (
        <p className="rounded-sm border border-feedback-error/40 bg-feedback-error/10 px-3 py-2 text-xs text-feedback-error">
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

      <p className="text-center text-xs text-text-secondary">
        Already have an account?{" "}
        <button
          type="button"
          className="font-semibold text-brand-primary hover:underline"
          onClick={onSwitchToLogin}
          disabled={isSubmitting}
        >
          Sign in
        </button>
      </p>
    </form>
  );
}
