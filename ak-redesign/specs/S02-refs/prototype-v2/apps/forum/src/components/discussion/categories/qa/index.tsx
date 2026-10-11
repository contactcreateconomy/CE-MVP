import { QaBody } from "./QaBody";
import { QaComposeForm } from "./QaComposeForm";
import { QaInsights } from "./QaInsights";
import type { CategoryTemplate } from "../types";

export const qaTemplate: CategoryTemplate = {
  key: "qa",
  Body: QaBody as CategoryTemplate["Body"],
  Insights: QaInsights,
  ComposeForm: QaComposeForm,
  nudge: "Include your error message and what you've already tried — it cuts reply time in half.",
};
