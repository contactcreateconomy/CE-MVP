"use client";

import { usePathname } from "next/navigation";

import { LeftSidebar } from "@/components/layout/left-sidebar";

/** /feed brings its own left rail (FeedPageView — FEED-U2); other shell routes keep the shell's. */
export function ConditionalLeftSidebar() {
  const pathname = usePathname();
  if (pathname === "/feed") return null;
  return <LeftSidebar />;
}
