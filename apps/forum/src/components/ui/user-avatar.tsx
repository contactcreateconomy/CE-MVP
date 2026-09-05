"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import type { User } from "@/types";

interface UserAvatarProps {
  user: User | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  authorName?: string | null;
}

const sizeClassMap = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-11 w-11",
} as const;

const imageSizeMap = {
  sm: 28,
  md: 36,
  lg: 44,
} as const;

/**
 * Level-ring palette archived 2026-08-31 (archive/e-bucket/user-levels.ts) —
 * it's a different visual system than the locked 10-rung ladder (CAP-313, Wave 5A).
 * Avatar wears a neutral ring until the ladder viz (A8) lands; do not reintroduce
 * per-level colors.
 */
export function UserAvatar({ user, size = "md", className, authorName }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const targetName = user?.name || authorName;
  const initials = targetName
    ? targetName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "??";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-(--bg-canvas) ring-2 ring-(--border-default) transition-transform duration-normal hover:-translate-y-0.5",
        className,
      )}
      aria-hidden
    >
      {user?.avatar && !imageError ? (
        // Native <img>: profile images may come from Convex storage or any OAuth host;
        // next/image would throw if the hostname is not in remotePatterns (production crash).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatar}
          alt=""
          width={imageSizeMap[size]}
          height={imageSizeMap[size]}
          className={`${sizeClassMap[size]} rounded-full object-cover`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
        />
      ) : (
        <span
          className={`${sizeClassMap[size]} inline-flex items-center justify-center rounded-full bg-(--bg-surface) text-micro font-semibold text-(--text-secondary)`}
        >
          {initials}
        </span>
      )}
    </span>
  );
}
