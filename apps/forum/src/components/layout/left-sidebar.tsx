"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signalNavigationStart } from "@/providers/navigation-progress-provider";
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
  Zap,
  type LucideIcon,
} from "lucide-react";

import { isConvexConfigured } from "@cemvp/convex-client";
import { useSharedData } from "@/providers/shared-data-context";
import { ACTIVE_CATEGORY_KEYS, type CategoryKey } from "@/types";
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
  qa: HelpCircle,
  spark: Zap,
  list: LayoutList,
  showcase: Sparkles,
  gigs: Briefcase,
};

type DiscoverItem = { key: string; label: string; href: string; Icon: LucideIcon };

function LeftSidebarShell({ discoverItems }: { discoverItems: DiscoverItem[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedCategory = searchParams.get("category");

  const activeKey =
    selectedCategory && discoverItems.some((item) => item.key === selectedCategory) ? selectedCategory : "home";
  const activeIndex = Math.max(0, discoverItems.findIndex((item) => item.key === activeKey));

  const itemHeight = 40;
  const itemGap = 4;
  const indicatorTop = activeIndex * (itemHeight + itemGap);

  return (
    <aside className="sticky top-20 hidden h-fit w-[240px] shrink-0 space-y-4 lg:block">
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
              onClick={() => { signalNavigationStart(); router.push("/new-post"); }}
              className="relative z-10 h-9 w-full rounded-full text-base font-semibold shadow-glow-primary-pill transition-all duration-slow hover:shadow-glow-primary-pill-hover"
              style={{ color: "var(--text-inverse)" }}
            >
              + Start Discussion
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="animate-soft-float" style={{ animationDelay: "60ms" }}>
        <CardHeader>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Discover</h2>
        </CardHeader>

        <CardContent className="relative p-3 pt-0">
          <nav className="relative space-y-1 rounded-menu" aria-label="Discover categories">
            <div
              className="pointer-events-none absolute left-0 right-0 top-0 rounded-full border border-(--border-active)/70 bg-(--bg-overlay)/55 transition-transform duration-slow ease-out will-change-transform dark:shadow-glow-primary-sm"
              style={{
                transform: `translateY(${indicatorTop}px)`,
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
                    "relative z-10 flex h-10 w-full items-center gap-2.5 rounded-full px-3 text-sm font-semibold transition-all duration-normal",
                    isActive
                      ? "text-(--brand-primary)"
                      : "text-(--text-primary) hover:text-(--brand-primary) hover:drop-shadow-[var(--glow-primary-md)]",
                    "outline-offset-2 focus-visible:ring-2 focus-visible:ring-(--border-active) focus-visible:ring-offset-2 focus-visible:ring-offset-(--bg-surface)",
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", isActive && "scale-105")} strokeWidth={2.5} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </CardContent>
      </Card>
    </aside>
  );
}

function LeftSidebarWithConvex() {
  const { categories } = useSharedData();
  // Post-type nav renders ACTIVE types only (CAP-186): 8 active; launch-pad/gigs stay hidden until the admin DAU flip.
  const activeCategories = categories.filter((c) => ACTIVE_CATEGORY_KEYS.includes(c.key));
  const discoverItems: DiscoverItem[] = [
    { key: "home", label: "Home", href: "/feed", Icon: Home },
    ...activeCategories.map((category) => ({
      key: category.key,
      label: category.name,
      href: `/feed?category=${category.key}`,
      Icon: categoryIconMap[category.key as CategoryKey] ?? LayoutList,
    })),
  ];
  return <LeftSidebarShell discoverItems={discoverItems} />;
}

/** When Convex URL is missing, show Home only — do not call `useQuery` without a ConvexProvider. */
export function LeftSidebar() {
  if (!isConvexConfigured()) {
    return <LeftSidebarShell discoverItems={[{ key: "home", label: "Home", href: "/feed", Icon: Home }]} />;
  }
  return <LeftSidebarWithConvex />;
}
