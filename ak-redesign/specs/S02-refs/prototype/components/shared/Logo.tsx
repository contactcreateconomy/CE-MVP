"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
}

/**
 * Createconomy Logo — Pure CSS
 * Layout: Left semicircle | Right column: top quarter-circle + bottom square
 * Gap of ~2px between elements
 * On hover: square rotates 90deg with spring animation
 */
export function Logo({ size = 32, className }: LogoProps) {
  const gap = size * 0.06; // proportional gap
  const leftWidth = size * 0.55;
  const rightWidth = size - leftWidth - gap;
  const topHeight = size * 0.55;
  const bottomHeight = size - topHeight - gap;

  return (
    <motion.div
      className={cn("relative flex cursor-pointer", className)}
      style={{ width: size, height: size, gap }}
      whileHover="hover"
      initial="rest"
      animate="rest"
      aria-label="Createconomy logo"
      role="img"
    >
      {/* Left semicircle */}
      <div
        className="bg-foreground shrink-0"
        style={{
          width: leftWidth,
          height: size,
          borderRadius: `${size}px 0 0 ${size}px`,
        }}
      />

      {/* Right column */}
      <div className="flex flex-col" style={{ gap }}>
        {/* Top quarter-circle */}
        <div
          className="bg-foreground"
          style={{
            width: rightWidth,
            height: topHeight,
            borderRadius: `0 ${size}px 0 0`,
          }}
        />

        {/* Bottom square with hover rotation */}
        <motion.div
          className="bg-foreground"
          style={{
            width: rightWidth,
            height: bottomHeight,
            borderRadius: size * 0.05,
            originX: 0.5,
            originY: 0.5,
          }}
          variants={{
            rest: { rotate: 0 },
            hover: { rotate: 90 },
          }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
        />
      </div>
    </motion.div>
  );
}
