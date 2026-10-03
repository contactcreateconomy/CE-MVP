import { DebateBody } from "./DebateBody";
import { DebateCardExtras } from "./DebateCardExtras";
import { DebateComposeForm } from "./DebateComposeForm";
import type { CategoryTemplate } from "../types";

export const debateTemplate: CategoryTemplate = {
  key: "debate",
  Body: DebateBody as CategoryTemplate["Body"],
  ComposeForm: DebateComposeForm,
  CardExtras: DebateCardExtras,
  nudge: "The strongest arguments cite a counter-argument directly before refuting it.",
};
