export interface Notification {
  id: string;
  userId: string;
  type: "comment" | "upvote" | "follow" | "system";
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  postSlug?: string;
}
