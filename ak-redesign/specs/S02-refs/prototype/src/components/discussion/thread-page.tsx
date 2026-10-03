"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUp,
  Bookmark,
  Bot,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  Filter,
  GitCompare,
  HelpCircle,
  LayoutList,
  MessageSquare,
  MoreHorizontal,
  Newspaper,
  Rocket,
  Search,
  Share2,
  Sparkles,
  Star,
  Swords,
  Trophy,
  UserRound,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatCompactNumber, formatRelativeDate } from "@/lib/format";
import { getThreadById, getThreadCommentsById } from "@/lib/mock-data/threads";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import type {
  CategoryKey,
  CommentIntentType,
  CompareThreadData,
  DebateThreadData,
  GigThreadData,
  HelpThreadData,
  LaunchpadThreadData,
  ListThreadData,
  NewsThreadData,
  ReviewThreadData,
  ShowcaseThreadData,
  ThreadComment,
  ThreadCommentNode,
  ThreadData,
  ThreadMode,
  User,
} from "@/types";

interface ThreadPageProps {
  thread: ThreadData;
  comments: ThreadComment[];
  users: User[];
}

interface HoverThreadPreview {
  title: string;
  category: CategoryKey;
  summary: string;
  qualityStage: "Foundational" | "Strong" | "Canonical";
  commentCount: number;
}

const categoryIconMap: Record<CategoryKey, React.ComponentType<{ className?: string }>> = {
  news: Newspaper,
  review: Star,
  compare: GitCompare,
  "launch-pad": Rocket,
  debate: Swords,
  help: HelpCircle,
  list: LayoutList,
  showcase: Sparkles,
  gigs: Briefcase,
};

const sourceCredibilityDescriptions: Record<"independent" | "corporate" | "government" | "community", string> = {
  independent: "Independent investigators or research collectives not tied to a platform vendor.",
  corporate: "Directly published by a company involved in the product, model, or benchmark ecosystem.",
  government: "Published by a public institution, standards body, or regulatory entity.",
  community: "Synthesized or field-reported by practitioner communities and operators.",
};

const HOVER_PREVIEW_DELAY_MS = 300;

const intentOptions: { label: string; value: CommentIntentType }[] = [
  { label: "Evidence", value: "evidence" },
  { label: "Counterpoint", value: "counterpoint" },
  { label: "Clarifying Question", value: "question" },
  { label: "Implementation Note", value: "implementation-note" },
  { label: "Resource Link", value: "resource" },
  { label: "Decision Proposal", value: "decision-proposal" },
  { label: "Solution", value: "solution" },
];

function getQualityStageLabel(value?: number): "Foundational" | "Strong" | "Canonical" {
  if (typeof value !== "number") {
    return "Foundational";
  }

  if (value >= 80) {
    return "Canonical";
  }

  if (value >= 60) {
    return "Strong";
  }

  return "Foundational";
}

function getHoverThreadPreview(threadId: string): HoverThreadPreview | null {
  const previewThread = getThreadById(threadId);

  if (!previewThread) {
    return null;
  }

  const qualityValues = previewThread.qualityDimensions
    ? Object.values(previewThread.qualityDimensions)
    : [];
  const qualityAverage = qualityValues.length
    ? qualityValues.reduce((sum, value) => sum + value, 0) / qualityValues.length
    : undefined;

  return {
    title: previewThread.header.title,
    category: previewThread.category,
    summary: previewThread.header.aiSummary,
    qualityStage: getQualityStageLabel(qualityAverage),
    commentCount: getThreadCommentsById(threadId).length,
  };
}

function pickVerdictTone(label: string) {
  if (label.includes("not")) return "text-[var(--feedback-error)]";
  if (label.includes("caveats")) return "text-[var(--feedback-warning)]";
  return "text-[var(--feedback-success)]";
}

function buildCommentTree(items: ThreadComment[]) {
  const nodes = new Map<string, ThreadCommentNode>();
  const roots: ThreadCommentNode[] = [];

  items.forEach((comment) => {
    nodes.set(comment.id, {
      ...comment,
      depth: 0,
      children: [],
    });
  });

  nodes.forEach((node) => {
    if (node.parentId) {
      const parent = nodes.get(node.parentId);
      if (parent) {
        node.depth = parent.depth + 1;
        parent.children.push(node);
        return;
      }
    }
    roots.push(node);
  });

  return roots;
}

function flattenCount(nodes: ThreadCommentNode[]): number {
  return nodes.reduce((acc, node) => acc + 1 + flattenCount(node.children), 0);
}

function filterTreeByIntent(nodes: ThreadCommentNode[], intents: CommentIntentType[]): ThreadCommentNode[] {
  if (intents.length === 0) {
    return nodes;
  }

  return nodes
    .map((node) => {
      const filteredChildren = filterTreeByIntent(node.children, intents);
      const matchesSelf = node.intentTag ? intents.includes(node.intentTag) : false;

      if (!matchesSelf && filteredChildren.length === 0) {
        return null;
      }

      return {
        ...node,
        children: filteredChildren,
      };
    })
    .filter((node): node is ThreadCommentNode => Boolean(node));
}

function MarkdownLite({ value }: { value: string }) {
  const blocks = value.split("```");

  return (
    <div className="space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
      {blocks.map((block, index) => {
        if (index % 2 === 1) {
          const [language, ...rest] = block.split("\n");
          const code = rest.join("\n").trim();
          return (
            <div key={`${language}-${index}`} className="group relative rounded-[12px] border border-[var(--border-default)] bg-[var(--bg-overlay)] p-3">
              <div className="mb-2 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <span>{language || "code"}</span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 hover:bg-[var(--bg-surface)]"
                  onClick={() => void navigator.clipboard?.writeText(code)}
                >
                  <Copy className="h-3 w-3" /> Copy
                </button>
              </div>
              <pre className="overflow-auto rounded-[10px] bg-black/40 p-3 text-xs text-sky-100">
                <code>{code}</code>
              </pre>
            </div>
          );
        }
        return (
          <p key={index} className="whitespace-pre-line">
            {block.trim()}
          </p>
        );
      })}
    </div>
  );
}

