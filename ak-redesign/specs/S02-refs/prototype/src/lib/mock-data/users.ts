import type { User } from "@/types";

export const users: User[] = [
  { id: "u1", name: "Emily Zhang", handle: "emilyai", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=256&h=256&fit=crop&crop=faces", bio: "I test AI writing systems in production editorial teams.", level: 6, points: 14240, streakDays: 29, verified: true, role: "member" },
  { id: "u2", name: "Marcus Johnson", handle: "marcusdev", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=256&h=256&fit=crop&crop=faces", bio: "Building autonomous agents for creator funnels.", level: 7, points: 21780, streakDays: 42, role: "member" },
  { id: "u3", name: "Sophia Patel", handle: "sophiacreates", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces", bio: "Artist turned AI-native visual storyteller.", level: 5, points: 8930, streakDays: 14, verified: true, role: "member" },
  { id: "u4", name: "David Kim", handle: "davidk", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=faces", bio: "Product + growth operator for AI startups.", level: 4, points: 4680, streakDays: 9, role: "moderator" },
  { id: "u5", name: "Rachel Moore", handle: "rachelcodes", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces", bio: "Turned AI templates into a full-time business.", level: 8, points: 30220, streakDays: 63, verified: true, role: "member" },
];
