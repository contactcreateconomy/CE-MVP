import type { ComponentType } from "react";
import type { DiscussionThread } from "@/types/discussion";
import type { Post } from "@/types/post";
import type { User } from "@/types";

export interface CategoryTemplate {
  /** The category key this template handles */
  key: string;
  /** Main body component rendered below the thread header */
  Body: ComponentType<{
    thread: DiscussionThread;
    isMax: boolean;
    author: User | null;
    ensureAuthenticated: () => boolean;
  }>;
  /** Optional sidebar/rail extras (timelines, sentiment, diagnostics) */
  Insights?: ComponentType<{ thread: DiscussionThread }>;
  /** Composer nudge text */
  nudge?: string;
  /** Extract feedback chips from categoryBody, if any */
  getFeedbackChips?: (thread: DiscussionThread) => string[] | null;

  /**
   * Optional structured fields rendered in the compose flow below the TipTap editor.
   * If undefined, only title/summary/body are captured for this category.
   */
  ComposeForm?: ComponentType<{
    value: Record<string, unknown>;
    onChange: (fields: Record<string, unknown>) => void;
  }>;

  /**
   * Optional metadata rendered as a small strip below the post title in feed cards.
   * Must be compact (max 1 line, no images).
   * If undefined, no extra metadata shown in feed.
   */
  CardExtras?: ComponentType<{ post: Post }>;
}
