"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MOCK_CATEGORIES, MOCK_CAMPAIGN } from "@/lib/mock-data";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";
import type { CategorySlug } from "@/lib/types";

interface LeftSidebarProps {
  activeCategory: CategorySlug | null;
  onCategoryChange: (slug: CategorySlug | null) => void;
}

export function LeftSidebar({ activeCategory, onCategoryChange }: LeftSidebarProps) {
  const discoverCategories = MOCK_CATEGORIES.filter((c) => !c.isPremium);
  const premiumCategories = MOCK_CATEGORIES.filter((c) => c.isPremium);

  return (
    <aside
      className="flex flex-col gap-4"
      aria-label="Sidebar navigation"
    >
      {/* Start Discussion CTA */}
      <Button
        className="w-full gap-2 glow-primary hover:glow-primary-strong transition-shadow duration-200 h-11"
        size="lg"
        aria-label="Start a new discussion"
      >
        <Plus className="h-4 w-4" />
        Start Discussion
      </Button>

      {/* Categories */}
      <Card className="overflow-hidden">
        <CardContent className="p-2">
          {/* DISCOVER */}
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Discover
          </p>
          <motion.nav
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            aria-label="Discussion categories"
          >
            {discoverCategories.map((cat) => (
              <motion.button
                key={cat.slug}
                variants={fadeInUp}
                onClick={() =>
                  onCategoryChange(activeCategory === cat.slug ? null : cat.slug)
                }
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 text-left",
                  activeCategory === cat.slug
                    ? "bg-primary/10 text-primary border-l-2 border-primary glow-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                aria-current={activeCategory === cat.slug ? "page" : undefined}
              >
                <span className="text-base">{cat.icon}</span>
                <span className="flex-1 font-medium">{cat.label}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {cat.count}
                </span>
              </motion.button>
            ))}
          </motion.nav>

          <Separator className="my-2" />

          {/* PREMIUM */}
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Premium
          </p>
          {premiumCategories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() =>
                onCategoryChange(activeCategory === cat.slug ? null : cat.slug)
              }
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 text-left",
                activeCategory === cat.slug
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <span className="text-base">{cat.icon}</span>
              <span className="flex-1 font-medium">{cat.label}</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                {cat.pointsRequired}
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Active Campaign */}
      <Card
        className={cn(
          "overflow-hidden bg-gradient-to-br",
          MOCK_CAMPAIGN.gradient
        )}
      >
        <CardContent className="p-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
            Active Campaign
          </p>
          <h3 className="mt-1 text-base font-bold">{MOCK_CAMPAIGN.title}</h3>
          <p className="mt-1 text-sm text-white/80">
            {MOCK_CAMPAIGN.description}
          </p>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="font-semibold">
              {MOCK_CAMPAIGN.daysLeft} days left
            </span>
            <span className="text-white/70">
              {MOCK_CAMPAIGN.totalEntries}/{MOCK_CAMPAIGN.maxEntries}
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 w-full rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{
                width: `${(MOCK_CAMPAIGN.totalEntries / MOCK_CAMPAIGN.maxEntries) * 100}%`,
              }}
            />
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
