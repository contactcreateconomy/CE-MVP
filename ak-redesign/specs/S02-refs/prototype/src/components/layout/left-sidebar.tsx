"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Briefcase,
  GitCompare,
  HelpCircle,
  Home,
  LayoutList,
  Newspaper,
  Rocket,
  Sparkles,
  Star,
  Swords,
  type LucideIcon,
} from "lucide-react";

import { getCategories } from "@/lib/adapters/content";
import type { CategoryKey } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { cn } from "@/lib/utils";

const categoryIconMap: Record<CategoryKey, LucideIcon> = {
  news: Newspaper,
  review: Star,
  compare: GitCompare,
  "launch-pad": Rocket,
  debate: Swords,
  help: HelpCircle,
  list: LayoutList,
  showcase: Sparkles,
  gigs: Briefcase,
};

export function LeftSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categories = getCategories();
  const selectedCategory = searchParams.get("category");

  const discoverItems = [
    { key: "home", label: "Home", href: "/feed", Icon: Home },
    ...categories.map((category) => ({
      key: category.key,
      label: category.name,
      href: `/feed?category=${category.key}`,
      Icon: categoryIconMap[category.key],
    })),
  ];

  const activeKey = selectedCategory && discoverItems.some((item) => item.key === selectedCategory) ? selectedCategory : "home";
  const activeIndex = discoverItems.findIndex((item) => item.key === activeKey);

  const itemHeight = 40;
  const itemGap = 4;
  const indicatorTop = activeIndex * (itemHeight + itemGap);

  return (
    <aside className="sticky top-[5rem] hidden h-fit w-[240px] shrink-0 space-y-4 lg:block">
      <Card className="animate-soft-float overflow-hidden">
        <CardContent className="p-3">
          <div className="relative rounded-full">
            <GlowingEffect
              spread={34}
              glow
              disabled={false}
              proximity={56}
              inactiveZone={0.15}
              borderWidth={2}
              movementDuration={0.65}
            />
            <Button
              onClick={() => router.push("/new-post")}
              className="relative z-10 h-9 w-full rounded-full text-base font-semibold !text-black shadow-[0_8px_24px_rgba(14,165,233,0.28)] transition-all duration-300 hover:shadow-[0_10px_28px_rgba(14,165,233,0.35)]"
            >
              + Start Discussion
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="animate-soft-float" style={{ animationDelay: "60ms" }}>
        <CardHeader>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Discover</h2>
        </CardHeader>

        <CardContent className="relative p-3 pt-0">
          <div className="relative space-y-1 rounded-[14px]">
            <div
              className="pointer-events-none absolute left-0 right-0 rounded-full border border-[var(--border-active)]/70 bg-transparent transition-all duration-300 ease-out dark:shadow-[0_0_12px_rgba(14,165,233,0.22)]"
              style={{
                top: `${indicatorTop}px`,
                height: `${itemHeight}px`,
              }}
            />

            {discoverItems.map(({ key, label, href, Icon }) => {
              const isActive = key === activeKey;

              return (
                <Link
                  key={key}
                  href={href}
                  className={cn(
                    "relative z-10 flex h-10 w-full items-center gap-2.5 rounded-full px-3 text-sm font-semibold transition-colors duration-200",
                    isActive
                      ? "text-[var(--brand-primary)]"
                      : "text-[var(--text-primary)] hover:bg-[var(--bg-overlay)]/55 hover:text-[var(--brand-primary)] dark:hover:text-[var(--brand-primary-hover)] dark:hover:drop-shadow-[0_0_8px_rgba(14,165,233,0.35)]",
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive && "scale-105")} strokeWidth={2.5} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

    </aside>
  );
}
