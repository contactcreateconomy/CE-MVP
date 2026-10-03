"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";

import { cn } from "@/lib/utils";

import { AuthBadge, AuthField, type AuthTone } from "./auth-field";
import type { EmailVerification, SignupValues } from "./auth-display-types";
import { AuthCheckbox, AuthErrorBanner, AuthSubmitButton, AuthSwitchLine } from "./auth-parts";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_LENGTH = 6;

/** v2 strength score (length, case mix, digit, symbol). v2's orange/yellow
 *  steps have no tokens → Fair and Good share `--feedback-warning`. */
function passwordStrength(password: string): { label: string; tone: AuthTone } {
  if (!password) return { label: "Very weak", tone: "neutral" };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^\w\s]/.test(password)) score += 1;
  if (score <= 1) return { label: "Weak", tone: "error" };
  if (score === 2) return { label: "Fair", tone: "warning" };
  if (score === 3) return { label: "Good", tone: "warning" };
  return { label: "Strong", tone: "success" };
}

export interface AuthSignupFormProps {
  submitting: boolean;
  error: string | null;
  onSubmit: (values: SignupValues) => void;
  onSwitchToLogin: () => void;
  /** Absent → no email-ownership step (SCOPE, S01-SPEC). */
  emailVerification?: EmailVerification;
  /** Absent → "Terms" / "Privacy Policy" render as text (v2), not links. */
  termsHref?: string;
  privacyHref?: string;
  defaultValues?: Partial<SignupValues>;
}

function OtpBoxes({ verification, email, disabled }: { verification: EmailVerification; email: string; disabled: boolean }) {
  const [digits, setDigits] = useState<string[]>(() => Array(CODE_LENGTH).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const isError = verification.state === "error";
  const busy = verification.state === "checking";

  // Focus the first box when the step opens / after an error (v2: 150 ms).
  useEffect(() => {
    if (verification.state !== "code" && verification.state !== "error") return;
    const t = window.setTimeout(() => refs.current[isError ? digits.findIndex((d) => !d) : 0]?.focus(), 150);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- focus only on step change
  }, [verification.state]);

  const commit = (next: string[]) => {
    setDigits(next);
    if (next.every((d) => d !== "")) verification.onSubmitCode(next.join(""));
  };

  const onChange = (i: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = digit;
    if (digit && i < CODE_LENGTH - 1) refs.current[i + 1]?.focus();
    commit(next);
  };
  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH).split("");
    const next = Array.from({ length: CODE_LENGTH }, (_, i) => pasted[i] ?? "");
    refs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
    commit(next);
  };

  return (
    <div
      className={cn(
        "space-y-3",
        // v2 shake on a wrong code — confirms "that didn't work" (S01-SPEC §4).
        isError && "animate-[auth-otp-shake_0.4s_ease-in-out] motion-reduce:animate-none",
      )}
    >
      <p className="flex items-center gap-1.5 text-caption text-text-secondary">
        <Mail className="size-3.5 shrink-0" aria-hidden />
        <span>
          Code sent to <span className="font-medium text-text-primary">{email}</span>
        </span>
      </p>
      <div role="group" aria-label="Enter verification code" className="flex items-center justify-center gap-2">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : undefined}
            maxLength={1}
            value={digit}
            onChange={(e) => onChange(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onPaste={i === 0 ? onPaste : undefined}
            disabled={disabled || busy}
            aria-label={`Digit ${i + 1} of ${CODE_LENGTH}`}
            className={
              "text-heading-sm " +
              cn(
                "size-11 rounded-lg border bg-bg-surface text-center font-semibold text-text-primary outline-hidden transition-[border-color,box-shadow] duration-normal focus:ring-2 focus:ring-brand-primary/25",
                // v2 filled box: brand border + ring (its soft brand glow → .glow-active, dark only)
                digit ? "glow-active border-brand-primary/60 ring-2 ring-brand-primary/25" : "border-border-default shadow-xs",
                isError && !digit && "border-feedback-error/60",
              )
            }
          />
        ))}
      </div>
      {isError && verification.error ? (
        <p role="alert" className="text-center text-caption text-feedback-error">
          {verification.error}
        </p>
      ) : null}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setDigits(Array(CODE_LENGTH).fill(""));
            verification.onChangeEmail();
          }}
          disabled={disabled}
          className="focus-ring inline-flex min-h-11 items-center gap-1 rounded-sm text-label-sm font-medium text-text-secondary transition-colors duration-normal hover:text-text-primary sm:min-h-0"
        >
          <ArrowLeft className="size-3" aria-hidden />
          Change email
        </button>
        <button
          type="button"
          onClick={() => {
            setDigits(Array(CODE_LENGTH).fill(""));
            verification.onResend();
          }}
          disabled={disabled || busy}
          className="focus-ring min-h-11 rounded-sm text-label-sm font-medium text-brand-primary transition-colors duration-normal hover:text-brand-primary/80 sm:min-h-0"
        >
          Resend code
        </button>
      </div>
    </div>
  );
}

