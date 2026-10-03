import type { ThreadComment, ThreadData, ThreadId } from "@/types";

import { compareComments, compareThread } from "./compare";
import { debateComments, debateThread } from "./debate";
import { gigsComments, gigsThread } from "./gigs";
import { helpComments, helpThread } from "./help";
import { launchpadComments, launchpadThread } from "./launch-pad";
import { listComments, listThread } from "./list";
import { newsComments, newsThread } from "./news";
import { reviewComments, reviewThread } from "./review";
import { showcaseComments, showcaseThread } from "./showcase";

export const threadMap: Record<ThreadId, ThreadData> = {
  "news-001": newsThread,
  "review-001": reviewThread,
  "compare-001": compareThread,
  "launchpad-001": launchpadThread,
  "debate-001": debateThread,
  "help-001": helpThread,
  "list-001": listThread,
  "showcase-001": showcaseThread,
  "gigs-001": gigsThread,
};

export const threadCommentsMap: Record<ThreadId, ThreadComment[]> = {
  "news-001": newsComments,
  "review-001": reviewComments,
  "compare-001": compareComments,
  "launchpad-001": launchpadComments,
  "debate-001": debateComments,
  "help-001": helpComments,
  "list-001": listComments,
  "showcase-001": showcaseComments,
  "gigs-001": gigsComments,
};

export const allThreads: ThreadData[] = Object.values(threadMap);

export const allThreadComments: ThreadComment[] = Object.values(threadCommentsMap).flat();

export function isThreadId(value: string): value is ThreadId {
  return value in threadMap;
}

export function getThreadById(id: string): ThreadData | null {
  if (!isThreadId(id)) {
    return null;
  }
  return threadMap[id];
}

export function getThreadCommentsById(id: string): ThreadComment[] {
  if (!isThreadId(id)) {
    return [];
  }
  return threadCommentsMap[id];
}
