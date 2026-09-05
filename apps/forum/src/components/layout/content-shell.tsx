"use client";

import type { ReactNode } from "react";

import { TopNav } from "@/components/layout/top-nav";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";

interface ContentShellProps {
  children: ReactNode;
}

export function ContentShell({ children }: ContentShellProps) {
  return (
    <div className="relative min-h-screen bg-(--bg-canvas) text-(--text-primary)">
      <div className="canvas-dot-grid pointer-events-none absolute inset-0" />
      <div className="relative z-10">
        <TopNav />
        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-6 lg:px-8 pb-24 lg:pb-8">
          {children}
        </main>
        <MobileTabBar />
      </div>
    </div>
  );
}
