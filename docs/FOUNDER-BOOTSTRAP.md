# Founder bootstrap — forum + admin administrator access

> **Current (2026-09-16):** founder Google identity is
> `contact.createconomy@gmail.com`. Staff authority is `roleAssignments`
> (every `STAFF_ROLES` literal) + `users.isStaff=true`. `ADMIN_EMAILS` is
> an allow-list *input* to that grant, not a second authz path.

Forum (`:3000` / `discuss.createconomy.com`) and admin (`:3001` / the
admin origin) share one Convex backend. Sessions are **origin-scoped** —
sign in once on each origin with the same Google account.

---

## What the code does

1. **OAuth insert** (`convex/lib/founder.ts` `canonicalSignupFields`) —
   Google/GitHub/Facebook/password writes the full bible-required `users`
   shape so schema validation cannot reject the founder the way Auth-era
   name/email-only rows did.
2. **Closed-signup bypass** — CAP-001 still fail-closes everyone else.
   `isFounderEmail` (documented email + `ADMIN_EMAILS` / `FOUNDER_EMAILS`)
   skips the closed/waitlist reject so the first login after a wipe works.
3. **Auto-grant on login** — `afterUserCreatedOrUpdated` calls
   `ensureFounderPrivileges`, which sets `isStaff` and inserts any missing
   staff roles (`administrator`, `editor`, `publisher`, `moderator`,
   `store_operator`, `support_operator`). That covers widgets that require
   only `support_operator` (`/admin/support`).
4. **CLI recovery** — if the user row already exists:

```bash
# from repo root; default email is contact.createconomy@gmail.com
pnpm exec convex run admin/roles:grantFounderByEmail
pnpm exec convex run --prod admin/roles:grantFounderByEmail
```

`no_user` means sign in once with Google on that deployment, then re-run.

---

## After a prod wipe (or first prod push)

```bash
pnpm exec convex deploy -y                          # prod functions
pnpm exec convex run --prod seed:bootstrap
pnpm exec convex run --prod admin/widgetsCatalog:deploySeed
pnpm exec convex run --prod legalContent:seedDefaults
pnpm exec convex env set ADMIN_EMAILS contact.createconomy@gmail.com --prod
```

Then open the **production** forum and admin URLs, Google-sign-in as
`contact.createconomy@gmail.com` on each origin. The first successful
login creates the user and grants every staff role. Re-run
`grantFounderByEmail --prod` if the login happened before this code was
deployed.

Local/dev:

```bash
pnpm exec convex dev --once
pnpm exec convex run seed:bootstrap
pnpm exec convex run admin/widgetsCatalog:deploySeed
pnpm exec convex run admin/roles:grantFounderByEmail
```

`AUTH_REDIRECT_ORIGINS` on the Convex deployment must include the admin
origin (`http://localhost:3001` locally) so Google can return to the
console.

---

## Rollback if admin access is lost

```bash
pnpm exec convex env set ADMIN_EMAILS contact.createconomy@gmail.com
pnpm exec convex env set ADMIN_EMAILS contact.createconomy@gmail.com --prod
# sign in again with that Google account (auto-grant), or:
pnpm exec convex run admin/roles:grantFounderByEmail
```

Do **not** restore a second magic-link/staff-gate page. The shared
`AuthModal` is the only sign-in UI.

---

## Historical note

The 2026-09-05 procedure against `watchful-chameleon-570` (manual
`roleAssignments` insert, then Method A `ADMIN_EMAILS` removal test) is
superseded. Cutover condition “staff roles come from Founder bootstrap”
is this grant, not an email-allowlist check inside `assertAdminPermission`.
