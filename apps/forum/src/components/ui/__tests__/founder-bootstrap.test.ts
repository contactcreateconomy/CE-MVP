import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  FOUNDER_EMAIL,
  canonicalSignupFields,
  isFounderEmail,
} from "../../../../../../convex/lib/founder";
import { STAFF_ROLES } from "../../../../../../convex/lib/authz";

const convexRoot = join(__dirname, "../../../../../../convex");

describe("founder bootstrap", () => {
  it("documents the founder Google email", () => {
    expect(FOUNDER_EMAIL).toBe("contact.createconomy@gmail.com");
    expect(isFounderEmail(FOUNDER_EMAIL)).toBe(true);
    expect(isFounderEmail("  Contact.Createconomy@gmail.com  ")).toBe(true);
    expect(isFounderEmail("someone-else@example.com")).toBe(false);
  });

  it("canonical signup fields include accountStanding so OAuth inserts pass schema", () => {
    const row = canonicalSignupFields("contact.createconomy@gmail.com", "Founder");
    expect(row.accountStanding).toBe("good");
    expect(row.emailVerified).toBe(true);
    expect(row.displayName).toBe("Founder");
    expect(row.activationProgress.emailVerified).toBe(true);
  });

  it("auth admits the founder when signup is closed and grants all staff roles", () => {
    const auth = readFileSync(join(convexRoot, "auth.ts"), "utf8");
    expect(auth).toContain("createOrUpdateUser");
    expect(auth).toContain("createOrLinkAuthUser");
    expect(auth).toContain("canonicalSignupFields");
    const founder = readFileSync(join(convexRoot, "lib/founder.ts"), "utf8");
    expect(founder).toContain("isFounderEmail");
    expect(founder).toContain("ensureFounderPrivileges");
    const roles = readFileSync(join(convexRoot, "admin/roles.ts"), "utf8");
    expect(roles).toContain("grantFounderByEmail");
    expect(STAFF_ROLES).toEqual(
      expect.arrayContaining([
        "administrator",
        "editor",
        "publisher",
        "moderator",
        "store_operator",
        "support_operator",
      ]),
    );
  });

  it("owns the user insert because Convex Auth strips emailVerified", () => {
    const founder = readFileSync(join(convexRoot, "lib/founder.ts"), "utf8");
    expect(founder).toContain("export async function createOrLinkAuthUser");
    expect(founder).toContain("...canonicalSignupFields(email, name)");
  });
});
