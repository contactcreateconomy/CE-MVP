import { LaunchpadBody } from "./LaunchpadBody";
import type { CategoryTemplate } from "../types";

export const launchpadTemplate: CategoryTemplate = {
  key: "launch-pad",
  Body: LaunchpadBody as CategoryTemplate["Body"],
  nudge: "Specific feedback ('the onboarding step 3 is unclear') is more useful than general praise.",
  getFeedbackChips: (thread) => {
    if ("feedbackChips" in (thread.categoryBody ?? {})) {
      return (thread.categoryBody as { feedbackChips: string[] }).feedbackChips;
    }
    return null;
  },
};
