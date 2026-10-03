"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";

type NavigationState = "idle" | "loading" | "complete";

const NavigationProgressContext = createContext<NavigationState>("idle");

let _setNavigating: ((state: boolean) => void) | null = null;

export function signalNavigationStart() {
  _setNavigating?.(true);
}

export function NavigationProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<NavigationState>("idle");
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setNavigating = useCallback((loading: boolean) => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (loading) {
      setState("loading");
    } else {
      setState("complete");
      timeoutRef.current = setTimeout(() => setState("idle"), 400);
    }
  }, []);

  // Expose setter for imperative navigation
  useEffect(() => {
    _setNavigating = setNavigating;
    return () => {
      _setNavigating = null;
    };
  }, [setNavigating]);

  // Detect navigation complete via pathname change
  useEffect(() => {
    if (state === "loading" && prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      setNavigating(false);
    }
  }, [pathname, state, setNavigating]);

  // Track pathname for future comparisons
  useEffect(() => {
    prevPathRef.current = pathname;
  }, [pathname]);

  // Detect navigation start via link clicks
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;

      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Skip external, blank, download, hash-only, and mailto/tel links
      if (
        target.hasAttribute("download") ||
        target.target === "_blank" ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      ) {
        return;
      }

      // Skip external URLs
      if (href.startsWith("http://") || href.startsWith("https://")) {
        try {
          const url = new URL(href, window.location.origin);
          if (url.origin !== window.location.origin) return;
        } catch {
          return;
        }
      }

      // Skip hash-only links on same page
      if (href.startsWith("#")) return;

      // Resolve the pathname from the href
      try {
        const url = new URL(href, window.location.origin);
        if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      } catch {
        // If we can't parse it, let it through
      }

      setNavigating(true);
    }

    document.addEventListener("mousedown", handleClick, true);
    return () => document.removeEventListener("mousedown", handleClick, true);
  }, [setNavigating]);

  // Detect browser back/forward
  useEffect(() => {
    function handlePopState() {
      setNavigating(true);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [setNavigating]);

  return (
    <NavigationProgressContext.Provider value={state}>
      {children}
    </NavigationProgressContext.Provider>
  );
}

export function useNavigationState() {
  return useContext(NavigationProgressContext);
}
