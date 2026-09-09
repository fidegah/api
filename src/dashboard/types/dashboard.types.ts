export type TimeRange = 'daily' | 'weekly' | 'monthly' | 'quarterly';
export type HealthScoreStatus =
  'excellent' | 'good' | 'fair' | 'poor' | 'not_enough_data';

export type ActivityRow = {
  current_posts: number;
  current_comments: number;
  current_votes: number;
  previous_posts: number;
  previous_comments: number;
  previous_votes: number;
  [key: string]: number;
};

export type RawHealthRow = {
  total_posts: number;
  responded_posts: number;
  resolved_posts: number;
  total_comments: number;
  total_votes: number;
  avg_response_hours: number | null;
  [key: string]: number | null;
};

export interface HealthMetrics extends RawHealthRow {
  response_rate: number;
  resolution_rate: number;
  engagement_rate: number;
  avg_response_time: number | null;
}

export type PopularItemRow = {
  post_id: string;
  post_title: string;
  votes_count: number;
  comments_count: number;
  created_at: string;
  board_id: string;
  board_title: string;
  board_is_private: boolean;
  category_id: string | null;
  category_name: string | null;
  tag_id: string | null;
  tag_name: string | null;
  [key: string]: string | number | boolean | null;
};

export interface PeriodDate {
  start: string;
  end: string;
}

export interface ActivityMetric {
  current: number;
  previous: number;
  growthRate: number;
}

export interface HomeActivityOverviewResponse {
  timeRange: TimeRange;
  period: PeriodDate;
  overview: {
    posts: ActivityMetric;
    comments: ActivityMetric;
    votes: ActivityMetric;
  };
  summary: {
    totalActivity: number;
    averageGrowthRate: number;
  };
}

export interface HealthScoreMetrics {
  responseRate: number;
  avgResponseTime: number | null;
  engagementRate: number;
  resolutionRate: number;
}

export interface HomeHealthScoreResponse {
  healthScore: number;
  status: HealthScoreStatus;
  timeRange: TimeRange;
  metrics: HealthScoreMetrics;
  changes: HealthScoreMetrics & { healthScore: number };
  previousPeriod: HealthScoreMetrics & { healthScore: number };
  recommendations: string[];
  period: {
    current: PeriodDate;
    previous: PeriodDate;
  };
}

export interface PopularPost {
  id: string;
  title: string;
  boardName: string;
  categoryName: string;
  votesCount: number;
  commentsCount: number;
  popularityScore: number;
  createdAt: string;
}

export interface BoardAggregate {
  id: string;
  title: string;
  isPrivate: boolean;
  posts: Set<string>;
}

export interface StatsAggregate {
  id: string;
  name: string;
  posts: Set<string>;
  boards: Set<string>;
}

export interface PopularBoard {
  id: string;
  title: string;
  postsCount: number;
  isPrivate: boolean;
  popularityScore: number;
}

export interface PopularStats {
  id: string;
  name: string;
  postsCount: number;
  boardCount: number;
  popularityScore: number;
}

export interface PopularGroup<T> {
  total: number;
  items: T[];
}

export interface HomePopularItemsResponse {
  timeRange: TimeRange;
  limit: number;
  period: PeriodDate;
  posts: PopularGroup<PopularPost>;
  boards: PopularGroup<PopularBoard>;
  categories: PopularGroup<PopularStats>;
  tags: PopularGroup<PopularStats>;
}