export function ThreadPage({ thread, comments, users }: ThreadPageProps) {
  const { authStatus, openAuthModal, user: authUser } = useAuth();

  const [mode, setMode] = useState<ThreadMode>("min");
  const [threadUpvoted, setThreadUpvoted] = useState(false);
  const [threadBookmarked, setThreadBookmarked] = useState(false);
  const [threadUpvotes, setThreadUpvotes] = useState(thread.header.upvotes);
  const [threadBookmarks, setThreadBookmarks] = useState(thread.header.bookmarks);
  const [linkCopied, setLinkCopied] = useState(false);
  const [composerText, setComposerText] = useState("");
  const [dismissedNudge, setDismissedNudge] = useState(false);
  const [selectedIntent, setSelectedIntent] = useState<CommentIntentType | null>(null);
  const [activeCommentFilters, setActiveCommentFilters] = useState<CommentIntentType[]>([]);
  const [expandedDepthBranches, setExpandedDepthBranches] = useState<Record<string, boolean>>({});
  const [replyOpenFor, setReplyOpenFor] = useState<string | null>(null);
  const [commentVotes, setCommentVotes] = useState<Record<string, { up: number; down: number; mine: 1 | -1 | 0 }>>({});
  const [commentSort, setCommentSort] = useState<"best" | "new" | "top">("best");
  const [debateVote, setDebateVote] = useState<"agree" | "disagree" | "abstain" | null>(null);
  const [debateDistribution, setDebateDistribution] = useState(
    thread.category === "debate" ? (thread.categoryData as DebateThreadData).voteDistribution : null,
  );
  const [mindChanges, setMindChanges] = useState(
    thread.category === "debate" ? (thread.categoryData as DebateThreadData).mindsChangedCount : 0,
  );
  const [reviewAdjustOpen, setReviewAdjustOpen] = useState(false);
  const [reviewWeights, setReviewWeights] = useState<Record<string, number>>({});
  const [compareWeights, setCompareWeights] = useState<Record<string, number>>({});
  const [activeScenario, setActiveScenario] = useState(0);
  const [showDiffOnly, setShowDiffOnly] = useState(false);
  const [listLens, setListLens] = useState("editor");
  const [expandedListItems, setExpandedListItems] = useState<Record<string, boolean>>({});
  const [activeShowcaseMedia, setActiveShowcaseMedia] = useState(0);
  const [showcaseView, setShowcaseView] = useState<"chronological" | "cluster">("chronological");
  const [annotationMode, setAnnotationMode] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applySubmitted, setApplySubmitted] = useState(false);
  const [fitSelections, setFitSelections] = useState<Record<string, boolean>>({});
  const [gigsTab, setGigsTab] = useState<"all" | "question" | "response">("all");
  const [reproCount, setReproCount] = useState(
    thread.category === "help" ? (thread.categoryData as HelpThreadData).reproducibilityCount : 0,
  );
  const [requestedUpdates, setRequestedUpdates] = useState(thread.alien?.freshnessWarning?.updateRequests ?? 0);
  const [isAiReviewOpen, setIsAiReviewOpen] = useState(false);
  const [coAuthors, setCoAuthors] = useState<string[]>(thread.alien?.coAuthors ?? []);
  const [isCoAuthorLoading, setIsCoAuthorLoading] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [searchCommand, setSearchCommand] = useState("");
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hoverPreview, setHoverPreview] = useState<string | null>(null);
  const [mobileInsightOpen, setMobileInsightOpen] = useState(false);
  const [highlightedAnnotationCommentId, setHighlightedAnnotationCommentId] = useState<string | null>(null);
  const hoverPreviewTimerRef = useRef<number | null>(null);

  const usersById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
  const author = usersById.get(thread.header.authorId) ?? null;
  const CategoryIcon = categoryIconMap[thread.category];
  const canManageThread = useMemo(() => {
    if (!authUser) {
      return false;
    }

    const authorIdSet = new Set<string>([thread.header.authorId, ...coAuthors]);
    return authorIdSet.has(authUser.id);
  }, [authUser, coAuthors, thread.header.authorId]);

  const coAuthorLabel = coAuthors
    .map((id) => usersById.get(id)?.handle ?? id)
    .map((handle) => `@${handle}`)
    .join(" & ");

  const qualityNudgeMap: Record<CategoryKey, string> = {
    news: "Adding a source link makes your reply 4x more likely to be upvoted.",
    review: "Mention which version or plan you used — context builds trust.",
    debate: "The strongest arguments cite a counter-argument directly before refuting it.",
    help: "Include your error message and what you've already tried — it cuts reply time in half.",
    compare: "Which use case are you optimising for? It makes your comparison actionable.",
    "launch-pad": "Specific feedback ('the onboarding step 3 is unclear') is more useful than general praise.",
    list: "If you're suggesting an addition, explain why it meets the stated criteria.",
    showcase: "Tell us which aspect you want feedback on — UX, visuals, or technical approach.",
    gigs: "If you're a candidate, lead with your most relevant work, not your resume.",
  };

  const commentsToRender = useMemo(() => {
    if (thread.category !== "gigs" || mode !== "max") {
      return comments;
    }

    if (gigsTab === "all") {
      return comments;
    }

    return comments.filter((comment) => comment.partition === gigsTab);
  }, [comments, gigsTab, mode, thread.category]);

  const commentTree = useMemo(() => buildCommentTree(commentsToRender), [commentsToRender]);
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setShowCommandPalette((current) => !current);
      }

      if (event.key === "Escape") {
        setReplyOpenFor(null);
        setShowCommandPalette(false);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const top = doc.scrollTop;
      const max = doc.scrollHeight - doc.clientHeight;
      const value = max <= 0 ? 0 : Math.min(100, (top / max) * 100);
      setScrollProgress(value);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleAuthGate = useCallback(
    (action: () => void) => {
      if (authStatus !== "authenticated") {
        openAuthModal("login");
        return;
      }
      action();
    },
    [authStatus, openAuthModal],
  );

  const onToggleThreadUpvote = useCallback(
    () =>
      toggleAuthGate(() => {
        setThreadUpvoted((current) => {
          const next = !current;
          setThreadUpvotes((value) => value + (next ? 1 : -1));
          return next;
        });
      }),
    [toggleAuthGate],
  );

  const onToggleBookmark = useCallback(
    () =>
      toggleAuthGate(() => {
        setThreadBookmarked((current) => {
          const next = !current;
          setThreadBookmarks((value) => value + (next ? 1 : -1));
          return next;
        });
      }),
    [toggleAuthGate],
  );

  const onShare = useCallback(async () => {
    const url = `${window.location.origin}/discussion/${thread.id}`;
    await navigator.clipboard?.writeText(url);
    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 2000);
  }, [thread.id]);

  const sortedCommentTree = useMemo(() => {
    const sortNodes = (nodes: ThreadCommentNode[]): ThreadCommentNode[] => {
      const sorted = [...nodes].sort((a, b) => {
        if (commentSort === "new") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (commentSort === "top") {
          return b.upvotes - a.upvotes;
        }
        const scoreA = a.upvotes - a.downvotes;
        const scoreB = b.upvotes - b.downvotes;
        return scoreB - scoreA;
      });

      return sorted.map((node) => ({
        ...node,
        children: sortNodes(node.children),
      }));
    };

    const filtered = filterTreeByIntent(commentTree, activeCommentFilters);

    return sortNodes(filtered);
  }, [commentTree, commentSort, activeCommentFilters]);

  const onVoteComment = (commentId: string, direction: 1 | -1) => {
    toggleAuthGate(() => {
      setCommentVotes((current) => {
        const prev = current[commentId] ?? { up: 0, down: 0, mine: 0 as 1 | -1 | 0 };
        let nextMine: 1 | -1 | 0 = direction;

        if (prev.mine === direction) {
          nextMine = 0;
        }

        return {
          ...current,
          [commentId]: {
            up: prev.up + (nextMine === 1 ? 1 : 0) - (prev.mine === 1 ? 1 : 0),
            down: prev.down + (nextMine === -1 ? 1 : 0) - (prev.mine === -1 ? 1 : 0),
            mine: nextMine,
          },
        };
      });
    });
  };

  const onDebateVote = (vote: "agree" | "disagree" | "abstain") => {
    toggleAuthGate(() => {
      if (!debateDistribution) return;

      if (debateVote && debateVote !== vote) {
        setMindChanges((value) => value + 1);
      }

      const next = { ...debateDistribution };
      if (debateVote) {
        next[debateVote] -= 1;
      }
      next[vote] += 1;
      setDebateDistribution(next);
      setDebateVote(vote);
    });
  };

  const commandActions = useMemo(
    () =>
      [
        { label: "Search threads", action: () => window.location.assign("/feed") },
        { label: "Navigate to category", action: () => window.location.assign(`/feed?category=${thread.category}`) },
        { label: "Toggle MIN/MAX", action: () => setMode((current) => (current === "min" ? "max" : "min")) },
        { label: "Jump to comments", action: () => document.getElementById("thread-comments")?.scrollIntoView({ behavior: "smooth" }) },
        { label: "Share thread", action: () => void onShare() },
        { label: "Bookmark thread", action: () => onToggleBookmark() },
      ].filter((entry) => entry.label.toLowerCase().includes(searchCommand.toLowerCase())),
    [onShare, onToggleBookmark, searchCommand, thread.category],
  );

  useEffect(() => {
    if (!showCommandPalette) {
      return;
    }

    setSelectedCommandIndex(0);
  }, [searchCommand, showCommandPalette]);

  useEffect(() => {
    if (!showCommandPalette) {
      return;
    }

    const onPaletteKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedCommandIndex((current) =>
          commandActions.length ? (current + 1) % commandActions.length : 0,
        );
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedCommandIndex((current) =>
          commandActions.length
            ? (current - 1 + commandActions.length) % commandActions.length
            : 0,
        );
      }

      if (event.key === "Enter") {
        event.preventDefault();
        const selectedAction = commandActions[selectedCommandIndex];

        if (selectedAction) {
          selectedAction.action();
          setShowCommandPalette(false);
        }
      }
    };

    window.addEventListener("keydown", onPaletteKeyDown);

    return () => {
      window.removeEventListener("keydown", onPaletteKeyDown);
    };
  }, [commandActions, selectedCommandIndex, showCommandPalette]);

  const showNudge = composerText.length >= 20 && !dismissedNudge;


  const filteredCommentCount = flattenCount(sortedCommentTree);
  const visibleCompareCriteriaCount = useMemo(() => {
    if (thread.category !== "compare") {
      return 0;
    }

    const data = thread.categoryData as CompareThreadData;

    return data.criteria.filter((criterion) => {
      if (!showDiffOnly) {
        return true;
      }

      const scores = Object.values(data.scores[criterion.key]);
      return Math.max(...scores) - Math.min(...scores) > data.similarRowThreshold;
    }).length;
  }, [showDiffOnly, thread.category, thread.categoryData]);

  const hiddenSimilarRowsCount =
    thread.category === "compare"
      ? Math.max(0, (thread.categoryData as CompareThreadData).criteria.length - visibleCompareCriteriaCount)
      : 0;
  const canonicalUpdatesCount = (thread.alien?.updates.length ?? 0) + (thread.header.updatedSinceOriginalCount ?? 0);

  const onHoverPreviewStart = useCallback((threadId: string) => {
    if (hoverPreviewTimerRef.current) {
      window.clearTimeout(hoverPreviewTimerRef.current);
    }

    hoverPreviewTimerRef.current = window.setTimeout(() => {
      setHoverPreview(threadId);
      hoverPreviewTimerRef.current = null;
    }, HOVER_PREVIEW_DELAY_MS);
  }, []);

  const onHoverPreviewEnd = useCallback(() => {
    if (hoverPreviewTimerRef.current) {
      window.clearTimeout(hoverPreviewTimerRef.current);
      hoverPreviewTimerRef.current = null;
    }

    setHoverPreview(null);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverPreviewTimerRef.current) {
        window.clearTimeout(hoverPreviewTimerRef.current);
      }
    };
  }, []);


  const openQuestionsWithTargets = thread.insights.openQuestions.map((item) => {
    const targetId = item.commentId;
    const isTargetVisible = targetId
      ? commentsToRender.some((comment) => comment.id === targetId)
      : false;

    return {
      ...item,
      isTargetVisible,
    };
  });

  const hoverThreadPreview = useMemo(
    () => (hoverPreview ? getHoverThreadPreview(hoverPreview) : null),
    [hoverPreview],
  );

  const reviewWeightTotal = Object.values(reviewWeights).reduce((acc, weight) => acc + weight, 0);

  const weightedScore =
    thread.category === "review"
      ? (thread.categoryData as ReviewThreadData).criteria.reduce((acc, criterion) => {
          const effectiveWeight = reviewAdjustOpen
            ? reviewWeightTotal > 0
              ? (reviewWeights[criterion.label] ?? criterion.weight) / reviewWeightTotal
              : 0
            : criterion.weight / 100;

          return acc + criterion.score * effectiveWeight;
        }, 0)
      : 0;

  const renderInsightRail = ({ mobile = false }: { mobile?: boolean } = {}) => (
    <div className="space-y-3 rounded-[12px] border border-[var(--border-default)] p-3">
      <p className="text-xs font-semibold text-[var(--text-primary)]">Insight rail</p>
      <p className="text-xs text-[var(--text-secondary)]">{thread.insights.summary}</p>

      {thread.category === "news" && mode === "max" ? (
        <div>
          <p className="text-[11px] font-semibold text-[var(--text-primary)]">Sentiment pulse</p>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--bg-overlay)]">
            <div className="h-full bg-[var(--feedback-success)]" style={{ width: `${(thread.categoryData as NewsThreadData).sentimentPulse.positive}%` }} />
            <div className="h-full bg-[var(--text-muted)]" style={{ width: `${(thread.categoryData as NewsThreadData).sentimentPulse.neutral}%` }} />
            <div className="h-full bg-[var(--feedback-error)]" style={{ width: `${(thread.categoryData as NewsThreadData).sentimentPulse.negative}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            Positive {(thread.categoryData as NewsThreadData).sentimentPulse.positive}% · Neutral {(thread.categoryData as NewsThreadData).sentimentPulse.neutral}% · Negative {(thread.categoryData as NewsThreadData).sentimentPulse.negative}%
          </p>
        </div>
      ) : null}

      <div>
        <p className="text-[11px] font-semibold text-[var(--text-primary)]">Key agreements</p>
        <ul className="mt-1 space-y-1 text-[11px] text-[var(--text-secondary)]">
          {thread.insights.keyAgreements.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-[11px] font-semibold text-[var(--text-primary)]">Open questions</p>
        <ul className="mt-1 space-y-1 text-[11px] text-[var(--text-secondary)]">
          {openQuestionsWithTargets.map((item) => (
            <li key={item.id}>
              {item.commentId && item.isTargetVisible ? (
                <button
                  type="button"
                  onClick={() => document.getElementById(item.commentId!)?.scrollIntoView({ behavior: "smooth", block: "center" })}
                  className="text-left text-[var(--brand-primary)] hover:underline"
                >
                  • {item.question}
                </button>
              ) : (
                <>• {item.question}</>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-[8px] bg-[var(--bg-overlay)] px-2 py-2 text-[11px] text-[var(--text-secondary)]">
        Top contributor: {usersById.get(thread.insights.topContributor.userId)?.name ?? "Unknown"}
        <p className="mt-1">“{thread.insights.topContributor.excerpt}”</p>
      </div>

      {thread.category === "help" && mode === "max" ? (
        <div>
          <p className="text-[11px] font-semibold text-[var(--text-primary)]">Similar solved threads</p>
          <div className="mt-1 space-y-1">
            {(thread.categoryData as HelpThreadData).similarSolvedThreads.map((item) => (
              <Link key={item.id} href={`/discussion/${item.id}`} className="block rounded-[6px] bg-[var(--bg-overlay)] px-2 py-1 text-[11px] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]">
                {item.title} · ✅ Solved · {item.solveTime}
                <p className="text-[10px] text-[var(--text-muted)]">{item.snippet}</p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <p className="text-[11px] font-semibold text-[var(--text-primary)]">Thread genealogy</p>
        <div className="mt-1 space-y-1 text-[11px] text-[var(--text-secondary)]">
          {thread.insights.genealogy.buildsOn.map((item) => (
            <Link key={item.id} href={`/discussion/${item.id}`} className="block rounded-[6px] bg-[var(--bg-overlay)] px-2 py-1 hover:bg-[var(--bg-surface)]">
              Builds on: {item.title}
            </Link>
          ))}
          {thread.insights.genealogy.contradicts.map((item) => (
            <Link key={item.id} href={`/discussion/${item.id}`} className="block rounded-[6px] bg-[var(--bg-overlay)] px-2 py-1 hover:bg-[var(--bg-surface)]">
              Contradicts: {item.title}
            </Link>
          ))}
          {thread.insights.genealogy.canonical ? (
            <Link href={`/discussion/${thread.insights.genealogy.canonical.id}`} className="block rounded-[6px] bg-[var(--bg-overlay)] px-2 py-1 hover:bg-[var(--bg-surface)]">
              Canonical discussion exists: {thread.insights.genealogy.canonical.title}
            </Link>
          ) : null}
        </div>
      </div>

      {thread.alien?.serendipity.length ? (
        <div>
          <p className="text-[11px] font-semibold text-[var(--text-primary)]">You might also find interesting</p>
          <div className="mt-1 space-y-1">
            {thread.alien.serendipity.map((item) => (
              <Link key={item.id} href={`/discussion/${item.id}`} className="block rounded-[6px] bg-[var(--bg-overlay)] px-2 py-1 text-[11px] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]">
                {item.title} ({item.category})
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {mobile ? (
        <Button size="xs" variant="secondary" onClick={() => setMobileInsightOpen(false)}>
          Close insight rail
        </Button>
      ) : null}
    </div>
  );

  const renderComment = (node: ThreadCommentNode) => {
    const vote = commentVotes[node.id] ?? { up: 0, down: 0, mine: 0 as 1 | -1 | 0 };
    const user = usersById.get(node.authorId) ?? null;
    const isDepthLimited = mode === "min" ? node.depth >= 3 : node.depth >= 5;
    const isExpanded = expandedDepthBranches[node.id] ?? false;
    const replyOpen = replyOpenFor === node.id;

    return (
      <div key={node.id} className={cn("space-y-2", highlightedAnnotationCommentId === node.id && "scroll-mt-24")}>
        <div
          className={cn(
            "rounded-[14px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3",
            node.isSolution && "border-l-4 border-l-[var(--feedback-success)]",
            highlightedAnnotationCommentId === node.id && "border-[var(--brand-primary)] shadow-[0_0_0_1px_var(--brand-primary)]",
          )}
          style={{ marginLeft: node.depth * 14 }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserAvatar user={user} size="sm" />
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  {user?.name ?? "Unknown"} <span className="font-mono text-[11px] text-[var(--text-muted)]">@{user?.handle ?? "unknown"}</span>
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {formatRelativeDate(node.createdAt)} {node.isOpReply ? "· OP" : ""}
                </p>
              </div>
            </div>
            <button className="rounded-full p-1 hover:bg-[var(--bg-overlay)]" type="button">
              <MoreHorizontal className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            </button>
          </div>

          {node.isSolution ? (
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[var(--feedback-success)]/20 px-2 py-1 text-[11px] font-semibold text-[var(--feedback-success)]">
              <CheckCircle2 className="h-3 w-3" /> Solution
            </div>
          ) : null}

          <div className="mt-2">
            <MarkdownLite value={node.body} />
          </div>

          {node.intentTag ? (
            <div className="mt-2 inline-flex rounded-full border border-[var(--border-subtle)] px-2 py-1 text-[11px] text-[var(--text-muted)]">
              {node.intentTag}
            </div>
          ) : null}

          {mode === "max" && thread.category === "showcase" && node.annotation ? (
            <div className="mt-2">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-[var(--brand-primary)]/40 px-2 py-1 text-[10px] text-[var(--brand-primary)] hover:bg-[var(--bg-overlay)]"
                onClick={() => {
                  const data = thread.categoryData as ShowcaseThreadData;
                  const mediaIndex = data.media.findIndex((item) => item.id === node.annotation?.mediaId);
                  if (mediaIndex >= 0) {
                    setActiveShowcaseMedia(mediaIndex);
                  }
                  setHighlightedAnnotationCommentId(node.id);
                }}
              >
                <ChevronRight className="h-3 w-3" /> See in media
              </button>
            </div>
          ) : null}

          {node.fallacyTags?.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {node.fallacyTags.map((tag) => (
                <span key={tag} className="rounded-full border border-[var(--feedback-warning)]/40 bg-[var(--feedback-warning)]/10 px-2 py-1 text-[10px] text-[var(--feedback-warning)]">
                  {tag} · {node.fallacyCount ?? 1}
                </span>
              ))}
            </div>
          ) : null}

          {node.candidateShowcaseProof?.length && mode === "max" ? (
            <div className="mt-3 rounded-[10px] border border-[var(--border-default)] p-2">
              <p className="text-[11px] font-semibold text-[var(--text-primary)]">Proof of Work</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {node.candidateShowcaseProof.map((proof) => (
                  <Link key={proof.id} href={proof.href} className="rounded-[8px] border border-[var(--border-subtle)] px-2 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)]">
                    {proof.title}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-3 flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => onVoteComment(node.id, 1)}
              className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1 hover:bg-[var(--bg-overlay)]", vote.mine === 1 && "text-[var(--brand-primary)]")}
            >
              <ArrowUp className="h-3.5 w-3.5" /> {node.upvotes + vote.up}
            </button>
            <button
              type="button"
              onClick={() => onVoteComment(node.id, -1)}
              className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1 hover:bg-[var(--bg-overlay)]", vote.mine === -1 && "text-[var(--feedback-error)]")}
            >
              <ChevronDown className="h-3.5 w-3.5" /> {node.downvotes + vote.down}
            </button>
            <button
              type="button"
              onClick={() => setReplyOpenFor((current) => (current === node.id ? null : node.id))}
              className="rounded-full px-2 py-1 hover:bg-[var(--bg-overlay)]"
            >
              Reply
            </button>
          </div>

          {replyOpen ? (
            <div className="mt-3 rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-overlay)] p-3">
              {mode === "max" ? (
                <div className="mb-2 flex flex-wrap gap-2">
                  {intentOptions.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setSelectedIntent(item.value)}
                      className={cn(
                        "rounded-full border px-2 py-1 text-[11px]",
                        selectedIntent === item.value
                          ? "border-[var(--brand-primary)] text-[var(--brand-primary)]"
                          : "border-[var(--border-default)] text-[var(--text-muted)]",
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              ) : null}
              <textarea
                className="min-h-[84px] w-full rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-active)]"
                placeholder="Reply to this comment"
                value={composerText}
                onChange={(event) => setComposerText(event.target.value)}
              />
              <div className="mt-2 flex justify-end">
                <Button
                  size="sm"
                  onClick={() => setReplyOpenFor(null)}
                  disabled={!composerText.trim()}
                >
                  Reply
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        {node.children.length ? (
          <div className="space-y-2">
            {(isDepthLimited && !isExpanded ? [] : node.children).map((child) => renderComment(child))}
            {isDepthLimited && !isExpanded ? (
              <button
                type="button"
                onClick={() =>
                  setExpandedDepthBranches((current) => ({
                    ...current,
                    [node.id]: true,
                  }))
                }
                className="ml-6 text-xs text-[var(--brand-primary)] hover:underline"
              >
                Continue this thread →
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  };

  const renderCategoryBody = () => {
    switch (thread.category) {
      case "news": {
        const data = thread.categoryData as NewsThreadData;
        return (
          <Card>
            <CardContent className="space-y-4 pt-4">
              <div className="rounded-[12px] border border-[var(--border-default)] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {data.source.faviconUrl ? (
                      <Image src={data.source.faviconUrl} alt={data.source.name} width={20} height={20} className="h-5 w-5 rounded" />
                    ) : null}
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{data.source.name}</p>
                  </div>
                  {data.source.readOriginalUrl ? (
                    <a href={data.source.readOriginalUrl} target="_blank" rel="noreferrer" className="text-xs text-[var(--brand-primary)] hover:underline">
                      Read original →
                    </a>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Published {formatRelativeDate(data.source.publishedAt)}
                </p>
              </div>

              <div className="space-y-2">
                {data.corroboration.length ? (
                  data.corroboration.map((source) => (
                    <div key={source.name} className="flex flex-wrap items-center gap-2 rounded-[10px] border border-[var(--border-subtle)] px-3 py-2 text-xs">
                      <span className="font-semibold text-[var(--text-primary)]">{source.name}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-1",
                          source.stance === "confirms" && "bg-[var(--feedback-success)]/15 text-[var(--feedback-success)]",
                          source.stance === "skeptical" && "bg-[var(--feedback-warning)]/15 text-[var(--feedback-warning)]",
                          source.stance === "contradicts" && "bg-[var(--feedback-error)]/15 text-[var(--feedback-error)]",
                        )}
                      >
                        {source.stance}
                      </span>
                      {mode === "max" && source.credibility ? (
                        <span
                          className="rounded-full border border-[var(--border-default)] px-2 py-1 text-[var(--text-muted)]"
                          title={sourceCredibilityDescriptions[source.credibility]}
                        >
                          {source.credibility}
                        </span>
                      ) : null}
                      <span className="text-[var(--text-secondary)]">{source.claim}</span>
                    </div>
                  ))
                ) : (
                  <p className="rounded-[10px] border border-dashed border-[var(--border-default)] px-3 py-2 text-xs text-[var(--text-muted)]">
                    No corroboration added yet. Know another source? Add it.
                  </p>
                )}
              </div>

              {mode === "max" ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[10px] border border-[var(--border-default)] p-3">
                    <p className="text-xs font-semibold text-[var(--text-primary)]">Event timeline</p>
                    <div className="mt-2 space-y-2 text-xs text-[var(--text-secondary)]">
                      {data.timeline.map((item) => (
                        <div key={item.id} className="rounded-[8px] bg-[var(--bg-overlay)] px-2 py-1">
                          {item.label} · {formatRelativeDate(item.at)}
                        </div>
                      ))}
                    </div>
                  </div>
                  {data.conflictingReports.length ? (
                    <div className="rounded-[10px] border border-[var(--feedback-error)]/35 p-3">
                      <p className="text-xs font-semibold text-[var(--feedback-error)]">Conflicting reports</p>
                      {data.conflictingReports.map((entry, index) => (
                        <div key={index} className="mt-2 grid gap-2 text-xs md:grid-cols-2">
                          <div className="rounded-[8px] bg-[var(--bg-overlay)] p-2">
                            <p className="font-semibold text-[var(--text-primary)]">{entry.leftSource}</p>
                            <p className="text-[var(--text-secondary)]">{entry.leftClaim}</p>
                          </div>
                          <div className="rounded-[8px] bg-[var(--bg-overlay)] p-2">
                            <p className="font-semibold text-[var(--text-primary)]">{entry.rightSource}</p>
                            <p className="text-[var(--text-secondary)]">{entry.rightClaim}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      }
      case "review": {
        const data = thread.categoryData as ReviewThreadData;
        return (
          <Card>
            <CardContent className="space-y-4 pt-4">
              <div className="sticky top-[5.5rem] rounded-[12px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{data.productName}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{data.reviewerContextNote}</p>
                <a href={data.productUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs text-[var(--brand-primary)] hover:underline">
                  Visit product →
                </a>
              </div>

              <div className="rounded-[12px] border border-[var(--border-default)] p-3">
                <p className="text-lg font-semibold text-[var(--text-primary)]">{data.verdict.rating.toFixed(1)}/5</p>
                <p className={cn("text-sm font-semibold", pickVerdictTone(data.verdict.label))}>{data.verdict.label.replace("-", " ")}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{data.verdict.rationale}</p>
              </div>

              <div className="space-y-2 rounded-[12px] border border-[var(--border-default)] p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Adjust for my use case</p>
                  <button
                    type="button"
                    onClick={() => setReviewAdjustOpen((current) => !current)}
                    className={cn(
                      "rounded-full border px-2 py-1 text-xs",
                      reviewAdjustOpen
                        ? "border-[var(--brand-primary)] text-[var(--brand-primary)]"
                        : "border-[var(--border-default)] text-[var(--text-muted)]",
                    )}
                  >
                    {reviewAdjustOpen ? "On" : "Off"}
                  </button>
                </div>

                {data.criteria.map((criterion) => {
                  const fallbackWeight = criterion.weight;
                  const weight = reviewWeights[criterion.label] ?? fallbackWeight;
                  return (
                    <div key={criterion.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-primary)]">{criterion.label}</span>
                        <span className="text-[var(--text-muted)]">
                          {criterion.score.toFixed(1)} · {weight}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--bg-overlay)]">
                        <div className="h-2 rounded-full bg-[var(--brand-primary)] transition-all duration-500" style={{ width: `${criterion.score * 20}%` }} />
                      </div>
                      {reviewAdjustOpen ? (
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={weight}
                          onChange={(event) =>
                            setReviewWeights((current) => ({
                              ...current,
                              [criterion.label]: Number(event.target.value),
                            }))
                          }
                          className="w-full"
                        />
                      ) : null}
                    </div>
                  );
                })}

                <p className="pt-2 text-sm font-semibold text-[var(--text-primary)]">
                  Weighted score: {weightedScore.toFixed(2)} / 5
                </p>

                {reviewAdjustOpen ? (
                  <Button size="xs" variant="secondary" onClick={() => setReviewWeights({})}>
                    Reset to reviewer weights
                  </Button>
                ) : null}
              </div>

              {mode === "max" ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[10px] border border-[var(--border-default)] p-3 text-xs text-[var(--text-secondary)]">
                    <p className="mb-2 font-semibold text-[var(--text-primary)]">Reviewer context</p>
                    {data.reviewerContext.map((item) => (
                      <span key={item} className="mb-2 mr-2 inline-flex rounded-full border border-[var(--border-subtle)] px-2 py-1">
                        {item}
                      </span>
                    ))}
                  </div>
                  <div className="rounded-[10px] border border-[var(--border-default)] p-3 text-xs">
                    <p className="font-semibold text-[var(--text-primary)]">Community sentiment</p>
                    <p className="mt-1 text-[var(--text-secondary)]">Agree {data.communitySentiment.agreePct}% · Disagree {data.communitySentiment.disagreePct}%</p>
                    <p className="mt-2 text-[var(--text-muted)]">“{data.communitySentiment.topAgreeQuote}”</p>
                    <p className="mt-2 text-[var(--text-muted)]">“{data.communitySentiment.topDisagreeQuote}”</p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      }
      case "compare": {
        const data = thread.categoryData as CompareThreadData;
        const criteria = data.criteria.filter((criterion) => {
          if (!showDiffOnly) return true;
          const scores = Object.values(data.scores[criterion.key]);
          return Math.max(...scores) - Math.min(...scores) > data.similarRowThreshold;
        });

        const scenario = data.scenarios[activeScenario] ?? data.scenarios[0];

        return (
          <Card>
            <CardContent className="space-y-4 pt-4">
              <div className="overflow-x-auto rounded-[12px] border border-[var(--border-default)]">
                <table className="w-full min-w-[640px] text-xs">
                  <thead>
                    <tr className="bg-[var(--bg-overlay)] text-left text-[var(--text-muted)]">
                      <th className="sticky left-0 bg-[var(--bg-overlay)] px-3 py-2">Criteria</th>
                      {data.options.map((option) => (
                        <th key={option.id} className="px-3 py-2">
                          {option.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {criteria.map((criterion) => {
                      const row = data.scores[criterion.key];
                      const maxValue = Math.max(...Object.values(row));
                      const weight = compareWeights[criterion.key] ?? 20;
                      return (
                        <tr key={criterion.key} className="border-t border-[var(--border-subtle)]">
                          <td className="sticky left-0 bg-[var(--bg-surface)] px-3 py-2 text-[var(--text-primary)]">{criterion.label}</td>
                          {data.options.map((option) => {
                            const weighted = row[option.id] * (weight / 20);
                            return (
                              <td
                                key={option.id}
                                className={cn(
                                  "px-3 py-2 text-[var(--text-secondary)]",
                                  row[option.id] === maxValue && "font-semibold text-[var(--brand-primary)]",
                                )}
                              >
                                {weighted.toFixed(1)}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {data.verdictCards.map((card) => {
                  const option = data.options.find((item) => item.id === card.optionId);
                  return (
                    <div key={card.optionId} className="rounded-[10px] border border-[var(--border-default)] p-3 text-xs">
                      <p className="font-semibold text-[var(--text-primary)]">{option?.name}</p>
                      <p className="mt-1 text-[var(--text-secondary)]">Score {card.overallScore.toFixed(1)}</p>
                      <p className="mt-1 text-[var(--text-muted)]">Best for: {card.bestFor}</p>
                      {card.communityPick ? (
                        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[var(--brand-primary)]/15 px-2 py-1 text-[var(--brand-primary)]">
                          <Trophy className="h-3 w-3" /> Community Pick
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {mode === "max" ? (
                <div className="space-y-3 rounded-[12px] border border-[var(--border-default)] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {data.scenarios.map((item, index) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveScenario(index)}
                        className={cn(
                          "rounded-full border px-2 py-1 text-xs",
                          index === activeScenario
                            ? "border-[var(--brand-primary)] text-[var(--brand-primary)]"
                            : "border-[var(--border-default)] text-[var(--text-muted)]",
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Recommended: {data.options.find((option) => option.id === scenario.recommendedOptionId)?.name} — {scenario.rationale}
                  </p>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-[var(--text-primary)]">My priorities</p>
                    {data.criteria.map((criterion) => {
                      const value = compareWeights[criterion.key] ?? 20;
                      return (
                        <label key={criterion.key} className="block text-xs text-[var(--text-secondary)]">
                          <div className="mb-1 flex items-center justify-between">
                            <span>{criterion.label}</span>
                            <span>{value}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={value}
                            onChange={(event) =>
                              setCompareWeights((current) => ({
                                ...current,
                                [criterion.key]: Number(event.target.value),
                              }))
                            }
                            className="w-full"
                          />
                        </label>
                      );
                    })}
                    <Button size="xs" variant="secondary" onClick={() => setCompareWeights({})}>
                      Reset
                    </Button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDiffOnly((current) => !current)}
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--border-default)] px-2 py-1 text-xs text-[var(--text-muted)]"
                  >
                    <Filter className="h-3 w-3" /> {showDiffOnly ? "Show all rows" : "Show differences only"}
                  </button>
                  {showDiffOnly ? (
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Hiding {hiddenSimilarRowsCount} similar rows — show all
                    </p>
                  ) : null}
                  {mode === "max" && data.communityOverride ? (
                    <div className="space-y-2 rounded-[10px] border border-[var(--border-default)] p-2 text-xs">
                      <p className="font-semibold text-[var(--text-primary)]">Community says</p>
                      {data.criteria.map((criterion) => {
                        const authorRow = data.scores[criterion.key];
                        const communityRow = data.communityOverride?.[criterion.key];

                        if (!communityRow) {
                          return null;
                        }

                        return (
                          <div key={criterion.key} className="rounded-[8px] bg-[var(--bg-overlay)] p-2">
                            <p className="font-medium text-[var(--text-primary)]">{criterion.label}</p>
                            <div className="mt-1 grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Author</p>
                                <p className="text-[var(--text-secondary)]">
                                  {data.options
                                    .map((option) => `${option.name}: ${authorRow[option.id].toFixed(1)}`)
                                    .join(" · ")}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">Community</p>
                                <p className="text-[var(--text-secondary)]">
                                  {data.options
                                    .map((option) => {
                                      const authorScore = authorRow[option.id];
                                      const communityScore = communityRow[option.id];
                                      const diverges = Math.abs(authorScore - communityScore) >= 1;

                                      return `${option.name}: ${communityScore.toFixed(1)}${diverges ? " ↑" : ""}`;
                                    })
                                    .join(" · ")}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      }
      case "launch-pad": {
        const data = thread.categoryData as LaunchpadThreadData;
        return (
          <Card>
            <CardContent className="space-y-4 pt-4">
              <div className="overflow-hidden rounded-[12px] border border-[var(--border-default)]">
                <Image
                  src={data.media.url}
                  alt={data.productName}
                  width={1400}
                  height={788}
                  className="h-auto w-full object-cover"
                />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold text-[var(--text-primary)]">{data.productName}</p>
                  <span className="rounded-full border border-[var(--border-default)] px-2 py-1 text-xs text-[var(--text-muted)]">{data.stage}</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">{data.tagline}</p>
                <div className="flex items-center gap-2">
                  <Button size="sm">{data.primaryCtaLabel}</Button>
                  <a className="text-xs text-[var(--brand-primary)] hover:underline" href={data.secondaryUrl} target="_blank" rel="noreferrer">
                    Visit product →
                  </a>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-[10px] border border-[var(--border-subtle)] p-2 text-xs">Upvotes {formatCompactNumber(thread.header.upvotes)}</div>
                <div className="rounded-[10px] border border-[var(--border-subtle)] p-2 text-xs">Comments {comments.length}</div>
                <div className="rounded-[10px] border border-[var(--border-subtle)] p-2 text-xs">Waitlist {formatCompactNumber(data.waitlistSignups ?? 0)}</div>
              </div>
              <div className="rounded-[12px] border border-l-4 border-l-[var(--brand-primary)] border-[var(--border-default)] p-3">
                <p className="text-xs font-semibold text-[var(--text-primary)]">From the maker</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{data.makerNote}</p>
              </div>
              <div className="rounded-[10px] border border-[var(--border-default)] p-3">
                <p className="text-xs font-semibold text-[var(--text-primary)]">What I need feedback on</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {data.feedbackFocusAreas.map((item) => (
                    <span key={item} className="rounded-full border border-[var(--border-default)] px-2 py-1 text-xs text-[var(--text-muted)]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              {mode === "max" ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[10px] border border-[var(--border-default)] p-3">
                    <p className="text-xs font-semibold text-[var(--text-primary)]">Milestones</p>
                    <div className="mt-2 space-y-2 text-xs text-[var(--text-secondary)]">
                      {data.milestones.map((item) => (
                        <div key={item.id} className="rounded-[8px] bg-[var(--bg-overlay)] px-2 py-1">
                          {item.title} · {item.date} {item.upcoming ? "(Upcoming)" : ""}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[10px] border border-[var(--border-default)] p-3">
                    <p className="text-xs font-semibold text-[var(--text-primary)]">Changelog</p>
                    <div className="mt-2 space-y-2 text-xs text-[var(--text-secondary)]">
                      {data.changelog.map((item) => (
                        <div key={item.version} className="rounded-[8px] bg-[var(--bg-overlay)] px-2 py-1">
                          {item.version} · {item.date} · {item.note}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {data.builtWith.map((item) => (
                        <span key={item} className="rounded-full border border-[var(--border-default)] px-2 py-1 text-[11px] text-[var(--text-muted)]">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      }
      case "debate": {
        const data = thread.categoryData as DebateThreadData;
        const distribution = debateDistribution ?? data.voteDistribution;
        return (
          <Card>
            <CardContent className="space-y-4 pt-4">
              <div className="rounded-[12px] border border-[var(--border-default)] p-3">
                <p className="text-sm font-semibold text-[var(--text-primary)]">“{data.proposition}”</p>
                <span className="mt-2 inline-flex rounded-full border border-[var(--border-default)] px-2 py-1 text-xs text-[var(--text-muted)]">{data.status}</span>
              </div>

              <div className="rounded-[10px] border border-[var(--border-default)] p-3">
                <div className="flex h-2 overflow-hidden rounded-full bg-[var(--bg-overlay)]">
                  <div className="bg-[var(--feedback-success)]" style={{ width: `${distribution.agree}%` }} />
                  <div className="bg-[var(--feedback-error)]" style={{ width: `${distribution.disagree}%` }} />
                  <div className="bg-[var(--text-muted)]" style={{ width: `${distribution.abstain}%` }} />
                </div>
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  Agree {distribution.agree}% · Disagree {distribution.disagree}% · Abstain {distribution.abstain}% · {formatCompactNumber(distribution.total)} votes
                </p>
                <div className="mt-2 flex gap-2">
                  {(["agree", "disagree", "abstain"] as const).map((item) => (
                    <Button
                      key={item}
                      size="xs"
                      variant={debateVote === item ? "primary" : "secondary"}
                      disabled={data.status === "closed"}
                      onClick={() => onDebateVote(item)}
                    >
                      {item}
                    </Button>
                  ))}
                </div>
                {mode === "max" ? <p className="mt-2 text-xs text-[var(--text-muted)]">Minds changed: {mindChanges}</p> : null}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {(["for", "against"] as const).map((side) => (
                  <div key={side} className="space-y-2 rounded-[10px] border border-[var(--border-default)] p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{side}</p>
                    {data.arguments
                      .filter((arg) => arg.side === side)
                      .map((arg) => (
                        <div key={arg.id} className="rounded-[8px] bg-[var(--bg-overlay)] px-2 py-2 text-xs text-[var(--text-secondary)]">
                          <p className="font-semibold text-[var(--text-primary)]">{arg.claim}</p>
                          <p className="mt-1">{arg.strength} · {arg.upvotes} upvotes</p>
                        </div>
                      ))}
                    <Button size="xs" variant="secondary" onClick={() => toggleAuthGate(() => undefined)}>
                      Add argument
                    </Button>
                  </div>
                ))}
              </div>

              {mode === "max" ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[10px] border border-[var(--border-default)] p-3 text-xs">
                    <p className="font-semibold text-[var(--text-primary)]">Argument tree</p>
                    <div className="mt-2 space-y-2 text-[var(--text-secondary)]">
                      {data.argumentTree.map((node) => (
                        <div key={node.id} className="rounded-[8px] bg-[var(--bg-overlay)] px-2 py-1">
                          {node.relation}: {node.claim}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[10px] border border-[var(--border-default)] p-3 text-xs">
                    <p className="font-semibold text-[var(--text-primary)]">Common ground</p>
                    <ul className="mt-2 space-y-1 text-[var(--text-secondary)]">
                      {data.commonGround.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      }
      case "help": {
        const data = thread.categoryData as HelpThreadData;
        return (
          <Card>
            <CardContent className="space-y-4 pt-4">
              <div className="rounded-[12px] border border-[var(--border-default)] p-3">
                <p className="text-xs font-semibold text-[var(--text-primary)]">What I’m trying to do</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{data.problem.tryingToDo}</p>
                <p className="mt-3 text-xs font-semibold text-[var(--text-primary)]">What I’ve tried</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
                  {data.problem.tried.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs font-semibold text-[var(--text-primary)]">Where I’m stuck</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{data.problem.stuck}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.environment.map((item) => (
                    <span key={item} className="rounded-full border border-[var(--border-default)] px-2 py-1 text-xs text-[var(--text-muted)]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div
                className={cn(
                  "flex items-center justify-between rounded-[10px] border px-3 py-2 text-sm",
                  data.solved
                    ? "border-[var(--feedback-success)]/35 bg-[var(--feedback-success)]/10 text-[var(--feedback-success)]"
                    : "border-[var(--feedback-error)]/35 bg-[var(--feedback-error)]/10 text-[var(--feedback-error)]",
                )}
              >
                <span>{data.solved ? "Solved" : "Unsolved"}</span>
                {data.solved && data.solutionCommentId ? (
                  <button
                    type="button"
                    className="text-xs underline"
                    onClick={() => {
                      const targetId = data.solutionCommentId;
                      if (targetId) {
                        document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                  >
                    Jump to solution ↓
                  </button>
                ) : null}
              </div>

              {mode === "max" ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[10px] border border-[var(--border-default)] p-3 text-xs">
                    <p className="font-semibold text-[var(--text-primary)]">Reproducibility</p>
                    <p className="mt-1 text-[var(--text-secondary)]">{reproCount} others have this problem</p>
                    <Button
                      size="xs"
                      variant="secondary"
                      className="mt-2"
                      onClick={() => setReproCount((value) => value + 1)}
                    >
                      I have this too
                    </Button>
                  </div>
                  <div className="rounded-[10px] border border-[var(--border-default)] p-3 text-xs">
                    <p className="font-semibold text-[var(--text-primary)]">Troubleshooting path</p>
                    <ul className="mt-2 space-y-1 text-[var(--text-secondary)]">
                      {data.diagnosticPath.map((step) => (
                        <li key={step.label}>{step.state === "tried" ? "✓" : "○"} {step.label}</li>
                      ))}
                    </ul>
                    <p className="mt-2 font-semibold text-[var(--text-primary)]">Similar solved threads</p>
                    <div className="mt-1 space-y-1">
                      {data.similarSolvedThreads.map((item) => (
                        <Link key={item.id} href={`/discussion/${item.id}`} className="block rounded-[8px] bg-[var(--bg-overlay)] px-2 py-1 text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]">
                          {item.title} · {item.solveTime}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      }
      case "list": {
        const data = thread.categoryData as ListThreadData;
        const sortedItems = [...data.items].sort((a, b) => {
          if (listLens === "value") return a.rating - b.rating;
          if (listLens === "popular") return b.rating - a.rating;
          if (listLens === "beginner") return a.rank - b.rank;
          if (listLens === "custom") return b.name.localeCompare(a.name);
          return a.rank - b.rank;
        });

        return (
          <Card>
            <CardContent className="space-y-4 pt-4">
              <div className="rounded-[12px] border border-[var(--border-default)] p-3">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{data.purpose}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{data.targetAudience}</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{data.whyThisExists}</p>
              </div>
              <div className="rounded-[12px] border border-[var(--border-default)] p-3">
                <p className="text-xs font-semibold text-[var(--text-primary)]">Criteria</p>
                <ul className="mt-2 space-y-1 text-sm text-[var(--text-secondary)]">
                  {data.criteria.map((item) => (
                    <li key={item}>✓ {item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[10px] border border-[var(--border-default)] px-3 py-2 text-xs text-[var(--text-muted)]">
                Last updated {formatRelativeDate(data.lastUpdated)} · {data.contributors} contributors {data.ongoing ? "· Ongoing list" : ""}
              </div>

              {mode === "max" ? (
                <div className="flex flex-wrap gap-2">
                  {data.lenses.map((lens) => (
                    <button
                      key={lens.id}
                      type="button"
                      onClick={() => setListLens(lens.id)}
                      className={cn(
                        "rounded-full border px-2 py-1 text-xs",
                        listLens === lens.id
                          ? "border-[var(--brand-primary)] text-[var(--brand-primary)]"
                          : "border-[var(--border-default)] text-[var(--text-muted)]",
                      )}
                    >
                      {lens.label}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="space-y-2">
                {sortedItems.map((item) => (
                  <div key={item.id} className="rounded-[10px] border border-[var(--border-default)] p-3">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2"
                      onClick={() =>
                        setExpandedListItems((current) => ({
                          ...current,
                          [item.id]: !current[item.id],
                        }))
                      }
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-[var(--text-muted)]">{item.rank}</span>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{item.name}</p>
                          <p className="text-xs text-[var(--text-muted)]">{item.category} · {item.rating.toFixed(1)}★</p>
                        </div>
                      </div>
                      <span className="text-xs text-[var(--text-secondary)]">{expandedListItems[item.id] ? "Hide" : "Expand"}</span>
                    </button>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{item.note}</p>
                    {expandedListItems[item.id] ? <p className="mt-2 text-xs text-[var(--text-muted)]">{item.details}</p> : null}
                  </div>
                ))}
              </div>

              {mode === "max" ? (
                <div className="rounded-[10px] border border-[var(--border-default)] p-3">
                  <p className="text-xs font-semibold text-[var(--text-primary)]">Coverage gaps</p>
                  <div className="mt-2 space-y-2">
                    {data.coverageGaps.map((gap) => (
                      <div key={gap.id} className="rounded-[8px] bg-[var(--bg-overlay)] px-2 py-2 text-xs text-[var(--text-secondary)]">
                        <p>{gap.label}</p>
                        <button
                          type="button"
                          className="mt-1 text-[var(--brand-primary)] hover:underline"
                          onClick={() => setComposerText(gap.suggestionPrompt)}
                        >
                          Propose addition
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      }
      case "showcase": {
        const data = thread.categoryData as ShowcaseThreadData;
        const activeMedia = data.media[activeShowcaseMedia] ?? data.media[0];
        const clustered: Record<string, ThreadComment[]> = {
          UX: comments.filter((comment) => comment.body.toLowerCase().includes("ux") || comment.body.toLowerCase().includes("cta")),
          Visual: comments.filter((comment) => comment.body.toLowerCase().includes("visual") || comment.body.toLowerCase().includes("contrast")),
          Technical: comments.filter((comment) => comment.body.toLowerCase().includes("error") || comment.body.toLowerCase().includes("state")),
          Other: comments,
        };

        return (
          <Card>
            <CardContent className="space-y-4 pt-4">
              <div className="overflow-hidden rounded-[12px] border border-[var(--border-default)]">
                {activeMedia.type === "image" ? (
                  <div className={cn("relative", annotationMode && "cursor-crosshair")}>
                    <Image src={activeMedia.url} alt={activeMedia.caption} width={1400} height={900} className="w-full object-cover" />
                    {mode === "max"
                      ? data.annotatedAreas
                          .filter((area) => area.mediaId === activeMedia.id)
                          .map((area) => (
                            <span
                              key={area.commentId}
                              className={cn(
                                "absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--brand-primary)] shadow-[0_0_10px_rgba(14,165,233,0.6)]",
                                highlightedAnnotationCommentId === area.commentId && "h-4 w-4 ring-2 ring-[var(--brand-primary)] ring-offset-2 ring-offset-black/20",
                              )}
                              style={{ left: `${area.x}%`, top: `${area.y}%` }}
                            />
                          ))
                      : null}
                  </div>
                ) : null}
                <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-3 py-2">
                  <p className="text-xs text-[var(--text-muted)]">{activeMedia.caption}</p>
                  <button
                    type="button"
                    className="rounded-full border border-[var(--border-default)] px-2 py-1 text-xs text-[var(--text-muted)]"
                    onClick={() => setAnnotationMode((current) => !current)}
                  >
                    Comment on this
                  </button>
                </div>
              </div>

              <div className="flex snap-x gap-2 overflow-x-auto pb-1">
                {data.media.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveShowcaseMedia(index)}
                    className={cn(
                      "snap-start rounded-[10px] border px-2 py-2 text-xs",
                      index === activeShowcaseMedia
                        ? "border-[var(--brand-primary)] text-[var(--brand-primary)]"
                        : "border-[var(--border-default)] text-[var(--text-muted)]",
                    )}
                  >
                    {item.type} {index + 1}
                  </button>
                ))}
              </div>

              <div className="rounded-[10px] border border-[var(--border-default)] p-3">
                <p className="text-xs font-semibold text-[var(--text-primary)]">Creator’s intent</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{data.creatorIntent}</p>
              </div>

              <div className="rounded-[10px] border border-[var(--border-default)] p-3">
                <p className="text-xs font-semibold text-[var(--text-primary)]">Feedback requested on</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {data.feedbackTags.map((item) => (
                    <span key={item} className="rounded-full border border-[var(--border-default)] px-2 py-1 text-xs text-[var(--text-muted)]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[10px] border border-[var(--border-default)] p-3 text-xs text-[var(--text-secondary)]">
                <p className="font-semibold text-[var(--text-primary)]">Version timeline</p>
                <div className="mt-2 space-y-2">
                  {data.versions.map((version) => (
                    <div key={version.label} className={cn("rounded-[8px] px-2 py-1", version.current ? "bg-[var(--brand-primary)]/12" : "bg-[var(--bg-overlay)]")}>
                      {version.label} · {version.date} · {version.note}
                    </div>
                  ))}
                </div>
              </div>

              {mode === "max" ? (
                <div className="rounded-[10px] border border-[var(--border-default)] p-3">
                  <div className="flex gap-2">
                    <Button size="xs" variant={showcaseView === "chronological" ? "primary" : "secondary"} onClick={() => setShowcaseView("chronological")}>Chronological</Button>
                    <Button size="xs" variant={showcaseView === "cluster" ? "primary" : "secondary"} onClick={() => setShowcaseView("cluster")}>Feedback by theme</Button>
                  </div>
                  {showcaseView === "cluster" ? (
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      {Object.entries(clustered).map(([label, entries]) => (
                        <div key={label} className="rounded-[8px] bg-[var(--bg-overlay)] p-2 text-xs text-[var(--text-secondary)]">
                          <p className="font-semibold text-[var(--text-primary)]">{label}</p>
                          <p>{entries.length} comments</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      }
      case "gigs": {
        const data = thread.categoryData as GigThreadData;
        const requiredSkills = data.skills.filter((item) => item.required);
        const matched = requiredSkills.filter((skill) => fitSelections[skill.label]).length;

        return (
          <Card>
            <CardContent className="space-y-4 pt-4">
              <div className="rounded-[12px] border border-[var(--border-default)] p-3">
                <p className="text-lg font-semibold text-[var(--text-primary)]">{data.roleTitle}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-[var(--border-default)] px-2 py-1">{data.employmentType}</span>
                  <span className="rounded-full border border-[var(--border-default)] px-2 py-1">{data.location}</span>
                  <span className="rounded-full border border-[var(--border-default)] px-2 py-1">{data.compensationRange}</span>
                  <span className="rounded-full border border-[var(--border-default)] px-2 py-1">{data.durationOrStart}</span>
                </div>
              </div>

              <div className="space-y-2 rounded-[10px] border border-[var(--border-default)] p-3">
                <p className="text-xs font-semibold text-[var(--text-primary)]">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {data.skills.map((item) => (
                    <span
                      key={item.label}
                      className={cn(
                        "rounded-full px-2 py-1 text-xs",
                        item.required
                          ? "border border-[var(--border-default)] bg-[var(--bg-overlay)] text-[var(--text-primary)]"
                          : "border border-dashed border-[var(--border-default)] text-[var(--text-muted)]",
                      )}
                    >
                      {item.required ? "Required" : "Preferred"} · {item.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[10px] border border-l-4 border-l-[var(--brand-primary)] border-[var(--border-default)] p-3">
                <p className="text-xs font-semibold text-[var(--text-primary)]">From the poster</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{data.posterNote}</p>
              </div>

              {data.status === "open" ? (
                <div className="space-y-2">
                  <Button className="h-11 w-full" onClick={() => toggleAuthGate(() => setShowApplyModal(true))}>
                    Apply now →
                  </Button>
                  <p className="text-center text-xs text-[var(--text-muted)]">
                    {data.applicantCount} applied · {data.status}
                  </p>
                </div>
              ) : (
                <div className="rounded-[10px] border border-[var(--feedback-error)]/30 bg-[var(--feedback-error)]/10 px-3 py-2 text-sm text-[var(--feedback-error)]">Position closed</div>
              )}

              <div className="rounded-[10px] border border-[var(--border-default)] p-3 text-xs text-[var(--text-secondary)]">
                Applied → Screening → Interview → Offer
                <p className="mt-1 text-[var(--text-primary)]">Current stage: {data.processStage}</p>
              </div>

              {mode === "max" ? (
                <div className="space-y-3 rounded-[10px] border border-[var(--border-default)] p-3 text-xs">
                  <p className="font-semibold text-[var(--text-primary)]">How well do you fit?</p>
                  {requiredSkills.map((item) => (
                    <label key={item.label} className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <input
                        type="checkbox"
                        checked={Boolean(fitSelections[item.label])}
                        onChange={(event) =>
                          setFitSelections((current) => ({
                            ...current,
                            [item.label]: event.target.checked,
                          }))
                        }
                      />
                      {item.label}
                    </label>
                  ))}
                  <p className="text-[var(--text-primary)]">You match {matched} of {requiredSkills.length} required skills.</p>
                  <p className="text-[var(--text-muted)]">
                    {matched >= requiredSkills.length - 1
                      ? "You're a strong fit → Apply"
                      : `Missing ${Math.max(0, requiredSkills.length - matched)} — consider applying anyway.`}
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--bg-overlay)]">
                    <div
                      className="h-full bg-[var(--brand-primary)] transition-[width] duration-300"
                      style={{ width: `${Math.min(100, (matched / Math.max(1, requiredSkills.length)) * 100)}%` }}
                    />
                  </div>

                  <div className="rounded-[8px] bg-[var(--bg-overlay)] px-2 py-2 text-[var(--text-secondary)]">
                    Market context: this gig offers {data.marketContext.currentRange}. Similar roles on the platform range {data.marketContext.platformRange}.
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      }
      default:
        return null;
    }
  };

  return (
    <section className="relative animate-route-emerge space-y-4">
      <div className="fixed left-0 right-0 top-[4.35rem] z-40 h-0.5 bg-transparent">
        <div className="h-full bg-[var(--brand-primary)] transition-[width] duration-200" style={{ width: `${scrollProgress}%` }} />
      </div>

      {thread.alien?.freshnessWarning && thread.alien.freshnessWarning.lastUpdatedDaysAgo >= 90 ? (
        <Card>
          <CardContent className="flex items-center justify-between gap-3 pt-4 text-xs text-[var(--text-muted)]">
            <span>
              Last updated {thread.alien.freshnessWarning.lastUpdatedDaysAgo} days ago — information may be outdated
            </span>
            <button
              type="button"
              className="rounded-full border border-[var(--border-default)] px-2 py-1"
              onClick={() => setRequestedUpdates((value) => value + 1)}
            >
              Request update ({requestedUpdates})
            </button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-default)] bg-[var(--bg-overlay)] px-2 py-1 text-xs text-[var(--text-secondary)]">
                  <CategoryIcon className="h-3.5 w-3.5" /> {thread.category}
                </span>
                <div className="min-w-0">
                  <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{thread.header.title}</h1>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                    <span className="inline-flex items-center gap-1">
                      <UserRound className="h-3.5 w-3.5" /> {author?.name ?? "Unknown"} @{author?.handle ?? "unknown"}
                    </span>
                    <span>{thread.header.reputationLabel}</span>
                    <span>{formatRelativeDate(thread.header.postedAt)}</span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" /> {formatCompactNumber(thread.header.views)}
                    </span>
                    {coAuthorLabel ? <span>Authored by {coAuthorLabel}</span> : null}
                  </div>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {mode === "max" && canManageThread ? (
                  <Button
                    size="xs"
                    variant="secondary"
                    disabled={isCoAuthorLoading}
                    onClick={() => {
                      setIsCoAuthorLoading(true);
                      window.setTimeout(() => {
                        setCoAuthors((current) =>
                          current.includes("u2") ? current : [...current, "u2"],
                        );
                        setIsCoAuthorLoading(false);
                      }, 2000);
                    }}
                  >
                    {isCoAuthorLoading ? "Inviting…" : "Request co-author"}
                  </Button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setMode("min")}
                  className={cn("rounded-full px-3 py-1 text-xs", mode === "min" ? "bg-[var(--brand-primary)] text-black" : "border border-[var(--border-default)] text-[var(--text-muted)]")}
                >
                  MIN
                </button>
                <button
                  type="button"
                  onClick={() => setMode("max")}
                  className={cn("rounded-full px-3 py-1 text-xs", mode === "max" ? "bg-[var(--brand-primary)] text-black" : "border border-[var(--border-default)] text-[var(--text-muted)]")}
                >
                  MAX
                </button>
                {thread.alien?.updates.length ? (
                  <button
                    type="button"
                    onClick={() => document.getElementById("living-op-updates")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    className="rounded-full border border-[var(--border-default)] px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]"
                  >
                    {canonicalUpdatesCount} updates since original
                  </button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {thread.header.tags.map((tag) => (
                  <button key={tag} type="button" className="rounded-full border border-[var(--border-default)] px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-overlay)]">
                    {tag}
                  </button>
                ))}
              </div>
              <div className="rounded-[12px] border border-[var(--border-default)] bg-[var(--bg-overlay)]/40 p-3">
                <p className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--text-primary)]">
                  <Bot className="h-3.5 w-3.5" /> AI Summary
                </p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{thread.header.aiSummary}</p>
              </div>

              {mode === "max" && thread.qualityDimensions ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(thread.qualityDimensions).map(([key, value]) => (
                    <div key={key} className="rounded-[10px] border border-[var(--border-default)] px-2 py-2 text-xs text-[var(--text-secondary)]">
                      <p className="font-semibold capitalize text-[var(--text-primary)]">{key}</p>
                      <div className="mt-1 h-2 rounded-full bg-[var(--bg-overlay)]">
                        <div className="h-2 rounded-full bg-[var(--brand-primary)]" style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={onToggleThreadUpvote}
                  className={cn("inline-flex items-center gap-1 rounded-full border border-[var(--border-default)] px-2 py-1", threadUpvoted && "text-[var(--brand-primary)]")}
                >
                  <ArrowUp className="h-3.5 w-3.5" /> {formatCompactNumber(threadUpvotes)}
                </button>
                <button
                  type="button"
                  onClick={() => document.getElementById("thread-comments")?.scrollIntoView({ behavior: "smooth" })}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--border-default)] px-2 py-1 text-[var(--text-muted)]"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> {formatCompactNumber(filteredCommentCount)}
                </button>
                <button
                  type="button"
                  onClick={onToggleBookmark}
                  className={cn("inline-flex items-center gap-1 rounded-full border border-[var(--border-default)] px-2 py-1", threadBookmarked && "text-[var(--brand-primary)]")}
                >
                  <Bookmark className={cn("h-3.5 w-3.5", threadBookmarked && "fill-current")} /> {formatCompactNumber(threadBookmarks)}
                </button>
                <button
                  type="button"
                  onClick={() => void onShare()}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--border-default)] px-2 py-1 text-[var(--text-muted)]"
                >
                  <Share2 className="h-3.5 w-3.5" /> Share
                </button>
                <button type="button" className="inline-flex items-center rounded-full border border-[var(--border-default)] px-2 py-1 text-[var(--text-muted)]">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <MarkdownLite value={thread.bodyMarkdown} />
            </CardContent>
          </Card>

          {mode === "max" && thread.decision ? (
            <Card>
              <CardContent className="space-y-2 pt-4 text-xs">
                <p className="font-semibold text-[var(--text-primary)]">Decision · {thread.decision.status}</p>
                <p className="text-[var(--text-secondary)]">{thread.decision.statement}</p>
                <p className="text-[var(--text-muted)]">Owner: {thread.decision.owner} · {formatRelativeDate(thread.decision.timestamp)}</p>
                <ul className="list-disc pl-4 text-[var(--text-secondary)]">
                  {thread.decision.followUpActions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {renderCategoryBody()}

          {mode === "max" && thread.alien?.updates.length ? (
            <Card id="living-op-updates">
              <CardContent className="space-y-2 pt-4 text-xs">
                <p className="font-semibold text-[var(--text-primary)]">Living OP updates</p>
                {thread.alien.updates.map((update) => (
                  <div key={update.id} className="rounded-[10px] border border-[var(--border-default)] p-2 text-[var(--text-secondary)]">
                    <p className="text-[var(--text-muted)]">Update via {update.byHandle} · {formatRelativeDate(update.at)}</p>
                    <p className="mt-1">{update.content}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card id="thread-comments">
            <CardHeader>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Comments ({flattenCount(sortedCommentTree)})</p>
              <div className="flex items-center gap-2">
                {(["best", "new", "top"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCommentSort(item)}
                    className={cn(
                      "rounded-full border px-2 py-1 text-xs",
                      commentSort === item
                        ? "border-[var(--brand-primary)] text-[var(--brand-primary)]"
                        : "border-[var(--border-default)] text-[var(--text-muted)]",
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {thread.category === "help" && (thread.categoryData as HelpThreadData).solutionCommentId ? (
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById((thread.categoryData as HelpThreadData).solutionCommentId!)
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="rounded-[10px] border border-[var(--feedback-success)]/35 bg-[var(--feedback-success)]/10 px-3 py-2 text-xs text-[var(--feedback-success)]"
                >
                  Jump to accepted solution
                </button>
              ) : null}

              {mode === "max" ? (
                <div className="flex flex-wrap items-center gap-2 rounded-[10px] border border-[var(--border-default)] p-2">
                  {intentOptions.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() =>
                        setActiveCommentFilters((current) =>
                          current.includes(item.value)
                            ? current.filter((value) => value !== item.value)
                            : [...current, item.value],
                        )
                      }
                      className={cn(
                        "rounded-full border px-2 py-1 text-[11px]",
                        activeCommentFilters.includes(item.value)
                          ? "border-[var(--brand-primary)] text-[var(--brand-primary)]"
                          : "border-[var(--border-default)] text-[var(--text-muted)]",
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                  {activeCommentFilters.length ? (
                    <button
                      type="button"
                      onClick={() => setActiveCommentFilters([])}
                      className="ml-auto rounded-full border border-[var(--border-default)] px-2 py-1 text-[11px] text-[var(--text-muted)]"
                    >
                      Clear all
                    </button>
                  ) : null}
                </div>
              ) : null}

              {thread.category === "gigs" && mode === "max" ? (
                <div className="flex gap-2">
                  <Button size="xs" variant={gigsTab === "all" ? "primary" : "secondary"} onClick={() => setGigsTab("all")}>All</Button>
                  <Button size="xs" variant={gigsTab === "question" ? "primary" : "secondary"} onClick={() => setGigsTab("question")}>Questions</Button>
                  <Button size="xs" variant={gigsTab === "response" ? "primary" : "secondary"} onClick={() => setGigsTab("response")}>Responses</Button>
                </div>
              ) : null}

              {commentsToRender.length === 0 ? (
                <p className="rounded-[10px] border border-dashed border-[var(--border-default)] px-3 py-4 text-center text-sm text-[var(--text-muted)]">
                  Be the first to reply. Share your thoughts.
                </p>
              ) : (
                sortedCommentTree.map((node) => renderComment(node))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 pt-4">
              {mode === "max" ? (
                <div className="max-xl:block xl:hidden">
                  <Button size="xs" variant="secondary" onClick={() => setMobileInsightOpen(true)}>
                    Open insight rail
                  </Button>
                </div>
              ) : null}

              <div className="flex items-start gap-2">
                <UserAvatar user={author} size="sm" />
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                    <button type="button" className="rounded-full border border-[var(--border-default)] px-2 py-1">Bold</button>
                    <button type="button" className="rounded-full border border-[var(--border-default)] px-2 py-1">Italic</button>
                    <button type="button" className="rounded-full border border-[var(--border-default)] px-2 py-1">Inline code</button>
                    <button type="button" className="rounded-full border border-[var(--border-default)] px-2 py-1">Code block</button>
                    <button type="button" className="rounded-full border border-[var(--border-default)] px-2 py-1">Link</button>
                    {mode === "max" ? (
                      <button type="button" className="rounded-full border border-[var(--border-default)] px-2 py-1" onClick={() => setIsAiReviewOpen(true)}>
                        Review before posting
                      </button>
                    ) : null}
                  </div>
                  {mode === "max" ? (
                    <div className="flex flex-wrap gap-2">
                      {intentOptions.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setSelectedIntent(item.value)}
                          className={cn(
                            "rounded-full border px-2 py-1 text-[11px]",
                            selectedIntent === item.value
                              ? "border-[var(--brand-primary)] text-[var(--brand-primary)]"
                              : "border-[var(--border-default)] text-[var(--text-muted)]",
                          )}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <textarea
                    value={composerText}
                    onChange={(event) => {
                      setComposerText(event.target.value);
                      setDismissedNudge(false);
                    }}
                    placeholder="Write a thoughtful reply..."
                    className="min-h-[120px] w-full rounded-[12px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-active)]"
                  />
                  {showNudge ? (
                    <div className="flex items-start justify-between gap-2 rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-overlay)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                      <p>{qualityNudgeMap[thread.category]}</p>
                      <button type="button" onClick={() => setDismissedNudge(true)}>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : null}
                  <div className="flex justify-end">
                    <Button
                      onClick={() => toggleAuthGate(() => setComposerText(""))}
                      disabled={!composerText.trim()}
                    >
                      Submit reply
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        <aside className="space-y-4 max-xl:order-last">
          <Card className="xl:sticky xl:top-[5rem]">
            <CardContent className="space-y-4 pt-4">
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">About the author</p>
                <div className="mt-2 flex items-center gap-2">
                  <UserAvatar user={author} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{author?.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">@{author?.handle}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-[var(--text-secondary)]">{thread.sidebar.aboutAuthor.bio}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{formatCompactNumber(thread.sidebar.aboutAuthor.followers)} followers</p>
                <Button size="xs" variant="secondary" className="mt-2">Follow</Button>
              </div>

              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">Related threads</p>
                <div className="mt-2 space-y-2">
                  {thread.sidebar.relatedThreads.map((item) => (
                    <div
                      key={item.id}
                      className="relative"
                      onMouseEnter={() => onHoverPreviewStart(item.id)}
                      onMouseLeave={onHoverPreviewEnd}
                      onFocus={() => onHoverPreviewStart(item.id)}
                      onBlur={onHoverPreviewEnd}
                    >
                      <Link href={`/discussion/${item.id}`} className="block rounded-[10px] border border-[var(--border-subtle)] px-2 py-2 text-xs hover:bg-[var(--bg-overlay)]">
                        <p className="font-semibold text-[var(--text-primary)]">{item.title}</p>
                        <p className="text-[var(--text-muted)]">{item.authorName} · {formatCompactNumber(item.engagementCount)}</p>
                      </Link>
                      {hoverPreview === item.id && hoverThreadPreview ? (
                        <div className="pointer-events-none absolute left-0 right-0 top-full z-30 mt-1 rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-2 text-[11px] text-[var(--text-secondary)] shadow-[var(--shadow-lg)]">
                          <p className="font-semibold text-[var(--text-primary)]">{hoverThreadPreview.title}</p>
                          <p className="mt-1 text-[var(--text-muted)]">
                            {hoverThreadPreview.category} · {hoverThreadPreview.commentCount} comments · {hoverThreadPreview.qualityStage}
                          </p>
                          <p className="mt-1 line-clamp-2">{hoverThreadPreview.summary}</p>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">Trending in {thread.category}</p>
                <div className="mt-2 space-y-2">
                  {thread.sidebar.trendingThreads.map((item) => (
                    <Link key={item.id} href={`/discussion/${item.id}`} className="block rounded-[10px] border border-[var(--border-subtle)] px-2 py-2 text-xs hover:bg-[var(--bg-overlay)]">
                      <p className="font-semibold text-[var(--text-primary)]">{item.title}</p>
                      <p className="text-[var(--text-muted)]">{item.authorName} · {formatCompactNumber(item.engagementCount)}</p>
                    </Link>
                  ))}
                </div>
              </div>

              {mode === "max" ? (
                <div className="space-y-3 rounded-[12px] border border-[var(--border-default)] p-3">
                  {renderInsightRail()}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>

      {mobileInsightOpen ? (
        <div className="fixed inset-0 z-50 bg-black/45 px-4 py-6 xl:hidden" onClick={() => setMobileInsightOpen(false)}>
          <div className="mx-auto max-h-full w-full max-w-md overflow-auto" onClick={(event) => event.stopPropagation()}>
            {renderInsightRail({ mobile: true })}
          </div>
        </div>
      ) : null}

      {linkCopied ? (
        <div className="fixed bottom-20 right-4 z-50 rounded-[12px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] shadow-[var(--shadow-lg)]">
          Link copied
        </div>
      ) : null}

      {showApplyModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Apply to this gig</p>
              <button type="button" onClick={() => setShowApplyModal(false)} className="rounded-full p-1 hover:bg-[var(--bg-overlay)]">
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent className="space-y-3">
              <input className="w-full rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm" placeholder="Name" />
              <input className="w-full rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm" placeholder="Email" />
              <input className="w-full rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm" placeholder="Portfolio / LinkedIn" />
              <textarea className="min-h-[90px] w-full rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm" placeholder="Why you?" />
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setApplySubmitted(true);
                    setShowApplyModal(false);
                    window.setTimeout(() => setApplySubmitted(false), 1800);
                  }}
                >
                  Submit application
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {applySubmitted ? (
        <div className="fixed bottom-20 right-4 z-50 rounded-[12px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] shadow-[var(--shadow-lg)]">
          Application submitted
        </div>
      ) : null}

      {isAiReviewOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <p className="text-sm font-semibold text-[var(--text-primary)]">AI pre-publish stress test</p>
              <button type="button" onClick={() => setIsAiReviewOpen(false)} className="rounded-full p-1 hover:bg-[var(--bg-overlay)]">
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-[var(--text-secondary)]">
              <div className="rounded-[10px] border border-[var(--border-default)] p-3">
                <p className="text-xs font-semibold text-[var(--text-primary)]">Strongest point</p>
                <p className="mt-1">Your argument clearly frames trade-offs between speed and trust in production creator workflows.</p>
              </div>
              <div className="rounded-[10px] border border-[var(--border-default)] p-3">
                <p className="text-xs font-semibold text-[var(--text-primary)]">Weakest point</p>
                <p className="mt-1">You reference outcomes without naming a concrete before/after metric.</p>
              </div>
              <div className="rounded-[10px] border border-[var(--border-default)] p-3">
                <p className="text-xs font-semibold text-[var(--text-primary)]">Counter-argument to address</p>
                <p className="mt-1">Some teams prioritize governance over speed and may reject your recommendation as under-controlled.</p>
              </div>
              <div className="rounded-[10px] border border-[var(--border-default)] p-3">
                <p className="text-xs font-semibold text-[var(--text-primary)]">Missing context</p>
                <p className="mt-1">Specify team size and deployment context to improve transferability.</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setIsAiReviewOpen(false)}>
                  Post anyway
                </Button>
                <Button size="sm" onClick={() => setIsAiReviewOpen(false)}>
                  Apply suggestions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {showCommandPalette ? (
        <div className="fixed inset-0 z-50 grid place-items-start bg-black/45 px-4 pt-24" onClick={() => setShowCommandPalette(false)}>
          <Card className="w-full max-w-xl" onClick={(event) => event.stopPropagation()}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 rounded-[12px] border border-[var(--border-default)] px-3 py-2">
                <Search className="h-4 w-4 text-[var(--text-muted)]" />
                <input
                  autoFocus
                  value={searchCommand}
                  onChange={(event) => setSearchCommand(event.target.value)}
                  placeholder="Search commands"
                  className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none"
                />
              </div>
              <div className="mt-2 space-y-2">
                {commandActions.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      item.action();
                      setShowCommandPalette(false);
                    }}
                    className="block w-full rounded-[10px] border border-[var(--border-subtle)] px-3 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-overlay)]"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </section>
  );
}
