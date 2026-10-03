/**
 * /lab/auth fixtures — LAB ONLY. No credentials are real; nothing is sent.
 */
import type { AuthMode, LoginValues, SignupValues } from "@/components/auth/auth-display-types";

/** The lab's email-code step accepts this code; anything else shows the error state. */
export const LAB_CODE = "123456";

/** Server-error copy shown for `state=error` (and after a lab submit). */
export const labErrors: Record<AuthMode, string> = {
  login: "That email and password don't match. Try again.",
  signup: "An account with this email already exists. Sign in instead.",
};

/** Prefill for the error/loading states so the form looks mid-flow. */
export const labPrefill: { login: Partial<LoginValues>; signup: Partial<SignupValues> } = {
  login: { email: "maya@example.com", password: "creatorpass1" },
  signup: {
    name: "Maya Chen",
    email: "maya@example.com",
    password: "Creator-pass-2026",
    confirmPassword: "Creator-pass-2026",
    acceptedTerms: true,
  },
};
