"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { useCallback, useMemo, useState, type ReactNode } from "react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { AuthContextProvider, useAuthContext, type AuthContextValue } from "./auth-context";
import type { AuthMode, AuthStatus, AuthUser, LoginPayload, SignupPayload, SocialAuthProvider } from "./types";

type ProfileView = {
  _id: Id<"users">;
  name?: string;
  email?: string;
  image?: string;
  handle?: string;
  memberships: Array<{
    _id: Id<"memberships">;
    app: "forum" | "seller" | "admin" | "marketplace";
    role: string;
  }>;
};

function forumRoleFromMemberships(
  memberships: { app: "forum" | "seller" | "admin" | "marketplace"; role: string }[],
): AuthUser["role"] {
  const forum = memberships.filter((m) => m.app === "forum");
  if (forum.some((m) => m.role === "admin")) {
    return "admin";
  }
  if (forum.some((m) => m.role === "moderator")) {
    return "moderator";
  }
  return "member";
}

function mapProfileToUser(profile: ProfileView): AuthUser {
  const email = profile.email ?? "";
  const handle =
    profile.handle?.trim() ||
    (email.includes("@") ? email.split("@")[0] : "member") ||
    "member";
  const name = profile.name?.trim() || handle;

  return {
    id: profile._id,
    name,
    handle,
    email,
    avatar: profile.image ?? undefined,
    role: forumRoleFromMemberships(profile.memberships),
  };
}

export function AppAuthProvider({ children }: { children: ReactNode }) {
  const { isLoading: convexLoading, isAuthenticated } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const profile = useQuery(api.profile.current, isAuthenticated ? {} : "skip");

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const authLoading = convexLoading || (isAuthenticated && profile === undefined);

  const authStatus: AuthStatus = authLoading
    ? "loading"
    : isAuthenticated && profile
      ? "authenticated"
      : "anonymous";

  const user: AuthUser | null =
    isAuthenticated && profile ? mapProfileToUser(profile) : null;

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

  const login = useCallback(
    async (payload: LoginPayload) => {
      setIsSubmitting(true);
      setAuthError(null);
      try {
        await signIn("password", {
          flow: "signIn",
          email: payload.email.trim().toLowerCase(),
          password: payload.password,
        });
        closeAuthModal();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Sign in failed.";
        setAuthError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [signIn, closeAuthModal],
  );

  const signup = useCallback(
    async (payload: SignupPayload) => {
      setIsSubmitting(true);
      setAuthError(null);
      try {
        await signIn("password", {
          flow: "signUp",
          email: payload.email.trim().toLowerCase(),
          password: payload.password,
          name: payload.name.trim(),
        });
        closeAuthModal();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not create account.";
        setAuthError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [signIn, closeAuthModal],
  );

  const socialLogin = useCallback(
    async (provider: SocialAuthProvider) => {
      setIsSubmitting(true);
      setAuthError(null);
      try {
        const redirectTo =
          typeof window !== "undefined" ? window.location.href : undefined;
        await signIn(provider, redirectTo ? { redirectTo } : {});
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not start sign-in.";
        setAuthError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [signIn],
  );

  const logout = useCallback(async () => {
    setAuthError(null);
    await signOut();
    setIsAuthModalOpen(false);
  }, [signOut]);

  const value = useMemo<AuthContextValue>(
    () => ({
      authStatus,
      user,
      authEnvironmentNote: null,
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
    [
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
    ],
  );

  return <AuthContextProvider value={value}>{children}</AuthContextProvider>;
}

export function useAppAuth() {
  return useAuthContext();
}

/** @deprecated Use useAppAuth — alias kept for forum compatibility */
export const useAuth = useAppAuth;
