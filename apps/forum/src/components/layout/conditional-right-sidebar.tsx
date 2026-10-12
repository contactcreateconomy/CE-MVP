"use client";

import { usePathname } from "next/navigation";

import { RightSidebar } from "@/components/layout/right-sidebar";

export function ConditionalRightSidebar() {
  const pathname = usePathname();
  // /feed brings its own rail (FeedPageView — FEED-U2).
  if (pathname === "/feed" || pathname?.startsWith("/discussions/")) {
    return null;
  }
  return <RightSidebar />;
}
