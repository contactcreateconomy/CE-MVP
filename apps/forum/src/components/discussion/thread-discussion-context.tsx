"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface ThreadDiscussionContextValue {
  mainComposerText: string;
  setMainComposerText: (value: string | ((prev: string) => string)) => void;
  prependMainComposer: (line: string) => void;
  focusMainComposer: () => void;
  showcaseMediaPinMode: boolean;
  setShowcaseMediaPinMode: (value: boolean) => void;
  /** Percent coords "x,y" to pulse on the showcase hero */
  mediaHighlightCoords: string | null;
  setMediaHighlightCoords: (value: string | null) => void;
}

const ThreadDiscussionContext = createContext<ThreadDiscussionContextValue | null>(null);

export function ThreadDiscussionProvider({ children }: { children: ReactNode }) {
  const [mainComposerText, setMainComposerText] = useState("");
  const [showcaseMediaPinMode, setShowcaseMediaPinMode] = useState(false);
  const [mediaHighlightCoords, setMediaHighlightCoords] = useState<string | null>(null);

  const prependMainComposer = useCallback((line: string) => {
    setMainComposerText((t) => (t.trim() ? `${t.trimEnd()}\n${line}` : line));
  }, []);

  const focusMainComposer = useCallback(() => {
    document.getElementById("thread-main-composer")?.scrollIntoView({ behavior: "smooth", block: "center" });
    document.getElementById("main-composer-textarea")?.focus();
  }, []);

  const value = useMemo(
    () => ({
      mainComposerText,
      setMainComposerText,
      prependMainComposer,
      focusMainComposer,
      showcaseMediaPinMode,
      setShowcaseMediaPinMode,
      mediaHighlightCoords,
      setMediaHighlightCoords,
    }),
    [mainComposerText, prependMainComposer, focusMainComposer, showcaseMediaPinMode, mediaHighlightCoords],
  );

  return <ThreadDiscussionContext.Provider value={value}>{children}</ThreadDiscussionContext.Provider>;
}

export function useThreadDiscussion() {
  const ctx = useContext(ThreadDiscussionContext);
  if (!ctx) {
    throw new Error("useThreadDiscussion must be used within ThreadDiscussionProvider");
  }
  return ctx;
}
