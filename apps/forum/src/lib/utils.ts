import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/** Named font-size tokens (`--text-<name>` in packages/design-tokens/tokens.css).
 *  Stock tailwind-merge reads unknown `text-*` as a COLOUR, so without this
 *  list `cn("text-caption", "text-text-primary")` drops the size. Kept in
 *  sync with tokens.css by lib/__tests__/cn-font-size-tokens.test.ts. */
export const FONT_SIZE_TOKENS = [
  "label-lg", "label-md", "label-sm", "caption", "overline", "micro", "micro-2",
  "body-xs", "body-sm", "body-md", "body-lg", "fine",
  "heading-xs", "heading-sm", "heading-md", "heading-lg", "heading-xl",
  "display-sm", "display-md", "display-lg", "display-xl", "display-2xl",
] as const;

const twMerge = extendTailwindMerge({
  extend: { theme: { text: [...FONT_SIZE_TOKENS] } },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
