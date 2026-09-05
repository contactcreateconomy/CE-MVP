/**
 * similarity — SLICE-P4-07: pure text-similarity math for the H-SIM
 * surface layer and H-DUP (M3 §8: "n-gram exact-run + 5-word-shingle
 * Jaccard + LCS"). No Convex, no I/O — unit-tested directly.
 *
 * The SEMANTIC layer's cosine comes from ctx.vectorSearch at runtime
 * (orchestrator); `cosine` here serves tests + any local recompute.
 */

/** Lowercased word tokens (punctuation-stripped). */
export function wordTokens(text: string): string[] {
  return text.toLowerCase().split(/[^a-z0-9']+/).filter(Boolean);
}

/** N-word shingles as a Set (M3 §8: 5-word shingles). */
export function shingles(text: string, n = 5): Set<string> {
  const tokens = wordTokens(text);
  const out = new Set<string>();
  for (let i = 0; i + n <= tokens.length; i++) {
    out.add(tokens.slice(i, i + n).join(" "));
  }
  return out;
}

/** Jaccard similarity of two shingle sets: |A∩B| / |A∪B|. */
export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const s of a) if (b.has(s)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** Longest common CONTIGUOUS word run (LCS-substring over tokens) — M3's
 *  "n-gram exact-run" evidence. Dynamic-programming O(n·m); texts here are
 *  paragraphs, not corpora. */
export function longestCommonRun(a: string, b: string): number {
  const A = wordTokens(a);
  const B = wordTokens(b);
  if (A.length === 0 || B.length === 0) return 0;
  let best = 0;
  let prev = new Array<number>(B.length + 1).fill(0);
  for (let i = 1; i <= A.length; i++) {
    const cur = new Array<number>(B.length + 1).fill(0);
    for (let j = 1; j <= B.length; j++) {
      if (A[i - 1] === B[j - 1]) {
        cur[j] = prev[j - 1] + 1;
        if (cur[j] > best) best = cur[j];
      }
    }
    prev = cur;
  }
  return best;
}

/** Cosine similarity of two equal-length vectors. */
export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/** Per-paragraph + whole-doc surface similarity (M3 §8 H-SIM surface:
 *  "per-paragraph + whole-doc"). Returns the max jaccard + max common run
 *  across every (paragraph, comparisonText) pair plus the whole document. */
export function surfaceSimilarity(
  document: string,
  comparisonTexts: string[],
): { maxJaccard: number; maxCommonRun: number } {
  const paragraphs = document.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const units = [...paragraphs, document];
  let maxJaccard = 0;
  let maxCommonRun = 0;
  for (const unit of units) {
    const unitShingles = shingles(unit);
    for (const comparison of comparisonTexts) {
      const j = jaccard(unitShingles, shingles(comparison));
      if (j > maxJaccard) maxJaccard = j;
      const run = longestCommonRun(unit, comparison);
      if (run > maxCommonRun) maxCommonRun = run;
    }
  }
  return { maxJaccard, maxCommonRun };
}
