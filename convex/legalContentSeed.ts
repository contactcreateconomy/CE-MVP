/**
 * Seed content for the versioned legal/trust documents (DECISIONS-LOCKED #9).
 *
 * Each document is founder-drafted, structured Markdown stored as
 * `contentVersions` rows. The header banner travels WITH the content so the
 * not-lawyer-reviewed status is visible in every rendered version until a
 * reviewed draft is published as a new version.
 *
 * Mechanics referenced are the real implemented/locked ones:
 * policyFamily taxonomy (DECISIONS-LOCKED #4), legal-intake identity + rate
 * rules (#6), consent→vendor-deletion outbox (#7), appeal SLA (7 business
 * days), legal-hold precedence over erasure (INV-8), erased values never
 * retained in audit trails, strictly-necessary server events vs consent-gated
 * product analytics.
 */

const FOUNDER_HEADER = `> ⚠️ **Founder-drafted, not lawyer-reviewed — scheduled for legal review before public launch.** This document describes the platform's actual, implemented mechanics and will be reviewed by qualified counsel before general availability (\`signup.mode=open\`).`;

export const TERMS_V1 = `# Terms of Service

${FOUNDER_HEADER}

**Version:** 1 · **Effective:** 2026-09-04 · **Governing law:** *[to be set by legal review]*

## 1. What Createconomy is

Createconomy is a curated creator-discussion platform. Content is produced through an editorial pipeline: our operators source material, an AI-assisted pipeline drafts candidate posts, and human editors review, verify claims against source evidence, and approve publication before anything goes live. AI personas may also participate in discussions; their contributions are always labeled as AI-generated. We apply automated qualification checks to drafted content (source authorization, grounding, similarity, safety, disclosure) before a human makes the final editorial call.

## 2. Your account

- Access is by invitation or open admission depending on our admission mode, using a magic-link (passwordless) sign-in to your email address.
- When you join, we ask you to confirm basic profile information. Your timezone is detected automatically (defaulting to UTC if detection fails) and you can change it in Settings at any time.
- You must be of legal age to form a binding contract in your jurisdiction. Misrepresenting this may result in account restriction.

## 3. Member content and conduct

- Most published content is editorially produced. Member contributions (comments, reactions, resource references during open pilot periods, storefront listings for approved sellers) are subject to moderation.
- Our moderation system organizes reports into families — spam; harassment & abuse; misinformation; copyright/IP; other legal claims; quality-guideline violations; and safety/illegal content. Sanctions scale with severity and repeat behavior, up to account termination.
- You may appeal moderation decisions. Appeals are resolved within **7 business days**; overdue appeals escalate internally rather than auto-resolving.

## 4. Storefronts, affiliate links, and disclosures

- Approved sellers may operate storefronts. Product links that earn us affiliate commission are labeled as such, and outbound commercial links pass through an interstitial disclosure page. We never auto-redirect you off-platform without that explicit disclosure step.
- Where conversion verification differs (e.g., self-reported vs network-verified purchases), the difference is displayed, never conflated.

## 5. AI disclosure

AI-assisted editorial content and AI-persona comments are labeled as such. Our AI-disclosure and provenance pages describe the pipeline in more detail.

## 6. Suspension and termination

We may restrict or terminate accounts for policy violations (see the Repeat-Infringer Policy), legal compliance, or protection of the platform. Where possible, restrictions are appealable under Section 3.

## 7. Disclaimers and limitation of liability

The service is provided "as is." To the maximum extent permitted by law, Createconomy is not liable for indirect or consequential damages. Nothing in these terms limits liability that cannot be limited by law.

## 8. Changes to these terms

Material changes are versioned and published; continued use after the effective date constitutes acceptance. Prior versions remain retrievable through our version history.

## 9. Contact

*[Legal contact to be set before public launch.]*
`;

