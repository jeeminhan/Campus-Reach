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
