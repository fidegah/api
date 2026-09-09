import { TimeRange } from '../types/dashboard.types';

export interface PeriodRange {
  currentStart: Date;
  previousStart: Date;
  previousEnd: Date;
}

const DAYS_BACK_MAP: Record<TimeRange, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  quarterly: 90,
};

export function getPeriodRange(
  timeRange: TimeRange,
  now: Date = new Date(),
): PeriodRange {
  const daysBack = DAYS_BACK_MAP[timeRange] ?? DAYS_BACK_MAP.monthly;
  const dayMs = 24 * 60 * 60 * 1000;

  const currentStart = new Date(now.getTime() - daysBack * dayMs);
  const previousEnd = new Date(currentStart);
  const previousStart = new Date(previousEnd.getTime() - daysBack * dayMs);

  return { currentStart, previousStart, previousEnd };
}
