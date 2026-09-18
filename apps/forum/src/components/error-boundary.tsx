"use client";

/**
 * ErrorBoundary — CONTRACT-1-app-shell §1/§6 (CAP-025/026): "Provider
 * mount order is the contract: ... ErrorBoundary ... → CMP slot (M18) →
 * BetaBanner → children" and "ErrorBoundary sits ABOVE the CMP slot"
 * (CAP-026, FATAL-M1C-03) so a CMP runtime crash is contained (CAP-028:
 * "designed degrade, not a bug — app stays up, analytics denied, legal
 * pages still reachable").
 *
 * Next.js route-segment `error.tsx` boundaries do NOT catch errors thrown
 * by that same segment's own `layout.tsx` — only by its page/children —
 * so a throw inside the CMP slot mounted in `(app)/layout.tsx` would
 * otherwise bubble all the way to `global-error.tsx` and take the entire
 * app down. This is a plain React class boundary (the only mechanism that
 * can catch a *sibling* render error without unmounting the rest of the
 * tree) wrapped narrowly around that one slot.
 *
 * Fallback UI is register-silent (contract Open Question 3) — rendering
 * null (nothing) is the smallest, least-invented choice: the degrade is
 * "analytics denied," not "show an error message" for a background
 * consent widget the visitor never asked to see.
 */

import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    console.error("ErrorBoundary contained a render error (CAP-026):", error);
  }

  render(): ReactNode {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}
