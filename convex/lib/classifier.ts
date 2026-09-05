/**
 * classifier — SLICE-P4-07: the H-SAFE dedicated moderation-classifier seam
 * (M3 §8: "dedicated moderation classifier (not GLM self-check)"; CAP-073).
 *
 * The register names no provider. Until dev wires one (DEV-HANDOFF #7 —
 * PIPELINE-BLOCKING), this seam reports `available: false` and H-SAFE
 * fail-closed-holds every candidate: correct posture, and it makes the
 * pipeline's dependency explicit rather than silently passing content.
 *
 * Provider integration contract: implement `classifySafety` against the
 * chosen provider, keep the return shape, and never fall back to GLM.
 */

export interface SafetyClassification {
  available: boolean;
  unsafe?: boolean;
  provider?: string;
}

export async function classifySafety(_text: string): Promise<SafetyClassification> {
  const apiKey = process.env.MODERATION_CLASSIFIER_API_KEY;
  const endpoint = process.env.MODERATION_CLASSIFIER_ENDPOINT;
  if (!apiKey || !endpoint) {
    return { available: false };
  }
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ text: _text }),
    });
    if (!response.ok) {
      // Provider error = unavailable = fail-closed (never pass-through).
      return { available: false, provider: endpoint };
    }
    const result = (await response.json()) as { unsafe?: boolean };
    return { available: true, unsafe: result.unsafe === true, provider: endpoint };
  } catch {
    return { available: false, provider: endpoint };
  }
}
