"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@cemvp/auth-ui";

import { StartDiscussionSheet, type StartSheetType } from "@/components/feed/feed-start-sheet";
import { usePrefersReducedMotion } from "@/lib/motion";
import { useSharedData } from "@/providers/shared-data-context";
import { useStartSheet } from "@/stores/start-sheet-store";
import { MEMBER_COMPOSABLE_CATEGORY_KEYS, type CategoryKey } from "@/types";

/** Canonical postTypeConfig keys use "help"; the composer's list uses "qa". */
const composable = (key: string) => MEMBER_COMPOSABLE_CATEGORY_KEYS.includes((key === "help" ? "qa" : key) as CategoryKey);

/**
 * Shell host for the Start Discussion sheet (FEED-U3, §9.3): reads the shared
 * open state (rail pill / mobile Create), auth and the post-type registry
 * (useSharedData — no second subscription), and routes a chosen type to the
 * existing composer. Types: the active, member-composable rows from data
 * (news is platform-injected, CAP-086; locked types hidden, CAP-104).
 */
export function StartDiscussionHost() {
  const router = useRouter();
  const { authStatus, openAuthModal } = useAuth();
  const { categories } = useSharedData();
  const { open, origin, hide } = useStartSheet();
  const reduced = usePrefersReducedMotion();

  const types: StartSheetType[] = categories
    .filter((c) => !c.lockedByDefault && composable(c.key))
    .map((c) => ({ key: c.key, label: c.name, description: c.description ?? "" }));

  return (
    <StartDiscussionSheet
      open={open}
      origin={origin}
      member={authStatus === "authenticated"}
      types={types}
      reduced={reduced}
      onClose={hide}
      onChoose={(key) => {
        hide();
        router.push(`/new-post?type=${encodeURIComponent(key)}`);
      }}
      onSignIn={() => {
        hide();
        openAuthModal("login");
      }}
    />
  );
}
