export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  const growthRate = ((current - previous) / previous) * 100;
  return Math.round(growthRate * 100) / 100;
}
