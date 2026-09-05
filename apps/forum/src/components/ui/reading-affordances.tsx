"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * Reading affordances (C — reusable infrastructure, product-fit review 2026-08-31).
 * Extracted from the /content design sandbox (content-page.tsx) into the shared
 * library per founder disposition of E-bucket items.
 *
 * Top reading-progress strip: shows once >=2% scrolled, sticky under the header.
 * Offsets assume the standard app header (3.5rem) + thread-mode bar (2.75rem).
 */
export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function handleScroll() {
      const el = document.documentElement;
      const scrollTop = el.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      setProgress(scrollHeight > 0 ? Math.min((scrollTop / scrollHeight) * 100, 100) : 0);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (progress < 2) return null;

  return (
    <div className="sticky top-(--chrome-offset-progress) z-20 h-0.5 bg-(--border-subtle)">
      <div
        className="h-full bg-(--brand-primary) transition-[width] duration-emerge ease-out-cubic"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

/**
 * Scroll-to-top FAB: appears after 600px scroll, smooth-scrolls to top.
 * Bottom offset clears the mobile tab bar (bottom-20) / desktop (bottom-8).
 */
export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 600);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-20 lg:bottom-8 right-6 z-40 h-9 w-9 rounded-full bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-prominent)] transition-all animate-soft-float-up"
      aria-label="Scroll to top"
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  );
}
