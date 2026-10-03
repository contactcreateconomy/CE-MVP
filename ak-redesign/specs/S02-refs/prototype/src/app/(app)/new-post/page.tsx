/**
 * Route: /new-post
 * Auth requirement: Member recommended (placeholder route for editor flow)
 * Data dependencies: viewer profile, editor draft state, categories, tags
 * Backend endpoints needed:
 * - GET /api/me
 * - POST /api/posts
 * - POST /api/posts/draft
 * - GET /api/categories
 */
import { PenLine } from "lucide-react";

export default function NewPostPage() {
  return (
    <section className="animate-route-emerge mx-auto w-full max-w-[900px] px-2 pb-8 pt-4 md:px-8">
      <div className="mb-8 flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <PenLine className="h-4 w-4" />
        <span>Create story</span>
      </div>

      <div className="min-h-[70vh] space-y-6">
        <input
          aria-label="Post title"
          placeholder="Title"
          className="w-full border-0 bg-transparent text-4xl font-semibold leading-tight text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] md:text-5xl"
        />

        <div className="min-h-[520px] w-full rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)]/55 p-6 backdrop-blur-sm">
          <p className="text-lg leading-9 text-[var(--text-secondary)]">
            Medium-style full-page editor placeholder. The final version will include formatting toolbar,
            slash commands, embeds, autosave, and publishing controls.
          </p>
          <p className="mt-6 text-lg leading-9 text-[var(--text-secondary)]">
            Start writing your post content here...
          </p>
        </div>
      </div>
    </section>
  );
}
