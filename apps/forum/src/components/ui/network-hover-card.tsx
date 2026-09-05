"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

interface NetworkStats {
  posts: string;
  reach: string;
  signal: string;
  strength: string;
}

interface NetworkAvatarCardProps {
  /** Author avatar: initials shown in the trigger circle */
  authorInitials: string;
  /** Background colour class for the trigger circle (e.g. "bg-pink-500") */
  authorBgClass?: string;
  /** Inline background colour for the trigger circle */
  authorBgColor?: string;
  /** Distribution network name */
  networkName: string;
  /** Network avatar image URL */
  networkImageSrc?: string;
  /** Network stats */
  stats?: NetworkStats;
  /** Avatar trigger size */
  size?: "sm" | "lg";
  className?: string;
}

const DEFAULT_STATS: NetworkStats = {
  posts: "1k",
  reach: "10k",
  signal: "72",
  strength: "12k",
};

const DEFAULT_NETWORK_IMAGE =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=80&h=80&fit=crop&crop=faces";

const STAT_LABELS: { key: keyof NetworkStats; label: string }[] = [
  { key: "posts", label: "Post" },
  { key: "reach", label: "Reach" },
  { key: "signal", label: "Signal" },
  { key: "strength", label: "Strength" },
];

const AVATAR_DIM = { sm: "h-10 w-10", lg: "h-12 w-12" } as const;
const CONTENT_PAD = { sm: "pl-11", lg: "pl-14" } as const;

export function NetworkAvatarCard({
  authorInitials,
  authorBgClass,
  authorBgColor,
  networkName,
  networkImageSrc = DEFAULT_NETWORK_IMAGE,
  stats = DEFAULT_STATS,
  size = "sm",
  className,
}: NetworkAvatarCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={cn("relative inline-block flex-shrink-0", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={false}
      animate={{ width: isHovered ? "auto" : "fit-content" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* ── Trigger: author avatar circle ── */}
      <motion.div
        layout
        animate={{ padding: isHovered ? "4px" : "0px" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          AVATAR_DIM[size],
          "rounded-full overflow-hidden flex items-center justify-center text-sm font-bold text-white",
          authorBgClass,
        )}
        style={authorBgColor ? { backgroundColor: authorBgColor } : undefined}
      >
        {authorInitials}
      </motion.div>

      {/* ── Card overlay — anchored to avatar top-left ── */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute top-0 left-0 z-50 w-72 card-surface rounded-xl shadow-xl overflow-hidden"
            style={{ pointerEvents: "auto" }}
          >
            {/* Network avatar — sits exactly where the author avatar was */}
            <div className={cn("absolute top-0 left-0 p-1.5", AVATAR_DIM[size])}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={networkImageSrc}
                alt={networkName}
                className="h-full w-full rounded-full object-cover"
              />
            </div>

            {/* Content: offset right to clear the avatar */}
            <motion.div
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              transition={{ delay: 0.1, duration: 0.2 }}
              className={cn(CONTENT_PAD[size], "pr-3 pt-2 pb-3")}
            >
              {/* Network name */}
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: 0.15, duration: 0.2 }}
                className="block text-sm font-semibold text-[var(--text-primary)]"
              >
                {networkName}
              </motion.span>

              {/* Stats grid */}
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ delay: 0.22, duration: 0.2 }}
                className="mt-2.5 grid grid-cols-4 gap-1 text-center"
              >
                {STAT_LABELS.map(({ key, label }) => (
                  <div key={key} className="flex flex-col gap-0.5">
                    <span className="text-micro-2 text-[var(--text-muted)] uppercase tracking-wide">
                      {label}
                    </span>
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      {stats[key]}
                    </span>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
