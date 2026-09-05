"use client";

import { useState } from "react";
import { ContentPage } from "@/components/content/content-page";
import type { SeedComment, SeedThread } from "./_seed";
import { seedThread, seedComments } from "./_seed";

interface ContentPageClientProps {
  mode: "max" | "minimal";
  thread?: SeedThread;
  comments?: SeedComment[];
}

export function ContentPageClient({
  mode: initialMode,
  thread = seedThread,
  comments = seedComments,
}: ContentPageClientProps) {
  const [mode, setMode] = useState<"max" | "minimal">(initialMode);

  return (
    <ContentPage
      mode={mode}
      thread={thread}
      comments={comments}
      onModeChange={setMode}
    />
  );
}
