import { DebateBody } from "./DebateBody";
import { DebateCardExtras } from "./DebateCardExtras";
import type { CategoryTemplate } from "../types";

/** ComposeForm archived 2026-08-31 (typed debate entries → FUTURE-M6-01 MAX-assisted structuring). */
export const debateTemplate: CategoryTemplate = {
  key: "debate",
  Body: DebateBody as CategoryTemplate["Body"],
  CardExtras: DebateCardExtras,
  nudge: "The strongest arguments cite a counter-argument directly before refuting it.",
};
