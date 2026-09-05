# Founder-Bootstrap Manual Verification — P2-AUTH-CUTOVER Gate

**Purpose:** Step-by-step instructions to verify the founder can access admin
surfaces via `roleAssignments` alone, BEFORE any change to `ADMIN_EMAILS`.
You perform these steps yourself — not the agent, not the test suite.

---

## Prerequisites

- Node.js + pnpm working (see `PRD/app/SETUP.md`)
- `npx convex login` completed (one-time)
- `npx convex dev --once` pushed (functions live on the deployment)
- The dev server running: `pnpm dev` from `PRD/app`

---

## Step 1 — Confirm ADMIN_EMAILS is still active (baseline)

```bash
# Check the current env var is set (on your deployment dashboard or .env.local)
grep ADMIN_EMAILS PRD/app/.env.local PRD/app/apps/forum/.env.local 2>/dev/null
```

Expected: the variable exists with at least one email. If absent, the legacy
admin grant is already inactive and the baseline is different — note it.

## Step 2 — Verify current admin access works (legacy path)

Open `http://localhost:3000` and confirm you can sign in with your existing
OAuth (GitHub/Google) or password. Note whether you have admin capabilities
on any existing admin surface (even if it's just a moderator panel).

**This is your rollback baseline — if something breaks later, re-adding
`ADMIN_EMAILS` to the env restores this state.**

## Step 3 — Run founder-bootstrap (CAP-007)

This creates your `roleAssignments` administrator row:

```bash
cd PRD/app
npx convex run roleAssignments:grantFounder --identity <your-user-id>
```

**Getting your user-id:** run this query first:

```bash
npx convex run users:getByEmail '{"email":"<your-email>"}'
```

If that query doesn't exist yet (it's Phase 2 territory), check the Convex
dashboard → Data → users → find your row → copy the `_id`.

**Alternative if the CLI mutation doesn't exist yet** (the honest state —
CAP-007 is an internal mutation that ships with P3-09):

Insert directly via the Convex dashboard:
1. Open the Convex dashboard for your deployment
2. Data → `roleAssignments` table → "Add document"
3. Create this document:

```json
{
  "userId": "<your-users-_id>",
  "role": "administrator",
  "scopeType": "global",
  "status": "active",
  "grantedAt": <current-timestamp-ms>
}
```

4. Click Save

## Step 4 — Verify the roleAssignment exists

```bash
npx convex run roleAssignments:checkRole '{"userId":"<your-user-id>","role":"administrator"}'
```

Or in the dashboard: Data → `roleAssignments` → confirm the row you just
created is there with `status: "active"`.

## Step 5 — Verify admin access via roleAssignments ONLY

**This is the critical test.** You need to verify that admin authority works
through the NEW path, not the legacy one.

**Method A — Temporary ADMIN_EMAILS removal (the real test):**

1. Temporarily remove `ADMIN_EMAILS` from BOTH `.env.local` files
2. Restart the dev server (`Ctrl+C` then `pnpm dev`)
3. Sign in with your existing method
4. Try to access any admin-gated surface
5. **If it works:** the `roleAssignments` path is confirmed
6. **If it does NOT work:** restore `ADMIN_EMAILS` immediately (rollback)

**Method B — Direct API check (less disruptive):**

```bash
npx convex run lib/authz:testAdminPermission '{"userId":"<your-user-id>"}'
```

If this mutation doesn't exist yet, run this ad-hoc check:

```bash
npx convex run roleAssignments:countActive '{"role":"administrator"}'
```

Expected: at least 1 (you).

## Step 6 — Document the result

Write down (or have me record):
- Date/time of verification
- Which method (A or B) you used
- Result: PASS or FAIL
- If FAIL: what specifically didn't work

## Step 7 — Restore state

- If you used Method A: re-add `ADMIN_EMAILS` to both `.env.local` files
  (keeping it until the FULL cutover is ready)
- The `roleAssignments` row stays — it's the canonical path going forward

---

## Rollback procedure (if admin access is lost post-cutover)

1. Add `ADMIN_EMAILS=<your-email>` to `PRD/app/.env.local`
2. Add `ADMIN_EMAILS=<your-email>` to `PRD/app/apps/forum/.env.local`
3. Restart: `pnpm dev`
4. The legacy admin grant in `convex/auth.ts`'s afterUser callback will
   re-activate on your next sign-in

This rollback is documented in `SETUP.md` as required by the P2-AUTH-CUTOVER
gate condition 4.
