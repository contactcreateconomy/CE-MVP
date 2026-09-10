/**
 * reasonCodes seed — SLICE-P7E-10, CAP-360 (quoted): "policyReasonCodes
 * seeded (incl. autoReleaseEligible flags) at launch."
 *
 * CAP-333 allowlist (quoted): "profanity_soft / off_topic_uncertain /
 *   low_substance / wrong_post_type_uncertain" — those four carry
 *   autoReleaseEligible=true.
 * CAP-323 (quoted): classifier-unavailable holds are NEVER autoReleaseEligible
 *   — every non-allowlist code seeds autoReleaseEligible=false.
 * Codes are the literals the live case writers already emit (P4-05 533,
 * P5-02 154, P6-15/18) plus the CAP-102/321 gate classes P7E-11 wires and
 * the report-intake families P7E-12 writes — transcribed, not invented.
 * userFacingTitle/Body seed as neutral operational copy ("..." pending
 * legal-owned wording per CAP-358's new-version path — never invented).
 */

export const AUTORELEASE_ALLOWLIST = [
  "profanity_soft",
  "off_topic_uncertain",
  "low_substance",
  "wrong_post_type_uncertain",
] as const;

type SeedCode = {
  code: string;
  severity: string; // moderationCases severity literal
  defaultAction: string;
  appealable: boolean;
  policyFamily: string; // the bible l.238 family this code routes under
};

export const REASON_CODE_SEED: SeedCode[] = [
  // CAP-333 soft allowlist — autoReleaseEligible=true
  { code: "profanity_soft", severity: "s3_low", defaultAction: "hold_auto_release", appealable: false, policyFamily: "quality_guidelines" },
  { code: "off_topic_uncertain", severity: "s3_low", defaultAction: "hold_auto_release", appealable: false, policyFamily: "quality_guidelines" },
  { code: "low_substance", severity: "s3_low", defaultAction: "hold_auto_release", appealable: false, policyFamily: "quality_guidelines" },
  { code: "wrong_post_type_uncertain", severity: "s3_low", defaultAction: "hold_auto_release", appealable: false, policyFamily: "quality_guidelines" },
  // CAP-321 autoGate deterministic classes — never autoReleaseEligible
  { code: "url_obfuscation", severity: "s1_high", defaultAction: "hold", appealable: true, policyFamily: "spam_manipulation" },
  { code: "duplicate_content", severity: "s2_medium", defaultAction: "hold", appealable: true, policyFamily: "spam_manipulation" },
  { code: "velocity_burst", severity: "s2_medium", defaultAction: "hold", appealable: true, policyFamily: "spam_manipulation" },
  { code: "classifier_unavailable", severity: "s2_medium", defaultAction: "held_for_review", appealable: false, policyFamily: "quality_guidelines" },
  // report intake (P7E-12 — comment target)
  { code: "report_spam", severity: "s2_medium", defaultAction: "triage", appealable: true, policyFamily: "spam_manipulation" },
  { code: "report_harassment", severity: "s1_high", defaultAction: "triage", appealable: true, policyFamily: "harassment_abuse" },
  { code: "report_misinformation", severity: "s2_medium", defaultAction: "triage", appealable: true, policyFamily: "misinformation" },
  { code: "report_copyright", severity: "s1_high", defaultAction: "route_legal", appealable: true, policyFamily: "copyright_ip" },
  { code: "report_illegal", severity: "s0_critical", defaultAction: "escalate", appealable: false, policyFamily: "safety_illegal" },
  { code: "report_off_topic", severity: "s3_low", defaultAction: "triage", appealable: false, policyFamily: "quality_guidelines" },
  // existing case writers (transcribed from the live emit sites)
  { code: "auto_rating_outlier", severity: "s2_medium", defaultAction: "triage", appealable: true, policyFamily: "spam_manipulation" },
  { code: "auto_rating_velocity", severity: "s2_medium", defaultAction: "triage", appealable: true, policyFamily: "spam_manipulation" },
  { code: "owner_hide_for_review", severity: "s3_low", defaultAction: "review", appealable: false, policyFamily: "quality_guidelines" },
  { code: "off_topic_signal", severity: "s3_low", defaultAction: "review", appealable: false, policyFamily: "quality_guidelines" },
  { code: "merchant_complaint", severity: "s2_medium", defaultAction: "review", appealable: true, policyFamily: "legal_other" },
  { code: "affiliate.soft_deactivate", severity: "s3_low", defaultAction: "review", appealable: false, policyFamily: "legal_other" },
  { code: "emergency_pull", severity: "s1_high", defaultAction: "actioned", appealable: true, policyFamily: "legal_other" },
  { code: "attribution_erasure", severity: "s3_low", defaultAction: "actioned", appealable: false, policyFamily: "legal_other" },
  { code: "member_erasure", severity: "s3_low", defaultAction: "actioned", appealable: false, policyFamily: "legal_other" },
  { code: "editorial.rejected", severity: "s3_low", defaultAction: "resolved_no_action", appealable: false, policyFamily: "quality_guidelines" },
];

const POLICY_VERSION = "m13.v1";

export async function seedReasonCodes(ctx: any): Promise<string[]> {
  const result: string[] = [];
  const now = Date.now();
  for (const row of REASON_CODE_SEED) {
    // version-forward discipline: only insert v1 once; later versions ride
    // CAP-358/429 mutations, never this seeder
    const existing = await ctx.db
      .query("policyReasonCodes")
      .withIndex("by_code_version", (q: any) => q.eq("code", row.code).eq("version", 1))
      .unique();
    if (existing) {
      result.push(`reasonCode:${row.code}: skipped`);
      continue;
    }
    await ctx.db.insert("policyReasonCodes", {
      code: row.code,
      severity: row.severity,
      defaultAction: row.defaultAction,
      userFacingTitle: row.code, // neutral operational copy — legal edits forward (CAP-358)
      userFacingBody: "Pending policy copy.", // founder/legal-owned — never invented here
      policyUrlAnchor: "",
      appealable: row.appealable,
      active: true,
      version: 1,
      effectiveFrom: now,
      autoReleaseEligible: (AUTORELEASE_ALLOWLIST as readonly string[]).includes(row.code),
    });
    result.push(`reasonCode:${row.code}: seeded`);
  }
  return result;
}

export const REASON_CODE_POLICY_VERSION = POLICY_VERSION;
