import type { Post } from "@/types";

/** Every post navigates to its own discussion page. */
export function getDiscussionHrefForPost(post: Post): string {
  return `/discussions/${post.slug}`;
}
