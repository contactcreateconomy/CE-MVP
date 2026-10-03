"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeftSidebar } from "@/components/layout/LeftSidebar";
import { slideFromRight } from "@/lib/animations";
import type { CategorySlug } from "@/lib/types";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  activeCategory: CategorySlug | null;
  onCategoryChange: (slug: CategorySlug | null) => void;
}

export function MobileDrawer({
  open,
  onClose,
  activeCategory,
  onCategoryChange,
}: MobileDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            variants={slideFromRight}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 z-50 h-full w-[300px] overflow-y-auto bg-background p-4 shadow-xl border-l"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation drawer"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Categories</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close drawer"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <LeftSidebar
              activeCategory={activeCategory}
              onCategoryChange={(slug) => {
                onCategoryChange(slug);
                onClose();
              }}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
