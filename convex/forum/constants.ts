/** Every post navigates to its own discussion page. */
export function discussionHrefForPostShape(post: {
  slug: string;
}): string {
  return `/discussions/${post.slug}`;
}
