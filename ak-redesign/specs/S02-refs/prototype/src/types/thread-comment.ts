import type { CommentIntentType } from "./thread";

export interface ThreadComment {
  id: string;
  threadId: string;
  authorId: string;
  body: string;
  createdAt: string;
  parentId?: string;
  upvotes: number;
  downvotes: number;
  isOpReply?: boolean;
  isSolution?: boolean;
  intentTag?: CommentIntentType;
  fallacyTags?: Array<"Ad Hominem" | "Strawman" | "False Dichotomy">;
  fallacyCount?: number;
  annotation?: {
    mediaId: string;
    x: number;
    y: number;
    timestamp?: number;
  };
  candidateShowcaseProof?: Array<{
    id: string;
    title: string;
    href: string;
  }>;
  partition?: "question" | "response";
}

export interface ThreadCommentNode extends ThreadComment {
  depth: number;
  children: ThreadCommentNode[];
}
