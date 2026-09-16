"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { AuthContextProvider, type AuthContextValue } from "./auth-context";
import type { AuthMode, LoginPayload, SignupPayload, SocialAuthProvider } from "./types";

const OFFLINE_SUBMIT_HINT =
  "Set NEXT_PUBLIC_CONVEX_URL in this app’s .env.local (and run Convex) to sign in.";

export function OfflineAuthProvider({
  children,
  requireAuth = false,
}: {
  children: ReactNode;
  requireAuth?: boolean;
}) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(requireAuth);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authError, setAuthError] = useState<string | null>(null);

  const openAuthModal = useCallback((mode: AuthMode = "login") => {
    setAuthMode(mode);
    setAuthError(null);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    if (requireAuth) return;
    setIsAuthModalOpen(false);
    setAuthError(null);
  }, [requireAuth]);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const rejectSignIn = useCallback(async () => {
    setAuthError(OFFLINE_SUBMIT_HINT);
  }, []);

  const socialLogin = useCallback(async (_provider: SocialAuthProvider) => {
    setAuthError(OFFLINE_SUBMIT_HINT);
  }, []);

  const logout = useCallback(async () => {
    setAuthError(null);
    if (!requireAuth) {
      setIsAuthModalOpen(false);
    }
  }, [requireAuth]);

  const login = useCallback(async (_payload: LoginPayload) => {
    await rejectSignIn();
  }, [rejectSignIn]);

  const signup = useCallback(async (_payload: SignupPayload) => {
    await rejectSignIn();
  }, [rejectSignIn]);

  const value = useMemo<AuthContextValue>(
    () => ({
      authStatus: "anonymous",
      user: null,
      authEnvironmentNote: null,
      isAuthModalOpen,
      authMode,
      isSubmitting: false,
      authError,
      authRequired: requireAuth,
      openAuthModal,
      closeAuthModal,
      clearAuthError,
      login,
      signup,
      socialLogin,
      logout,
    }),
    [
      isAuthModalOpen,
      authMode,
      authError,
      requireAuth,
      openAuthModal,
      closeAuthModal,
      clearAuthError,
      login,
      signup,
      socialLogin,
      logout,
    ],
  );

  return <AuthContextProvider value={value}>{children}</AuthContextProvider>;
}
