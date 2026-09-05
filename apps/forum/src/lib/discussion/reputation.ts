export function reputationLabel(points: number): string {
  if (points >= 8000) return "Pro Creator";
  if (points >= 4500) return "AI Builder";
  return "Rising Creator";
}
