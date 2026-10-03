"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { getUserLevelRingColor } from "@/lib/user-levels";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

interface UserAvatarProps {
  user: User | null;
  size?: "sm" | "md" | "lg";
  className?: string;
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

export function UserAvatar({ user, size = "md", className }: UserAvatarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const ringColor = getUserLevelRingColor(user?.level ?? 1);

  const ringShadow = useMemo(() => {
    const emboss = "0 1px 1px rgba(255,255,255,0.18) inset, 0 -1px 1px rgba(0,0,0,0.22) inset";
    const ring = `0 0 0 2px ${ringColor}`;
    const glow = isHovered ? `, 0 0 10px ${ringColor}99` : "";
    return `${emboss}, ${ring}${glow}`;
  }, [isHovered, ringColor]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "??";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-[var(--bg-canvas)] transition-transform duration-150 hover:-translate-y-0.5",
        className,
      )}
      style={{ boxShadow: ringShadow }}
      aria-hidden
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {user?.avatar ? (
        <Image
          src={user.avatar}
          alt={`${user.name} avatar`}
          width={imageSizeMap[size]}
          height={imageSizeMap[size]}
          className={`${sizeClassMap[size]} rounded-full object-cover`}
        />
      ) : (
        <span
          className={`${sizeClassMap[size]} inline-flex items-center justify-center rounded-full bg-[var(--bg-overlay)] text-[10px] font-semibold text-[var(--text-primary)]`}
        >
          {initials}
        </span>
      )}
    </span>
  );
}
