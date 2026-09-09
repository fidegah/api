import {
  HEALTH_SCORE_WEIGHTS,
  HEALTH_STATUS_THRESHOLDS,
  MAX_RESPONSE_HOURS_FOR_ZERO_SCORE,
  NEUTRAL_SPEED_SCORE,
  RECOMMENDATION_THRESHOLDS,
  TARGET_ENGAGEMENT_PER_POST,
} from '../constants/health-score.constant';
import {
  HealthMetrics,
  HealthScoreStatus,
  RawHealthRow,
} from '../types/dashboard.types';

export function extractMetrics(row: RawHealthRow): HealthMetrics {
  const responseRate =
    row.total_posts > 0 ? (row.responded_posts / row.total_posts) * 100 : 0;

  const resolutionRate =
    row.total_posts > 0 ? (row.resolved_posts / row.total_posts) * 100 : 0;

  const engagementRate =
    row.total_posts > 0
      ? (row.total_comments + row.total_votes) / row.total_posts
      : 0;

  return {
    ...row,
    response_rate: Math.round(responseRate * 100) / 100,
    resolution_rate: Math.round(resolutionRate * 100) / 100,
    engagement_rate: Math.round(engagementRate * 100) / 100,
    avg_response_time: row.avg_response_hours
      ? Math.round(row.avg_response_hours * 10) / 10
      : null,
  };
}

export function calculateHealthScore(metrics: HealthMetrics): number {
  const responseScore =
    Math.min(metrics.response_rate, 100) * HEALTH_SCORE_WEIGHTS.response;
  const resolutionScore =
    Math.min(metrics.resolution_rate, 100) * HEALTH_SCORE_WEIGHTS.resolution;

  const engagementScore =
    Math.min(
      (metrics.engagement_rate / TARGET_ENGAGEMENT_PER_POST) * 100,
      100,
    ) * HEALTH_SCORE_WEIGHTS.engagement;

  const speedScore =
    metrics.avg_response_time !== null
      ? Math.max(
          0,
          100 -
            (metrics.avg_response_time / MAX_RESPONSE_HOURS_FOR_ZERO_SCORE) *
              100,
        ) * HEALTH_SCORE_WEIGHTS.speed
      : NEUTRAL_SPEED_SCORE;

  const total = responseScore + resolutionScore + engagementScore + speedScore;

  return Math.round(Math.min(total, 100) * 100) / 100;
}

export function getHealthStatus(
  score: number,
  totalPosts: number,
): HealthScoreStatus {
  if (totalPosts === 0) return 'not_enough_data';
  if (score >= HEALTH_STATUS_THRESHOLDS.excellent) return 'excellent';
  if (score >= HEALTH_STATUS_THRESHOLDS.good) return 'good';
  if (score >= HEALTH_STATUS_THRESHOLDS.fair) return 'fair';
  return 'poor';
}

export function generateRecommendations(metrics: HealthMetrics): string[] {
  if (metrics.total_posts === 0) {
    return [
      'هنوز پستی در این بازه زمانی ثبت نشده است. با ایجاد اولین پست، تحلیل سلامت فضای‌کاری آغاز می‌شود.',
    ];
  }

  const recommendations: string[] = [];

  if (metrics.response_rate < RECOMMENDATION_THRESHOLDS.lowResponseRate) {
    recommendations.push(
      'نرخ پاسخ‌دهی پایینه — سعی کنید سریع‌تر به پست‌ها واکنش نشون بدید.',
    );
  }

  if (metrics.resolution_rate < RECOMMENDATION_THRESHOLDS.lowResolutionRate) {
    recommendations.push(
      'نرخ حل مسائل پایینه — پست‌های در انتظار رو بررسی و به سرانجام برسونید.',
    );
  }

  if (
    metrics.avg_response_time !== null &&
    metrics.avg_response_time > RECOMMENDATION_THRESHOLDS.highResponseHours
  ) {
    recommendations.push(
      'میانگین زمان پاسخ‌دهی بالاست — تلاش کنید سریع‌تر پاسخ اولیه بدید.',
    );
  }

  if (metrics.engagement_rate < RECOMMENDATION_THRESHOLDS.lowEngagementRate) {
    recommendations.push(
      'تعامل کاربران پایینه — کاربران رو به رأی‌دادن و نظردادن تشویق کنید.',
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('عملکرد workspace شما عالیه، همینطور ادامه بدید!');
  }

  return recommendations;
}
