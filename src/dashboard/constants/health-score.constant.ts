export const HEALTH_SCORE_WEIGHTS = {
  response: 0.35,
  resolution: 0.35,
  engagement: 0.2,
  speed: 0.1,
} as const;

export const MAX_RESPONSE_HOURS_FOR_ZERO_SCORE = 72;

export const NEUTRAL_SPEED_SCORE = 5;

export const TARGET_ENGAGEMENT_PER_POST = 10;

export const HEALTH_STATUS_THRESHOLDS = {
  excellent: 80,
  good: 60,
  fair: 40,
} as const;

export const RECOMMENDATION_THRESHOLDS = {
  lowResponseRate: 50,
  lowResolutionRate: 30,
  highResponseHours: 48,
  lowEngagementRate: 1,
} as const;
