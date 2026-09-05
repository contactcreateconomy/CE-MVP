/**
 * glm — SLICE-P4-07: the GLM seam for the M3 soft scores (S-DISC/S-VAL,
 * CAP-078/079) and future GLM consumers (forge P4-09 extends this, never
 * forks). GLM is the platform-wide chosen provider (decisions log).
 *
 * Fail-closed: missing env config or provider errors THROW — a dependency
 * error fails the whole qualification run closed (CAP-064: "fail-closed on
 * any dependency error"). Soft scores are never fabricated.
 */

export interface GlmScore {
  score: number; // 0–5
  evidence: string;
}

export async function glmScore(ruleKey: string, prompt: string): Promise<GlmScore> {
  const apiKey = process.env.GLM_API_KEY;
  const baseUrl = process.env.GLM_API_BASE ?? "https://open.bigmodel.cn/api/paas/v4";
  const model = process.env.GLM_MODEL ?? "glm-4";
  if (!apiKey) {
    throw new Error(`glm: GLM_API_KEY unset — ${ruleKey} cannot score (dependency error, fail-closed)`);
  }
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            `You score content on one dimension for rule ${ruleKey}. Reply with STRICT JSON only: ` +
            `{"score": <integer 0-5>, "evidence": "<one sentence>"}.`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    }),
  });
  if (!response.ok) {
    throw new Error(`glm: provider error ${response.status} for ${ruleKey} (fail-closed)`);
  }
  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content ?? "";
  try {
    const parsed = JSON.parse(content) as { score?: number; evidence?: string };
    if (typeof parsed.score !== "number" || parsed.score < 0 || parsed.score > 5) {
      throw new Error("score out of range");
    }
    return { score: Math.round(parsed.score), evidence: parsed.evidence ?? `${ruleKey} GLM score` };
  } catch {
    throw new Error(`glm: unparseable ${ruleKey} response (fail-closed): ${content.slice(0, 120)}`);
  }
}
