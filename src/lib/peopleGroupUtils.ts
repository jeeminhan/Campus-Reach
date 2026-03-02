/**
 * Computes how many people groups to show for a country,
 * proportional to that country's share of total international students.
 *
 * Formula: clamp(round(share * 50), 1, 15)
 * - 20% share → 10 groups
 * - 10% share → 5 groups
 * - <2% share → 1 group (minimum)
 * - >30% share → 15 groups (maximum)
 */
export function computeLimit(studentCount: number, totalInternational: number): number {
  if (totalInternational <= 0) return 1;
  const share = studentCount / totalInternational;
  return Math.max(1, Math.min(15, Math.round(share * 50)));
}

// Base color: #1e3a5f (dim slate-blue for low student share)
// Full color: #1d4ed8 (vivid blue-700 for high student share)
const LOW = [30, 58, 95] as const;
const HIGH = [29, 78, 216] as const;

/**
 * Interpolates between a dim blue and vivid blue based on intensity (0–1).
 * Returns a CSS rgb() string.
 */
export function interpolateBlue(intensity: number): string {
  const t = Math.max(0, Math.min(1, intensity));
  const r = Math.round(LOW[0] + (HIGH[0] - LOW[0]) * t);
  const g = Math.round(LOW[1] + (HIGH[1] - LOW[1]) * t);
  const b = Math.round(LOW[2] + (HIGH[2] - LOW[2]) * t);
  return `rgb(${r},${g},${b})`;
}
