import type { Notification } from "@/types";

export const notifications: Notification[] = [
  { id: "n1", userId: "u1", type: "comment", title: "New comment", message: "Marcus replied to your review thread.", createdAt: "2026-02-28T08:12:00.000Z", read: false, postSlug: "tested-15-ai-writing-tools-month-review" },
  { id: "n2", userId: "u1", type: "upvote", title: "Upvote milestone", message: "Your post crossed 800 upvotes.", createdAt: "2026-02-28T07:40:00.000Z", read: false, postSlug: "tested-15-ai-writing-tools-month-review" },
  { id: "n3", userId: "u1", type: "follow", title: "New follower", message: "Rachel started following you.", createdAt: "2026-02-27T19:22:00.000Z", read: true },
  { id: "n4", userId: "u1", type: "system", title: "Weekly recap ready", message: "Your creator analytics snapshot is available.", createdAt: "2026-02-27T09:05:00.000Z", read: true },
];