function TermsText({ termsHref, privacyHref }: { termsHref?: string; privacyHref?: string }) {
  const term = (href: string | undefined, label: string): ReactNode =>
    href ? (
      <Link href={href} className="focus-ring rounded-sm font-medium text-text-primary underline-offset-2 hover:underline">
        {label}
      </Link>
    ) : (
      <span className="font-medium text-text-primary">{label}</span>
    );
  return (
    <>
      I agree to the {term(termsHref, "Terms")} and {term(privacyHref, "Privacy Policy")}.
    </>
  );
}

/** prototype-v2 `signup-form.tsx` on S00 tokens. */
export function AuthSignupForm({
  submitting,
  error,
  onSubmit,
  onSwitchToLogin,
  emailVerification,
  termsHref,
  privacyHref,
  defaultValues,
}: AuthSignupFormProps) {
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [email, setEmail] = useState(defaultValues?.email ?? "");
  const [password, setPassword] = useState(defaultValues?.password ?? "");
  const [confirm, setConfirm] = useState(defaultValues?.confirmPassword ?? "");
  const [accepted, setAccepted] = useState(defaultValues?.acceptedTerms ?? false);
  const [tried, setTried] = useState(false);

  const vState = emailVerification?.state;
  const emailSyntaxValid = EMAIL_RE.test(email.trim());
  const verified = !emailVerification || vState === "verified";
  const showCode = vState === "code" || vState === "checking" || vState === "error";

  const nameError =
    !tried && name.length === 0
      ? null
      : !name.trim()
        ? "Full name is required."
        : name.trim().length < 2
          ? "Full name must be at least 2 characters."
          : null;
  const emailError =
    !tried && email.length === 0 ? null : !email.trim() ? "Email is required." : !emailSyntaxValid ? "Enter a valid email address." : null;
  const verifyError = tried && emailSyntaxValid && !verified ? "Please verify your email before signing up." : null;
  const passwordError = !tried && password.length === 0 ? null : password.length < 8 ? "Password must be at least 8 characters." : null;
  const confirmError =
    !tried && confirm.length === 0 ? null : !confirm ? "Please confirm your password." : password !== confirm ? "Passwords do not match." : null;
  const termsError = tried && !accepted ? "You must accept the terms to continue." : null;
  const strength = passwordStrength(password);
  const matched = confirm.length > 0 && password === confirm;

  const valid =
    !nameError && !emailError && !passwordError && !confirmError && !termsError &&
    !!name.trim() && !!email.trim() && password.length >= 8 && verified;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTried(true);
    if (!valid) return;
    onSubmit({ name: name.trim(), email: email.trim(), password, confirmPassword: confirm, acceptedTerms: accepted });
  };

  // Email adornment: Verify action (syntax-valid, idle) or Verified badge.
  const emailAdornment = !emailVerification ? null : vState === "verified" ? (
    <AuthBadge tone="success">
      <CheckCircle2 className="size-3" aria-hidden />
      Verified
    </AuthBadge>
  ) : emailSyntaxValid && (vState === "idle" || vState === "sending") ? (
    <button
      type="button"
      onClick={() => emailVerification.onRequest(email.trim())}
      disabled={submitting || vState === "sending"}
      className={
        "text-micro " +
        "focus-ring rounded-md border border-feedback-success/45 bg-feedback-success/12 px-2 py-0.5 font-semibold uppercase tracking-wider text-feedback-success transition-colors duration-normal hover:bg-feedback-success/20 active:bg-feedback-success/30"
      }
    >
      {vState === "sending" ? <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-label="Sending code" /> : "Verify"}
    </button>
  ) : null;

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <AuthField
        id="auth-signup-name"
        label="Full name"
        labelVariant="soft"
        autoComplete="name"
        placeholder="Enter your full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={nameError}
        disabled={submitting}
      />

      {/* Email ↔ code: v2 cross-fades the two layers in place (300 ms, 4px). */}
      <div className="relative">
        <div
          className={cn(
            "transition-[opacity,transform] duration-slow ease-out motion-reduce:transition-none",
            showCode ? "pointer-events-none absolute inset-x-0 top-0 -translate-y-1 opacity-0" : "translate-y-0 opacity-100",
          )}
          aria-hidden={showCode}
        >
          <AuthField
            id="auth-signup-email"
            label="Email"
            labelVariant="soft"
            type="email"
            autoComplete="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (vState === "verified") emailVerification?.onChangeEmail();
            }}
            error={emailError ?? verifyError}
            tone={vState === "verified" ? "success" : "neutral"}
            adornment={emailAdornment}
            hint={
              vState === "verified" ? (
                <button
                  type="button"
                  onClick={() => {
                    setEmail("");
                    emailVerification?.onChangeEmail();
                  }}
                  disabled={submitting}
                  className="focus-ring rounded-sm text-label-sm font-medium text-brand-primary hover:underline"
                >
                  Use a different email
                </button>
              ) : null
            }
            disabled={submitting || showCode}
          />
        </div>
        {emailVerification ? (
          <div
            className={cn(
              "transition-[opacity,transform] duration-slow ease-out motion-reduce:transition-none",
              showCode ? "translate-y-0 opacity-100" : "pointer-events-none absolute inset-x-0 top-0 translate-y-1 opacity-0",
            )}
            aria-hidden={!showCode}
          >
            {showCode ? <OtpBoxes verification={emailVerification} email={email.trim()} disabled={submitting} /> : null}
          </div>
        ) : null}
      </div>

      <AuthField
        id="auth-signup-password"
        label="Password"
        labelVariant="soft"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={passwordError}
        tone={password.length > 0 ? strength.tone : "neutral"}
        adornment={password.length > 0 ? <AuthBadge tone={strength.tone}>{strength.label}</AuthBadge> : null}
        revealable
        disabled={submitting}
      />
      <AuthField
        id="auth-signup-confirm-password"
        label="Confirm password"
        labelVariant="soft"
        type="password"
        autoComplete="new-password"
        placeholder="Re-enter your password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={confirmError}
        tone={confirm.length > 0 ? (matched ? "success" : "warning") : "neutral"}
        adornment={
          confirm.length > 0 ? <AuthBadge tone={matched ? "success" : "warning"}>{matched ? "Matched" : "Yet to match"}</AuthBadge> : null
        }
        revealable
        disabled={submitting}
      />

      <div className="space-y-1.5">
        <AuthCheckbox checked={accepted} onChange={setAccepted} disabled={submitting}>
          <TermsText termsHref={termsHref} privacyHref={privacyHref} />
        </AuthCheckbox>
        {termsError ? <p className="text-caption text-feedback-error">{termsError}</p> : null}
      </div>

      {error ? <AuthErrorBanner>{error}</AuthErrorBanner> : null}

      <AuthSubmitButton disabled={submitting || !valid}>
        {submitting ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
            Creating account...
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="size-4" aria-hidden />
            Create account
          </span>
        )}
      </AuthSubmitButton>

      <AuthSwitchLine prompt="Already have an account?" action="Sign in" onClick={onSwitchToLogin} disabled={submitting} />
    </form>
  );
}
