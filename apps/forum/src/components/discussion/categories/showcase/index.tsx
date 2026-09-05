import { ShowcaseBody } from "./ShowcaseBody";
import type { CategoryTemplate } from "../types";

export const showcaseTemplate: CategoryTemplate = {
  key: "showcase",
  Body: ShowcaseBody as CategoryTemplate["Body"],
  nudge: "Tell us which aspect you want feedback on — UX, visuals, or technical approach.",
  getFeedbackChips: (thread) => {
    if ("feedbackChips" in (thread.categoryBody ?? {})) {
      return (thread.categoryBody as { feedbackChips: string[] }).feedbackChips;
    }
    return null;
  },
};
