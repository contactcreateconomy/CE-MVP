# CONVENTIONS (owner: Opus; changes only via DECISIONS)
- Spec IDs S00–S99 (S00 = foundation). Task IDs S01-T01. Rounds -R2, -R3.
- Files: {ID}-{TYPE}.md. TYPES: NOTES(Founder) SPEC(Opus) BUILD(GLM) REVIEW(Grok)
  VERDICT(Opus) GATE(Astra).
- Every file starts with header: id / type / author-model / tool / round / status / date.
- Single writer: only the owner edits a file; others respond with their own file.
- STATUS.md and DECISIONS.md: Opus only.
- Status: DRAFT → APPROVED → BUILDING → IN-REVIEW → RETURNED|ACCEPTED → DONE.
- Branch: s01-t01-short-name. Commit: [S01-T01][BUILD][GLM] message.
- Precedence: ak-redesign/ wins on UI/UX. docs/ (PRD) is reference; authoritative for
  backend contracts unless a DECISION overrides. Conflicts → DECISIONS as "needs founder".
- Backend change = change request → DECISION + founder approval before any spec.
- No model names in code comments.
