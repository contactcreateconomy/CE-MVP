import type {
  User,
  Discussion,
  Category,
  FeaturedSlide,
  Notification,
  LeaderboardEntry,
  TrendingTopic,
  Campaign,
} from "@/lib/types";

// ============================================================
// USERS
// ============================================================
export const MOCK_USERS: User[] = [
  { id: "u1", name: "Sarah Chen", username: "sarahc", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah", points: 4820, role: "admin" },
  { id: "u2", name: "Alex Rivera", username: "alexr", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Alex", points: 3950, role: "moderator" },
  { id: "u3", name: "Mika Tanaka", username: "mikat", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Mika", points: 3210, role: "member" },
  { id: "u4", name: "Jordan Lee", username: "jordanl", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jordan", points: 2890, role: "member" },
  { id: "u5", name: "Priya Sharma", username: "priyas", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Priya", points: 2540, role: "member" },
  { id: "u6", name: "Leo Kim", username: "leok", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Leo", points: 2100, role: "member" },
  { id: "u7", name: "Nina Patel", username: "ninap", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Nina", points: 1890, role: "member" },
  { id: "u8", name: "Tom Wright", username: "tomw", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Tom", points: 1650, role: "member" },
];

export const CURRENT_USER: User = MOCK_USERS[0];

// ============================================================
// CATEGORIES
// ============================================================
export const MOCK_CATEGORIES: Category[] = [
  { slug: "news", label: "News", icon: "📰", count: 142, isPremium: false },
  { slug: "review", label: "Review", icon: "⭐", count: 98, isPremium: false },
  { slug: "compare", label: "Compare", icon: "⚖️", count: 67, isPremium: false },
  { slug: "list", label: "List", icon: "📋", count: 53, isPremium: false },
  { slug: "help", label: "Help", icon: "❓", count: 231, isPremium: false },
  { slug: "showcase", label: "Showcase", icon: "🎨", count: 89, isPremium: false },
  { slug: "tutorial", label: "Tutorial", icon: "📚", count: 76, isPremium: false },
  { slug: "debate", label: "Debate", icon: "💬", count: 34, isPremium: true, pointsRequired: 500 },
  { slug: "launch", label: "Launch", icon: "🚀", count: 12, isPremium: true, pointsRequired: 1000 },
];

// ============================================================
// DISCUSSIONS
// ============================================================
export const MOCK_DISCUSSIONS: Discussion[] = [
  {
    id: "d1",
    title: "Claude 4 vs GPT-5: Which AI Actually Delivers for Creators?",
    summary: "Deep dive comparison on real-world creative workflows across image gen, code, and writing tasks.",
    category: "compare",
    author: MOCK_USERS[1],
    createdAt: "2h ago",
    upvotes: 342,
    commentCount: 89,
    participants: [MOCK_USERS[0], MOCK_USERS[2], MOCK_USERS[3], MOCK_USERS[4], MOCK_USERS[5], MOCK_USERS[6]],
    isFavorited: false,
    isUpvoted: true,
    tags: ["AI", "comparison"],
  },
  {
    id: "d2",
    title: "I built a full SaaS in 48 hours using Cursor + v0 — Here's my honest review",
    summary: "No-BS breakdown of the entire process, costs, and what actually worked vs marketing hype.",
    category: "review",
    author: MOCK_USERS[2],
    createdAt: "4h ago",
    upvotes: 256,
    commentCount: 67,
    participants: [MOCK_USERS[1], MOCK_USERS[3], MOCK_USERS[5], MOCK_USERS[7]],
    isFavorited: true,
    isUpvoted: false,
    tags: ["SaaS", "productivity"],
  },
  {
    id: "d3",
    title: "The creator economy is broken — here's how AI can fix it",
    summary: "Why 97% of creators earn less than minimum wage and how new AI tools are changing the game.",
    category: "news",
    author: MOCK_USERS[0],
    createdAt: "6h ago",
    upvotes: 198,
    commentCount: 45,
    participants: [MOCK_USERS[2], MOCK_USERS[4], MOCK_USERS[6]],
    isFavorited: false,
    isUpvoted: false,
    tags: ["creator economy", "AI"],
  },
  {
    id: "d4",
    title: "🚀 Show Createconomy: AI-powered thumbnail generator that 3x'd my CTR",
    summary: "Open-source tool that analyzes your niche and generates scroll-stopping thumbnails.",
    category: "showcase",
    author: MOCK_USERS[3],
    createdAt: "8h ago",
    upvotes: 167,
    commentCount: 34,
    participants: [MOCK_USERS[0], MOCK_USERS[1], MOCK_USERS[5]],
    isFavorited: true,
    isUpvoted: true,
    tags: ["open-source", "thumbnails"],
  },
  {
    id: "d5",
    title: "Complete guide: Setting up an AI content pipeline with Make.com",
    summary: "Step-by-step tutorial to automate your content creation from ideation to publishing.",
    category: "tutorial",
    author: MOCK_USERS[4],
    createdAt: "12h ago",
    upvotes: 134,
    commentCount: 28,
    participants: [MOCK_USERS[1], MOCK_USERS[6], MOCK_USERS[7]],
    isFavorited: false,
    isUpvoted: false,
    tags: ["automation", "content"],
  },
  {
    id: "d6",
    title: "Top 10 AI tools every YouTube creator needs in 2025",
    summary: "Curated list of the best AI tools for scripting, editing, SEO, and audience growth.",
    category: "list",
    author: MOCK_USERS[5],
    createdAt: "1d ago",
    upvotes: 112,
    commentCount: 22,
    participants: [MOCK_USERS[0], MOCK_USERS[2], MOCK_USERS[3], MOCK_USERS[4]],
    isFavorited: false,
    isUpvoted: true,
    tags: ["YouTube", "tools"],
  },
  {
    id: "d7",
    title: "Help: My AI-generated art keeps getting flagged on Instagram",
    summary: "Getting shadowbanned for posting AI art — anyone else experiencing this? What's the workaround?",
    category: "help",
    author: MOCK_USERS[6],
    createdAt: "1d ago",
    upvotes: 89,
    commentCount: 56,
    participants: [MOCK_USERS[1], MOCK_USERS[3], MOCK_USERS[7]],
    isFavorited: false,
    isUpvoted: false,
    tags: ["Instagram", "AI art"],
  },
  {
    id: "d8",
    title: "Should AI-generated content be labeled? The ethics debate",
    summary: "A balanced discussion on transparency, authenticity, and the future of creator trust.",
    category: "debate",
    author: MOCK_USERS[7],
    createdAt: "2d ago",
    upvotes: 203,
    commentCount: 112,
    participants: [MOCK_USERS[0], MOCK_USERS[1], MOCK_USERS[2], MOCK_USERS[4], MOCK_USERS[5]],
    isFavorited: true,
    isUpvoted: false,
    tags: ["ethics", "transparency"],
  },
];

// ============================================================
// FEATURED SLIDES
// ============================================================
export const MOCK_FEATURED_SLIDES: FeaturedSlide[] = [
  {
    id: "f1",
    title: "Createconomy Launch Week 🚀",
    subtitle: "Join the future of AI-powered creation",
    gradient: "from-indigo-600 via-purple-600 to-pink-500",
  },
  {
    id: "f2",
    title: "Win Claude Pro Annual ✨",
    subtitle: "Share your best AI workflow and win",
    gradient: "from-amber-500 via-orange-500 to-red-500",
  },
  {
    id: "f3",
    title: "Creator Spotlight: Sarah Chen",
    subtitle: "How she built a 6-figure business with AI",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
  },
  {
    id: "f4",
    title: "New: AI Tool Directory",
    subtitle: "500+ tools reviewed by real creators",
    gradient: "from-blue-600 via-indigo-600 to-violet-600",
  },
];

// ============================================================
// NOTIFICATIONS
// ============================================================
export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "n1", type: "reply", message: "Alex Rivera replied to your discussion", avatar: MOCK_USERS[1].avatar, timestamp: "2m ago", isRead: false },
  { id: "n2", type: "upvote", message: "Your post received 50 upvotes!", avatar: "", timestamp: "1h ago", isRead: false },
  { id: "n3", type: "mention", message: "Mika Tanaka mentioned you in a comment", avatar: MOCK_USERS[2].avatar, timestamp: "3h ago", isRead: true },
  { id: "n4", type: "system", message: "You earned the 'Rising Star' badge! 🌟", avatar: "", timestamp: "1d ago", isRead: true },
];

// ============================================================
// LEADERBOARD
// ============================================================
export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, user: MOCK_USERS[0], weeklyPoints: 1240, trend: "up", trendData: [20, 35, 45, 30, 55, 70, 85] },
  { rank: 2, user: MOCK_USERS[1], weeklyPoints: 980, trend: "up", trendData: [15, 25, 40, 55, 50, 60, 72] },
  { rank: 3, user: MOCK_USERS[2], weeklyPoints: 870, trend: "stable", trendData: [30, 28, 35, 32, 38, 36, 40] },
];

// ============================================================
// TRENDING TOPICS
// ============================================================
export const MOCK_TRENDING: TrendingTopic[] = [
  { id: "t1", title: "Claude 4 Opus Launch", engagement: 2340, category: "news", gradient: "from-indigo-500 to-purple-600" },
  { id: "t2", title: "AI Video Revolution", engagement: 1890, category: "showcase", gradient: "from-pink-500 to-rose-600" },
  { id: "t3", title: "Cursor vs Windsurf", engagement: 1567, category: "compare", gradient: "from-emerald-500 to-teal-600" },
];

// ============================================================
// CAMPAIGN
// ============================================================
export const MOCK_CAMPAIGN: Campaign = {
  id: "c1",
  title: "Win Claude Pro Annual",
  description: "Share your best AI workflow",
  prize: "Claude Pro Annual ($240 value)",
  daysLeft: 12,
  totalEntries: 847,
  maxEntries: 1000,
  gradient: "from-indigo-600 via-purple-600 to-pink-500",
};
