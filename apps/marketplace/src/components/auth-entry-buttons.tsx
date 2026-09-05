"use client";

import { useAuth } from "@cemvp/auth-ui";

import { Button } from "@/components/ui/button";

export function AuthEntryButtons() {
  const { openAuthModal } = useAuth();

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" onClick={() => openAuthModal("login")}>
        Log in
      </Button>
      <Button type="button" variant="secondary" onClick={() => openAuthModal("signup")}>
        Sign up
      </Button>
    </div>
  );
}
