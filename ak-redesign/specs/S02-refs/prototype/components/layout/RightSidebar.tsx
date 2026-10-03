"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Crown, Medal, TrendingUp, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  MOCK_TRENDING,
  MOCK_LEADERBOARD,
  MOCK_CAMPAIGN,
} from "@/lib/mock-data";
import { morphCard } from "@/lib/animations";
import { cn } from "@/lib/utils";

const MORPH_INTERVAL = 4000;

// ============================================================
// WHATS VIBING — Morphing card stack
// ============================================================
function WhatsVibing() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % MOCK_TRENDING.length);
    }, MORPH_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          What&apos;s Vibing
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="relative h-[140px] overflow-hidden rounded-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={MOCK_TRENDING[current].id}
              variants={morphCard}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className={cn(
                "absolute inset-0 flex flex-col justify-end p-4 rounded-lg bg-gradient-to-br",
                MOCK_TRENDING[current].gradient
              )}
            >
              <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Trending
              </p>
              <h4 className="mt-1 text-base font-bold text-white leading-snug">
                {MOCK_TRENDING[current].title}
              </h4>
              <div className="mt-2 flex items-center gap-1 text-sm text-white/80">
                <TrendingUp className="h-3.5 w-3.5" />
                {MOCK_TRENDING[current].engagement.toLocaleString()} engaged
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 mt-3">
          {MOCK_TRENDING.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                idx === current
                  ? "w-4 bg-primary"
                  : "w-1 bg-muted-foreground/30"
              )}
              aria-label={`Trending topic ${idx + 1}`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// LEADERBOARD
// ============================================================
const RANK_ICONS = [
  <Crown key="crown" className="h-4 w-4 text-amber-500" />,
  <Medal key="silver" className="h-4 w-4 text-gray-400" />,
  <Medal key="bronze" className="h-4 w-4 text-amber-700" />,
];

function MiniTrendChart({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const height = 24;
  const width = 56;
  const step = width / (data.length - 1);

  const points = data
    .map((val, i) => {
      const x = i * step;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0"
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke="hsl(239 84% 67%)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Leaderboard() {
  return (
    <Card>
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          Weekly Top Creators
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        {MOCK_LEADERBOARD.map((entry, idx) => (
          <div
            key={entry.user.id}
            className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent/50 transition-colors cursor-pointer"
          >
            <div className="flex h-6 w-6 items-center justify-center shrink-0">
              {RANK_ICONS[idx]}
            </div>
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage src={entry.user.avatar} alt={entry.user.name} />
              <AvatarFallback>{entry.user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{entry.user.name}</p>
              <p className="text-xs text-muted-foreground">
                {entry.weeklyPoints.toLocaleString()} pts
              </p>
            </div>
            <MiniTrendChart data={entry.trendData} />
          </div>
        ))}

        <Button
          variant="ghost"
          className="w-full text-xs text-muted-foreground hover:text-primary mt-1"
          size="sm"
        >
          View Full Leaderboard →
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================
// CAMPAIGN WIDGET
// ============================================================
function CampaignWidget() {
  return (
    <Card
      className={cn(
        "overflow-hidden bg-gradient-to-br",
        MOCK_CAMPAIGN.gradient
      )}
    >
      <CardContent className="p-4 text-white">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/70">
          <Trophy className="h-3.5 w-3.5" />
          Active Campaign
        </div>
        <h3 className="mt-2 text-base font-bold">{MOCK_CAMPAIGN.title}</h3>
        <p className="mt-1 text-sm text-white/80">{MOCK_CAMPAIGN.prize}</p>

        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="font-semibold">
            {MOCK_CAMPAIGN.daysLeft} days left
          </span>
          <span className="text-white/70">
            {MOCK_CAMPAIGN.totalEntries}/{MOCK_CAMPAIGN.maxEntries} entries
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

        <Button
          size="sm"
          className="mt-3 w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-white/20 border glow-primary-strong"
        >
          Enter Now ✨
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================
// RIGHT SIDEBAR EXPORT
// ============================================================
export function RightSidebar() {
  return (
    <aside className="flex flex-col gap-4" aria-label="Trending and leaderboard">
      <WhatsVibing />
      <Leaderboard />
      <CampaignWidget />
    </aside>
  );
}
