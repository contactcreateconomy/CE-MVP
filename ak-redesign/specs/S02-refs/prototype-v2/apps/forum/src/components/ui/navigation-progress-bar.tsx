"use client";

import { AnimatePresence, motion } from "motion/react";
import { useNavigationState } from "@/providers/navigation-progress-provider";

export function NavigationProgressBar() {
  const state = useNavigationState();

  const isComplete = state === "complete";

  return (
    <AnimatePresence>
      {state !== "idle" && (
        <div className="navigation-progress-bar">
          <motion.div
            className="navigation-progress-bar__track"
            initial={{ width: "0%" }}
            animate={{
              width: isComplete ? "100%" : "80%",
              opacity: isComplete ? 0 : 1,
            }}
            transition={{
              width: {
                duration: isComplete ? 0.2 : 2,
                ease: isComplete ? [0.4, 0, 0.2, 1] : [0.4, 0, 1, 1],
              },
              opacity: {
                duration: isComplete ? 0.3 : 0,
                delay: isComplete ? 0.1 : 0,
              },
            }}
            exit={{ opacity: 0 }}
          />
        </div>
      )}
    </AnimatePresence>
  );
}
