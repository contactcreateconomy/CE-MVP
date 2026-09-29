# TEAM-WORKFLOW — three machines, two people, one repo

Plain-language rules for everyone (humans and agents). If something here conflicts
with `ak-redesign/00-control/CONVENTIONS.md`, CONVENTIONS wins.

## Who's who

| Person | Machine | Works on | Owns |
|---|---|---|---|
| Founder | Office PC (Mon–Wed) | `011-Akilesh-Redesign` + redesign topic branches off it | `ak-redesign/`, `apps/forum` UI |
| Founder | Home PC (Thu–Sun) | same branches, never simultaneous with the office PC | same territory |
| Dev | Mac | own `NNN-*` backend branches off the integration branch | `convex/`, schema, seeds, backend scripts |

The founder's two machines are **one person** — sequential use only, never two at once.

## Territory rule

- **Redesign territory** (founder + agents): `ak-redesign/**` and `apps/forum/src/**` UI code.
- **Dev territory**: `convex/**`, `convex/schema.ts`, seeders, backend scripts.
- **Cross-territory edit = ask first** via a CR (below). A found bug in the other
  territory is reported, never silently fixed in someone else's commit.

## Change-request (CR) flow

Directory: `ak-redesign/00-control/crs/`. One numbered pair per request.
**Status lives in the REQUEST header and is updated only by Opus** (the
redesign owner); the dev replies in their own file, never by editing the request.

`CR-NNN-REQUEST.md`:
```markdown
---
id: CR-NNN
type: CR-REQUEST
author-model: Opus
status: OPEN            # OPEN → ANSWERED → ACCEPTED | REJECTED | WITHDRAWN
date: YYYY-MM-DD
---

# CR-NNN — <one-line ask>

Territory: convex | apps/forum UI | scripts
Why: <what the redesign needs, quoted spec/contract where possible>
Ask: <exact change requested>
```

`CR-NNN-RESPONSE.md`:
```markdown
---
id: CR-NNN
type: CR-RESPONSE
author: dev
date: YYYY-MM-DD
---

Decision: DONE | ALTERNATIVE | DECLINED
Branch/commit: <where it landed, if done>
Notes: <constraints, what was done instead, or why not>
```

## Seed & schema rule

A change to seeds or schema is **never split across commits**: the dev updates
`convex/seed/demo.ts` (or schema + seeders) **and `scripts/seed-fingerprint.txt`
in the SAME commit**. To rotate the fingerprint: run `pnpm seed:check`, copy the
printed value into `scripts/seed-fingerprint.txt`. Every machine's
`session:start` sees the seed change and runs `reset:local` automatically —
that is how parity travels.

## Integration

- Dev branches merge into `011-Akilesh-Redesign` **via a GLM-run merge**
  (weekly, or as soon as a CR lands). No direct pushes to 011 by the dev.
- **Never force-push a shared branch** (011, 013, or anything with collaborators).
- `session:start` fails loudly on divergence instead of auto-merging —
  divergence is a conversation, not a command.

## The daily ritual

1. **`pnpm session:start`** — pulls your branch (fast-forward only), tells you
   if 011 moved ahead, installs only if the lockfile changed, restores data
   parity (reset when seeds/schema changed since your last session, otherwise
   fingerprint check), and prints every machine's last "stopped at" note.
2. work.
3. **`pnpm session:end`** — refuses to end on uncommitted/unpushed work, then
   appends `date / person / branch / head / stopped at:` to your machine's own
   log in `ak-redesign/00-control/session-log/<machine>.md` and pushes it.
   One file per machine = no log conflicts, ever.

Cross-platform by construction: both commands are plain node scripts with the
Windows pnpm/node fallbacks from `scripts/local-setup.mjs`; they run unchanged
on macOS.
