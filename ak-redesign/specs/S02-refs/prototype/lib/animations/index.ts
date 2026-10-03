import type { Variants, Transition } from "framer-motion";

// ============================================================
// TRANSITIONS
// ============================================================
export const SPRING_SMOOTH: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

export const SPRING_BOUNCY: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 15,
};

export const EASE_SMOOTH: Transition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1],
};

// ============================================================
// VARIANTS
// ============================================================

/** Fade in from bottom — used for cards, content blocks */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

/** Stagger container — wraps children with stagger delay */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

/** Scale on hover — used for cards, buttons */
export const hoverLift: Variants = {
  rest: { y: 0, scale: 1 },
  hover: { y: -2, scale: 1.01 },
};

/** Bounce animation — used for upvote */
export const bounceClick: Variants = {
  rest: { scale: 1 },
  pressed: { scale: 1.2 },
};

/** Slide down — used for dropdowns */
export const slideDown: Variants = {
  hidden: { opacity: 0, y: -8, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.96 },
};

/** Rotate icon — used for theme toggle */
export const rotateIcon: Variants = {
  sun: { rotate: 0, scale: 1 },
  moon: { rotate: 180, scale: 1 },
};

/** Slide from right — used for mobile menus */
export const slideFromRight: Variants = {
  hidden: { x: "100%" },
  visible: { x: 0 },
  exit: { x: "100%" },
};

/** Morph card — used for trending topics */
export const morphCard: Variants = {
  enter: { opacity: 0, y: 30, scale: 0.95 },
  center: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -30, scale: 0.95 },
};

/** Glow pulse — used for active elements */
export const glowPulse: Variants = {
  rest: { boxShadow: "0 0 0px hsl(239 84% 67% / 0)" },
  glow: {
    boxShadow: [
      "0 0 10px hsl(239 84% 67% / 0.2)",
      "0 0 20px hsl(239 84% 67% / 0.1)",
      "0 0 10px hsl(239 84% 67% / 0.2)",
    ],
    transition: { duration: 2, repeat: Infinity },
  },
};

/** Expand search — used for search bar */
export const expandSearch: Variants = {
  collapsed: { width: 40 },
  expanded: { width: 300 },
};
