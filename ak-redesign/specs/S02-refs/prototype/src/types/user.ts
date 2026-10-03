export interface User {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  level: number;
  points: number;
  streakDays: number;
  verified?: boolean;
  role: "member" | "moderator" | "admin";
}
