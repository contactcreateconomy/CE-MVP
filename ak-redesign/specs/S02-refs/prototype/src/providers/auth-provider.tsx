"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import type { AuthMode, AuthStatus, AuthUser, LoginPayload, SignupPayload, SocialAuthProvider } from "@/types";

interface AuthContextValue {
  authStatus: AuthStatus;
  user: AuthUser | null;
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
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const mockUsersByEmail: Record<string, AuthUser> = {
  "akile@createconomy.app": {
    id: "u1",
    name: "Akile",
    handle: "akile",
    email: "akile@createconomy.app",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80",
    role: "member",
  },
  devtest: {
    id: "devtest-u1",
    name: "Dev Tester",
    handle: "devtest",
    email: "devtest@createconomy.local",
    avatar: "https://images.unsplash.com/photo-1557862921-37829c790f19?auto=format&fit=crop&w=240&q=80",
    role: "member",
  },
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function deriveHandle(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "creator";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("anonymous");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const openAuthModal = useCallback((mode: AuthMode = "login") => {
    setAuthMode(mode);
    setAuthError(null);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setAuthError(null);
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const completeLogin = useCallback((resolvedUser: AuthUser) => {
    setUser(resolvedUser);
    setAuthStatus("authenticated");
    setAuthError(null);
    setIsAuthModalOpen(false);
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      setIsSubmitting(true);
      setAuthError(null);

      await sleep(800);

      const normalizedEmail = payload.email.trim().toLowerCase();
      const resolvedUser = mockUsersByEmail[normalizedEmail];
      const isPasswordAccepted =
        (normalizedEmail === "devtest" && payload.password === "123456") || payload.password.length >= 8;

      if (!resolvedUser || !isPasswordAccepted) {
        setIsSubmitting(false);
        setAuthError("Login failed. Invalid credentials.");
        return;
      }

      completeLogin(resolvedUser);
      setIsSubmitting(false);
    },
    [completeLogin],
  );

  const signup = useCallback(
    async (payload: SignupPayload) => {
      setIsSubmitting(true);
      setAuthError(null);

      await sleep(900);

      const email = payload.email.trim().toLowerCase();
      const existing = mockUsersByEmail[email];

      if (existing) {
        setIsSubmitting(false);
        setAuthError("An account already exists for this email.");
        return;
      }

      const createdUser: AuthUser = {
        id: `mock-${Date.now()}`,
        name: payload.name.trim(),
        handle: deriveHandle(payload.name),
        email,
        role: "member",
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.name.trim())}&background=0D8ABC&color=fff`,
      };

      completeLogin(createdUser);
      setIsSubmitting(false);
    },
    [completeLogin],
  );

  const socialLogin = useCallback(
    async (provider: SocialAuthProvider) => {
      setIsSubmitting(true);
      setAuthError(null);

      await sleep(700);

      const socialUser: AuthUser = {
        id: `social-${provider}`,
        name:
          provider === "github"
            ? "GitHub Creator"
            : provider === "facebook"
              ? "Facebook Creator"
              : "Google Creator",
        handle: provider === "github" ? "github-creator" : provider === "facebook" ? "facebook-creator" : "google-creator",
        email: `${provider}.creator@createconomy.app`,
        role: "member",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80",
      };

      completeLogin(socialUser);
      setIsSubmitting(false);
    },
    [completeLogin],
  );

  const logout = useCallback(() => {
    setAuthStatus("anonymous");
    setUser(null);
    setAuthError(null);
    setAuthMode("login");
    setIsAuthModalOpen(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      authStatus,
      user,
      isAuthModalOpen,
      authMode,
      isSubmitting,
      authError,
      openAuthModal,
      closeAuthModal,
      clearAuthError,
      login,
      signup,
      socialLogin,
      logout,
    }),
    [authStatus, user, isAuthModalOpen, authMode, isSubmitting, authError, openAuthModal, closeAuthModal, clearAuthError, login, signup, socialLogin, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
