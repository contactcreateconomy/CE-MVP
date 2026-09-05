export type AuthStatus = "anonymous" | "authenticated" | "loading";

export type AuthMode = "login" | "signup";

export type SocialAuthProvider = "google" | "github" | "facebook";

export interface AuthUser {
  id: string;
  name: string;
  handle: string;
  email: string;
  avatar?: string;
  role: "member" | "moderator" | "admin";
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}