export const PRIVACY_V1 = `# Privacy Policy

${FOUNDER_HEADER}

**Version:** 1 · **Effective:** 2026-09-04

## 1. Who we are

Createconomy ("we", "the platform") operates a curated creator-discussion platform. This policy describes what we collect, why, and the exact controls you have.

## 2. Data we collect

**Account data:** your email address, authentication identifiers, display name, avatar, bio, timezone (auto-detected at signup from your browser/IP; UTC if detection fails — editable in Settings), and account-standing state.

**Strictly necessary service events:** our server records operational events (e.g., security, moderation, abuse-prevention, and reliability signals) that are required to run and protect the service. These **server-side events are not consent-dependent** and are collected under our legitimate-interest/security basis; they are minimized and never used for advertising.

**Optional product analytics:** with your explicit consent (via the consent banner), we enable a third-party product-analytics vendor (PostHog) to receive behavioral events that help us improve the product. **No analytics request is made to the vendor before you grant consent.**

**Content you contribute:** comments, reactions, resource references, storefront data, and moderation records associated with them.

## 3. The consent control — and what withdrawal actually does

You can grant or withdraw analytics consent at any time from the consent preferences panel.

Withdrawal works as a durable, verifiable process — not a promise:

1. **Request:** withdrawal immediately records a durable  instruction and stops future vendor capture.
2. **Deletion job:** a background job transmits the deletion instruction to the analytics vendor (PostHog), retrying automatically if the vendor is unavailable.
3. **Confirmation:** the platform tracks the request as  until the vendor confirms deletion, and the confirmed state is visible to our administrators.

This is the same mechanism our operators audit; we do not treat "request sent" as "data deleted" — confirmation is tracked.

## 4. Erasure and retention

- You may request erasure of your profile data through legal intake. Erasure detaches your public handle and removes personal values; audit records of security-relevant actions are retained in non-value-bearing form (erased values are never retained inside them).
- **Legal hold precedence:** where content is subject to an active legal notice (e.g., a DMCA dispute), retention required for that process takes precedence over erasure for its duration.
- Moderation and security records are retained per our retention schedules.

## 5. Cookies and similar technologies

We use strictly necessary session storage. The optional analytics vendor sets identifiers **only after** you grant consent in the banner.

## 6. Your rights

Depending on your jurisdiction you may have rights of access, correction, deletion, portability, and objection. Exercise them via our legal/grievance intake (see the DMCA & Legal page). Identity requirements are proportionate to the request type.

## 7. Processors

We use: our backend/database provider (Convex), our authentication provider, and — only with your consent — PostHog (product analytics). *[Full subprocessor list and transfer basis to be completed at legal review.]*

## 8. Changes

This policy is versioned; the published version is always what applies. Prior versions remain retrievable.

## 9. Contact

*[Privacy contact to be set before public launch.]*
`;

export const DMCA_V1 = `# DMCA Policy & Copyright Complaints

${FOUNDER_HEADER}

**Version:** 1 · **Effective:** 2026-09-04

## 1. Overview

Createconomy respects copyright and responds to valid notices of alleged infringement under 17 U.S.C. §512 ("DMCA"). This page describes exactly what a valid notice requires, how we process it, and the counter-notice procedure.

## 2. Filing a takedown notice (statutory elements)

A valid takedown notice **must include all of the following** — these are the statutory minimum, and we cannot act on notices missing them:

1. **Your full legal name**
2. **Your physical address**
3. **Your email address**
4. **Identification of the copyrighted work(s)** claimed to be infringed
5. **Identification of the material** on Createconomy you want removed (URL or precise location)
6. **A statement of good-faith belief** that the use is not authorized by the copyright owner, its agent, or law
7. **A statement, under penalty of perjury,** that the information is accurate and that you are the owner or authorized to act on the owner's behalf
8. **Your electronic signature** (typed name counts as an attestation)

Submit through the **Legal & Rights Intake** page (\`/legal/intake\`), which enforces these fields at submission time.

## 3. Processing rules we actually apply

- **Rate limit:** submissions are capped at **5 per rolling 24 hours per email+IP pair** to prevent abuse of the process.
- **Deduplication:** repeat notices for the same content and claim type within a rolling 24-hour window are consolidated — resubmission does not accelerate handling.
- **SLA clock:** our processing deadlines are measured in **U.S. business days (Mon–Fri, federal holidays excluded)**.
- Copyright complaints route into our moderation system under the \`copyright_ip\` family, which connects them to the dedicated legal workflow — not the ordinary content-quality queue.

## 4. Counter-notice

If your content was removed and you believe it was a mistake or misidentification, you may file a counter-notice through the same intake with the same identity requirements (legal name, physical address, email, signature attestation) plus: identification of the removed material and its former location, a statement under penalty of perjury of a good-faith belief in the error, and consent to jurisdiction of your local federal court (or, if abroad, of a designated U.S. district). Upon a valid counter-notice, we will forward it to the original complainant, who has 10 business days to seek a court order before the material may be restored.

## 5. Repeat infringers

Senders and recipients are both subject to the Repeat-Infringer Policy.

## 6. Misrepresentations

Under §512(f), knowingly material misrepresentations in a notice or counter-notice may create liability for damages.

## 7. Contact

*[Designated agent contact to be set before public launch.]*
`;

