/**
 * Route: /discussions/[slug]
 * Auth requirement: Optional
 * Data dependencies: post, author, comments
 * Backend endpoints needed:
 * - GET /api/posts/:slug
 * - GET /api/posts/:slug/comments
 */
import { notFound } from "next/navigation";
import { MessageSquare, UserRound } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatRelativeDate } from "@/lib/format";
import { getCommentsByPostId, getPostBySlug, getUserById } from "@/lib/adapters/content";

interface DiscussionPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function DiscussionPage({ params }: DiscussionPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const author = getUserById(post.authorId);
  const postComments = getCommentsByPostId(post.id).slice(0, 12);

  return (
    <section className="animate-route-emerge space-y-4">
      <Card>
        <CardHeader>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{post.title}</h1>
            <p className="text-sm text-[var(--text-muted)]">
              by {author?.name ?? "Unknown author"} · {formatRelativeDate(post.createdAt)}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-[var(--text-secondary)]">{post.body}</p>

          <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 text-xs text-[var(--text-muted)]">
            <p>Category: {post.category}</p>
            <p className="mt-1">{post.views.toLocaleString()} views · {post.upvotes.toLocaleString()} upvotes</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]">
            <MessageSquare className="h-4 w-4" /> Comments ({postComments.length})
          </h2>
        </CardHeader>

        <CardContent className="space-y-3">
          {postComments.map((comment) => {
            const commentAuthor = getUserById(comment.authorId);

            return (
              <div key={comment.id} className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
                <p className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--text-primary)]">
                  <UserRound className="h-3.5 w-3.5" />
                  {commentAuthor?.name ?? "Unknown user"}
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{comment.body}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </section>
  );
}
