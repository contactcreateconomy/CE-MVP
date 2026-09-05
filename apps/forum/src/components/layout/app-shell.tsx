import type { ReactNode } from "react";
import { Suspense } from "react";
import Link from "next/link";

import { TopPostHeroSection } from "@/components/layout/top-post-hero-section";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { ConditionalRightSidebar } from "@/components/layout/conditional-right-sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative min-h-screen bg-(--bg-canvas) text-(--text-primary)">
      <div className="canvas-dot-grid pointer-events-none absolute inset-0" />
      <div className="relative z-10">
        <TopNav />

        <section className="mx-auto hidden w-full max-w-[1440px] px-4 pb-2 pt-6 md:px-6 lg:block lg:px-8">
          <TopPostHeroSection />
        </section>

        <div className="mx-auto flex w-full max-w-[1440px] gap-4 px-4 py-6 md:px-6 lg:gap-8 lg:px-8">
          <Suspense fallback={null}>
            <LeftSidebar />
          </Suspense>
          <main className="min-w-0 flex-1 pb-24 lg:pb-8">{children}</main>
          <ConditionalRightSidebar />
        </div>
        <footer className="relative z-10 mx-auto w-full max-w-[1440px] px-4 py-3 pb-[calc(5rem+env(safe-area-inset-bottom))] md:px-6 lg:px-8 lg:pb-3">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-xs text-(--text-muted)">
            <Link href="/terms" className="underline-offset-2 hover:text-(--text-secondary) hover:underline">
              Terms
            </Link>
            <span className="text-(--border-subtle)" aria-hidden>
              ·
            </span>
            <Link href="/privacy" className="underline-offset-2 hover:text-(--text-secondary) hover:underline">
              Privacy
            </Link>
          </div>
        </footer>
        <MobileTabBar />
      </div>
    </div>
  );
}
