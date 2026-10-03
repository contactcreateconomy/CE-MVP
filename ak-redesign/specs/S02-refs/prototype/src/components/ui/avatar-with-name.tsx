"use client";

import { AnimatePresence, motion } from "motion/react";
import { type CSSProperties, type ReactNode, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { cn } from "@/lib/utils";

export interface NativeAvatarProps {
  src?: string;
  name: string;
  fallback?: string;
  icon?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  direction?: "top" | "bottom" | "left" | "right";
  className?: string;
  avatarClassName?: string;
  nameClassName?: string;
  motionClassName?: string;
  avatarStyle?: CSSProperties;
  labelStyle?: CSSProperties;
}

const sizeVariants = {
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-20 w-20",
  xl: "h-28 w-28",
};

const nameSizeVariants = {
  sm: "text-xs px-2 py-1",
  md: "text-sm px-3 py-1.5",
  lg: "text-base px-4 py-2",
  xl: "text-lg px-5 py-2.5",
};

export function Component({
  src,
  name,
  fallback,
  icon,
  size = "md",
  direction = "bottom",
  className,
  avatarClassName,
  nameClassName,
  motionClassName,
  avatarStyle,
  labelStyle,
}: NativeAvatarProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getInitials = (value: string) => {
    return value
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const directionVariants = {
    top: {
      initial: { y: 20, opacity: 0, filter: "blur(4px)" },
      animate: { y: -8, opacity: 1, filter: "blur(0px)" },
      exit: { y: 20, opacity: 0, filter: "blur(4px)" },
    },
    bottom: {
      initial: { y: -20, opacity: 0, filter: "blur(4px)" },
      animate: { y: 8, opacity: 1, filter: "blur(0px)" },
      exit: { y: -20, opacity: 0, filter: "blur(4px)" },
    },
    left: {
      initial: { x: 20, opacity: 0, filter: "blur(4px)" },
      animate: { x: -8, opacity: 1, filter: "blur(0px)" },
      exit: { x: 20, opacity: 0, filter: "blur(4px)" },
    },
    right: {
      initial: { x: -20, opacity: 0, filter: "blur(4px)" },
      animate: { x: 8, opacity: 1, filter: "blur(0px)" },
      exit: { x: -20, opacity: 0, filter: "blur(4px)" },
    },
  };

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={motionClassName}
      >
        <Avatar
          className={cn(
            sizeVariants[size],
            "cursor-pointer ring-2 ring-background shadow-lg",
            avatarClassName,
          )}
          style={avatarStyle}
        >
          {icon ? null : <AvatarImage src={src || "/placeholder.svg"} alt={name} />}
          <AvatarFallback className={cn("font-semibold", icon ? "text-[var(--text-primary)]" : "text-muted-foreground")}>
            {icon ?? fallback ?? getInitials(name)}
          </AvatarFallback>
        </Avatar>
      </motion.div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={directionVariants[direction].initial}
            animate={directionVariants[direction].animate}
            exit={directionVariants[direction].exit}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
              opacity: { duration: 0.2 },
              filter: { duration: 0.2 },
            }}
            className={cn(
              "pointer-events-none absolute z-10 whitespace-nowrap rounded-md border bg-popover text-popover-foreground shadow-lg",
              nameSizeVariants[size],
              positionClasses[direction],
              nameClassName,
            )}
            style={labelStyle}
          >
            <span className="font-medium">{name}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
