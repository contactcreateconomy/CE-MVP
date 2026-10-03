const ringPalette = ["#22c55e", "#14b8a6", "#0ea5e9", "#8b5cf6", "#f59e0b", "#ef4444"];

export function getUserLevelRingColor(level: number) {
  const safeLevel = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1;
  return ringPalette[(safeLevel - 1) % ringPalette.length];
}
