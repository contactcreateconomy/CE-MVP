import { createAccount } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { internal } from "../_generated/api";
import { internalAction, internalQuery } from "../_generated/server";

/** Log in with the email (not a bare username) in the app’s auth form. */
const DEVTEST_EMAIL = "devtest@example.com";
const DEVTEST_NAME = "Devtest";
const DEVTEST_PASSWORD = "Dev123456";

export const hasPasswordAccount = internalQuery({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const acc = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", DEVTEST_EMAIL),
      )
      .unique();
    return acc !== null;
  },
});

/**
 * Idempotent: creates the password account if missing, or no-ops if it already
 * exists with the same password. Requires a short-lived env gate (see convex/.env.example).
 */
export const ensure = internalAction({
  args: {},
  returns: v.object({
    email: v.string(),
    name: v.string(),
    alreadyExisted: v.boolean(),
  }),
  handler: async (ctx) => {
    if (process.env.ALLOW_DEV_TEST_USER !== "true") {
      throw new Error(
        "Set ALLOW_DEV_TEST_USER=true on the Convex deployment, run `pnpm exec convex run dev/ensureTestUser:ensure`, then remove the flag.",
      );
    }
    const existed = await ctx.runQuery(internal.dev.ensureTestUser.hasPasswordAccount, {});
    if (existed) {
      return { email: DEVTEST_EMAIL, name: DEVTEST_NAME, alreadyExisted: true };
    }
    await createAccount(ctx, {
      provider: "password",
      account: { id: DEVTEST_EMAIL, secret: DEVTEST_PASSWORD },
      profile: { email: DEVTEST_EMAIL, name: DEVTEST_NAME },
    });
    return { email: DEVTEST_EMAIL, name: DEVTEST_NAME, alreadyExisted: false };
  },
});
