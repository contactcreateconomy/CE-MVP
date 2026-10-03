/**
 * S01 auth modal display-component props (D-016: props in, UI out — no
 * auth calls). prototype-v2 `packages/auth-ui` is the visual reference.
 * The wiring (GLM) maps these callbacks onto `@convex-dev/auth` signIn.
 * Field values and client-side validation live inside the forms (pure UI
 * state); everything the server decides comes in through props.
 */

export type AuthMode = "login" | "signup";

/** Providers configured in convex/auth.ts (Password + these OAuth ones). */
export type AuthSocialProvider = "google" | "github" | "facebook";

export interface LoginValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface SignupValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

/**
 * Optional email-ownership step before sign-up (v2's inline "Verify" + 6-digit
 * code). SCOPE — absent → the step is not rendered and not required.
 */
export type EmailVerifyState = "idle" | "sending" | "code" | "checking" | "error" | "verified";

export interface EmailVerification {
  state: EmailVerifyState;
  /** Shown under the code boxes when state = "error". */
  error?: string | null;
  onRequest: (email: string) => void;
  onSubmitCode: (code: string) => void;
  onResend: () => void;
  onChangeEmail: () => void;
}
