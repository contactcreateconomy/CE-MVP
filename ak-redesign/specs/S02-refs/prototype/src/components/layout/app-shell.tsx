import type { ReactNode } from "react";
import { Suspense } from "react";

import { TopPostHeroCarousel } from "@/components/feed/top-post-hero-carousel";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { RightSidebar } from "@/components/layout/right-sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { getTopPostHeroSlides } from "@/lib/adapters/content";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const topPostHeroSlides = getTopPostHeroSlides();

  return (
    <div className="relative min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <div className="canvas-dot-grid pointer-events-none absolute inset-0" />
      <div className="relative z-10">
        <TopNav />

        <section className="mx-auto hidden w-full max-w-[1440px] px-4 pb-2 pt-6 md:px-6 lg:block lg:px-8">
          <TopPostHeroCarousel slides={topPostHeroSlides} className="h-[380px] xl:h-[420px]" />
        </section>

        <div className="mx-auto flex w-full max-w-[1440px] gap-4 px-4 py-6 md:px-6 lg:gap-8 lg:px-8">
          <Suspense fallback={null}>
            <LeftSidebar />
          </Suspense>
          <main className="min-w-0 flex-1 pb-24 lg:pb-8">{children}</main>
          <RightSidebar />
        </div>
        <MobileTabBar />
      </div>
    </div>
  );
}
