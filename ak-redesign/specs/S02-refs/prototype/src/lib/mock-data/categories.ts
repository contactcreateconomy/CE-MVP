import type { Category } from "@/types";

export const categories: Category[] = [
  { key: "news", name: "News", icon: "newspaper", description: "AI ecosystem updates and platform launches.", primaryColor: "#3B82F6", lockedByDefault: false },
  { key: "review", name: "Review", icon: "star", description: "Hands-on reviews of AI tools and workflows.", primaryColor: "#8B5CF6", lockedByDefault: false },
  { key: "compare", name: "Compare", icon: "git-compare", description: "Side-by-side comparisons for better decisions.", primaryColor: "#22C55E", lockedByDefault: false },
  { key: "launch-pad", name: "Launch Pad", icon: "rocket", description: "Monetization and launch strategy discussions.", primaryColor: "#F59E0B", lockedByDefault: true, pointsToUnlock: 250 },
  { key: "debate", name: "Debate", icon: "swords", description: "Structured opposing takes from power users.", primaryColor: "#EF4444", lockedByDefault: true, pointsToUnlock: 400 },
  { key: "help", name: "Help", icon: "help-circle", description: "Get unblocked with workflow and setup issues.", primaryColor: "#14B8A6", lockedByDefault: false },
  { key: "list", name: "List", icon: "layout-list", description: "Curated stacks and ranked resources.", primaryColor: "#F97316", lockedByDefault: false },
  { key: "showcase", name: "Showcase", icon: "sparkles", description: "Ship logs, launches, and real outcomes.", primaryColor: "#EC4899", lockedByDefault: false },
  { key: "gigs", name: "Gigs", icon: "briefcase", description: "Creator jobs, collaborations, and requests.", primaryColor: "#EAB308", lockedByDefault: false },
];