export const REPEAT_INFRINGER_V1 = `# Repeat-Infringer Policy

${FOUNDER_HEADER}

**Version:** 1 · **Effective:** 2026-09-04

## 1. Purpose

This policy explains how Createconomy identifies and handles accounts that repeatedly violate our policies — with a dedicated escalation path for repeat **copyright** infringement.

## 2. How violations are tracked

Every policy violation handled by moderation is recorded as a case in our moderation system. Each case is classified into a **policy family**:

- \`spam\` — duplicate, promotional, or bot-driven content
- \`harassment_abuse\` — targeted harassment, hate speech, threats
- \`misinformation\` — false or misleading claims
- \`copyright_ip\` — DMCA/IP claims (**routes to the legal workflow**, and this policy's copyright ladder)
- \`legal_other\` — privacy, defamation, other non-IP legal claims
- \`quality_guidelines\` — off-topic, low-effort, category-rule violations
- \`safety_illegal\` — illegal content or imminent harm (highest severity, fastest handling)

Duplicate reports of the same conduct within a window are consolidated into one open case per target and family — volume of reports does not itself escalate a matter, only verified findings do.

## 3. The copyright ladder (\`copyright_ip\`)

For validated copyright complaints (per the DMCA Policy):

1. **First validated strike** — formal strike recorded; the member is notified with the ability to appeal.
2. **Repeat strikes within the rolling evaluation window** — the automated repeat-infringer evaluation runs periodically and applies escalating restrictions (upload caps, feature restrictions) proportionate to the count and recency of validated strikes.
3. **Sustained repeat infringement** — account termination. Terminal actions require the highest moderation authority and are always audit-logged.

Strike thresholds and the evaluation window are administered platform-side and applied uniformly; they are versioned with this policy so that the ladder's shape is public even as numbers are tuned.

## 4. Appeals

Every strike is appealable. Appeals are resolved within **7 business days** (U.S. business days, federal holidays excluded). An overturned strike is removed from the ladder. Overdue appeals escalate internally rather than auto-resolving.

## 5. Evasion and abuse of process

Creating new accounts to evade restrictions, or bad-faith mass filing (against senders of DMCA notices as well), is itself a violation handled under \`safety_illegal\` / \`legal_other\` families.

## 6. Transparency

Counts of validated strikes and restriction state are visible to the affected member; this policy's enforcement is recorded in the audit trail.
`;

export const LEGAL_SEED_DOCS: { docKey: string; title: string; bodyMarkdown: string }[] = [
  { docKey: "terms", title: "Terms of Service", bodyMarkdown: TERMS_V1 },
  { docKey: "privacy", title: "Privacy Policy", bodyMarkdown: PRIVACY_V1 },
  { docKey: "dmca", title: "DMCA Policy & Copyright Complaints", bodyMarkdown: DMCA_V1 },
  { docKey: "repeat-infringer", title: "Repeat-Infringer Policy", bodyMarkdown: REPEAT_INFRINGER_V1 },
];
