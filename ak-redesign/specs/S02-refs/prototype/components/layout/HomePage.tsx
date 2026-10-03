"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { RightSidebar } from "@/components/layout/RightSidebar";
import { MobileDrawer } from "@/components/layout/MobileDrawer";
import { FeaturedSlider } from "@/components/feed/FeaturedSlider";
import { FeedTabs } from "@/components/feed/FeedTabs";
import { DiscussionCard } from "@/components/feed/DiscussionCard";
import { DiscussionCardSkeleton } from "@/components/feed/DiscussionCard.skeleton";
import { DotGridBackground } from "@/components/shared/DotGridBackground";
import { MOCK_DISCUSSIONS } from "@/lib/mock-data";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import type { FeedTab, CategorySlug } from "@/lib/types";

const POSTS_PER_PAGE = 4;

export function HomePage() {
  const [activeTab, setActiveTab] = useState<FeedTab>("top");
  const [activeCategory, setActiveCategory] = useState<CategorySlug | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [visiblePosts, setVisiblePosts] = useState(POSTS_PER_PAGE);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // TODO: Replace with API query
  // const discussions = useQuery(api.discussions.list, { tab: activeTab, category: activeCategory, limit: visiblePosts });
  const filteredDiscussions = MOCK_DISCUSSIONS.filter((d) =>
    activeCategory ? d.category === activeCategory : true
  );

  // Sort by tab
  const sortedDiscussions = [...filteredDiscussions].sort((a, b) => {
    switch (activeTab) {
      case "hot":
        return b.commentCount - a.commentCount;
      case "new":
        return 0; // already sorted by mock data order
      case "fav":
        return (b.isFavorited ? 1 : 0) - (a.isFavorited ? 1 : 0);
      case "top":
      default:
        return b.upvotes - a.upvotes;
    }
  });

  const displayedDiscussions = sortedDiscussions.slice(0, visiblePosts);
  const hasMore = visiblePosts < sortedDiscussions.length;

  // Infinite scroll with IntersectionObserver
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    // Simulate network delay
    setTimeout(() => {
      setVisiblePosts((prev) => prev + POSTS_PER_PAGE);
      setLoadingMore(false);
    }, 800);
  }, [loadingMore, hasMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // Reset posts when filter changes
  useEffect(() => {
    setVisiblePosts(POSTS_PER_PAGE);
  }, [activeTab, activeCategory]);

  return (
    <div className="min-h-screen">
      <DotGridBackground />
      <Navbar />

      <main className="mx-auto max-w-[1440px] px-4 md:px-6 py-6">
        {/* Featured Slider — full width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <FeaturedSlider />
        </motion.div>

        {/* Three-column layout */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[250px_1fr_320px] gap-6">
          {/* Left Sidebar — hidden on mobile/tablet */}
          <div className="hidden lg:block">
            <div className="sticky top-20">
              <LeftSidebar
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />
            </div>
          </div>

          {/* Center Feed */}
          <div className="min-w-0">
            {/* Feed Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <FeedTabs activeTab={activeTab} onTabChange={setActiveTab} />
            </motion.div>

            {/* Discussion Cards */}
            <motion.div
              className="mt-4 space-y-3"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              key={`${activeTab}-${activeCategory}`}
              role="feed"
              aria-label="Discussion feed"
            >
              {displayedDiscussions.map((discussion, idx) => (
                <DiscussionCard
                  key={discussion.id}
                  discussion={discussion}
                  index={idx}
                />
              ))}

              {/* Loading skeletons */}
              {loadingMore && (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <motion.div
                      key={`skeleton-${i}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <DiscussionCardSkeleton />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {displayedDiscussions.length === 0 && !loadingMore && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <p className="text-lg font-semibold">No discussions yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Be the first to start a discussion in this category!
                  </p>
                </motion.div>
              )}

              {/* Scroll sentinel for infinite scroll */}
              <div ref={sentinelRef} className="h-1" aria-hidden="true" />
            </motion.div>
          </div>

          {/* Right Sidebar — hidden on mobile, shown on lg+ */}
          <div className="hidden lg:block">
            <div className="sticky top-20">
              <RightSidebar />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Drawer for categories */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
    </div>
  );
}
