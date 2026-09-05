import { QaBody } from "./QaBody";
import { QaInsights } from "./QaInsights";
import type { CategoryTemplate } from "../types";

/** ComposeForm archived 2026-08-31 — comments are plain comments with authorIntent tags (spec). */
export const qaTemplate: CategoryTemplate = {
  key: "qa",
  Body: QaBody as CategoryTemplate["Body"],
  Insights: QaInsights,
  nudge: "Include your error message and what you've already tried — it cuts reply time in half.",
};
