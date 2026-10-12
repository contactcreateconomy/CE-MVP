import { create } from "zustand";

/** Where the Start sheet grew from — the shared element it returns to (§9.3). */
export type StartSheetOrigin = "rail" | "tab";

interface StartSheetStore {
  open: boolean;
  origin: StartSheetOrigin | null;
  show: (origin: StartSheetOrigin) => void;
  hide: () => void;
}

/**
 * Start Discussion sheet (FEED-DESIGN §9.3, L-34): one sheet, two triggers —
 * the rail pill (lg+) and the mobile Create tab. Both triggers live in
 * different trees (feed view vs shell), so the open state is shared here;
 * the shell's StartDiscussionHost renders the sheet. `origin` stays set while
 * closing so the sheet shrinks back into the trigger it came from.
 */
export const useStartSheet = create<StartSheetStore>()((set) => ({
  open: false,
  origin: null,
  show: (origin) => set({ open: true, origin }),
  hide: () => set({ open: false }),
}));
