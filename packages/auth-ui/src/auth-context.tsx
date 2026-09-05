"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { AuthMode, AuthStatus, AuthUser, LoginPayload, SignupPayload, SocialAuthProvider } from "./types";

export interface AuthContextValue {
  authStatus: AuthStatus;
  user: AuthUser | null;
  /** Shown inside the auth dialog when sign-in cannot reach Convex (e.g. missing env). */
  authEnvironmentNote: string | null;
  isAuthModalOpen: boolean;
  authMode: AuthMode;
  isSubmitting: boolean;
  authError: string | null;
  openAuthModal: (mode?: AuthMode) => void;
  closeAuthModal: () => void;
  clearAuthError: () => void;
  login: (payload: LoginPayload) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  socialLogin: (provider: SocialAuthProvider) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAppAuth must be used within AppAuthProvider or OfflineAuthProvider");
  }
  return context;
}

export function AuthContextProvider({
  value,
  children,
}: {
  value: AuthContextValue;
  children: ReactNode;
}) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
