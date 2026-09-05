"use client";

import { usePathname } from "next/navigation";

import { RightSidebar } from "@/components/layout/right-sidebar";

export function ConditionalRightSidebar() {
  const pathname = usePathname();
  if (pathname?.startsWith("/discussions/")) {
    return null;
  }
  return <RightSidebar />;
}
