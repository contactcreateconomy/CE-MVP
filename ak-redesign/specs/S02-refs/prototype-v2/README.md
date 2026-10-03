Founder's latest design (2026-10-03), sliced from CEMVP (path: `Documents/Createconomy/Design/createconomy-frontend/CEMVP`, commit `414610d` 2026-04-25 + 32 uncommitted working-tree files as of the slice — the working tree is what ran on localhost:3004).

WINS over `prototype/` for **Feed** and **Login/Sign-up**. All other screens: `prototype/` remains the reference.

Not runnable here; run CEMVP for the live version. Byte-identical slice (114 files, ~465K, md5-verified), traced by following imports from the `/feed` page, the app/shell layouts, and `packages/auth-ui` — includes globals.css tokens, theme provider, fonts, and the category card bodies the feed renders. Never import from this folder (excluded from tsconfig/eslint/tests/graphify; `-text`-pinned in `.gitattributes`). Secret-scanned: clean.
