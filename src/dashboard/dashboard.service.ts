import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';

import { DATABASE, type DrizzleDB } from '../db/database.provider';
import {
  DashboardQueryDto,
  PopularItemsQueryDto,
} from './dto/dashboard-query.dto';
import { getPeriodRange } from './utils/date-range.util';
import { calculateGrowthRate } from './utils/growth-rate.util';
import {
  calculateHealthScore,
  extractMetrics,
  generateRecommendations,
  getHealthStatus,
} from './utils/health-score.util';
import {
  ActivityRow,
  BoardAggregate,
  HealthMetrics,
  HealthScoreMetrics,
  HomeActivityOverviewResponse,
  HomeHealthScoreResponse,
  HomePopularItemsResponse,
  PopularItemRow,
  PopularPost,
  RawHealthRow,
  StatsAggregate,
} from './types/dashboard.types';

const RESOLVED_STATUS_VALUES = ['completed', 'closed'];

@Injectable()
export class DashboardService {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  async getActivityOverview(
    workspaceId: string,
    query: DashboardQueryDto,
  ): Promise<HomeActivityOverviewResponse> {
    const now = new Date();
    const { currentStart, previousStart, previousEnd } = getPeriodRange(
      query.timeRange,
      now,
    );

    const result = await this.db.execute<ActivityRow>(sql`
      SELECT
        (SELECT COUNT(*) FROM posts
          WHERE workspace_id = ${workspaceId} AND created_at >= ${currentStart}) AS current_posts,
        (SELECT COUNT(*) FROM post_comments
          WHERE workspace_id = ${workspaceId} AND is_spam = false AND created_at >= ${currentStart}) AS current_comments,
        (SELECT COUNT(*) FROM post_votes
          WHERE workspace_id = ${workspaceId} AND created_at >= ${currentStart}) AS current_votes,
        (SELECT COUNT(*) FROM posts
          WHERE workspace_id = ${workspaceId} AND created_at >= ${previousStart} AND created_at < ${previousEnd}) AS previous_posts,
        (SELECT COUNT(*) FROM post_comments
          WHERE workspace_id = ${workspaceId} AND is_spam = false AND created_at >= ${previousStart} AND created_at < ${previousEnd}) AS previous_comments,
        (SELECT COUNT(*) FROM post_votes
          WHERE workspace_id = ${workspaceId} AND created_at >= ${previousStart} AND created_at < ${previousEnd}) AS previous_votes
    `);

    const r = result.rows[0];

    const currentPosts = Number(r.current_posts);
    const currentComments = Number(r.current_comments);
    const currentVotes = Number(r.current_votes);
    const previousPosts = Number(r.previous_posts);
    const previousComments = Number(r.previous_comments);
    const previousVotes = Number(r.previous_votes);

    const postsGrowth = calculateGrowthRate(currentPosts, previousPosts);
    const commentsGrowth = calculateGrowthRate(
      currentComments,
      previousComments,
    );
    const votesGrowth = calculateGrowthRate(currentVotes, previousVotes);

    return {
      timeRange: query.timeRange,
      period: { start: currentStart.toISOString(), end: now.toISOString() },
      overview: {
        posts: {
          current: currentPosts,
          previous: previousPosts,
          growthRate: postsGrowth,
        },
        comments: {
          current: currentComments,
          previous: previousComments,
          growthRate: commentsGrowth,
        },
        votes: {
          current: currentVotes,
          previous: previousVotes,
          growthRate: votesGrowth,
        },
      },
      summary: {
        totalActivity: currentPosts + currentComments + currentVotes,
        averageGrowthRate:
          Math.round(((postsGrowth + commentsGrowth + votesGrowth) / 3) * 100) /
          100,
      },
    };
  }

  async getHealthScore(
    workspaceId: string,
    query: DashboardQueryDto,
  ): Promise<HomeHealthScoreResponse> {
    const now = new Date();
    const { currentStart, previousStart, previousEnd } = getPeriodRange(
      query.timeRange,
      now,
    );

    const [currentRow, previousRow] = await Promise.all([
      this.fetchHealthRow(workspaceId, currentStart, now),
      this.fetchHealthRow(workspaceId, previousStart, previousEnd),
    ]);

    const rawCurrentMetrics: HealthMetrics = extractMetrics(currentRow);
    const rawPreviousMetrics: HealthMetrics = extractMetrics(previousRow);

    const currentMetrics: HealthScoreMetrics = {
      responseRate: rawCurrentMetrics.response_rate,
      avgResponseTime: rawCurrentMetrics.avg_response_time,
      engagementRate: rawCurrentMetrics.engagement_rate,
      resolutionRate: rawCurrentMetrics.resolution_rate,
    };

    const previousMetrics: HealthScoreMetrics = {
      responseRate: rawPreviousMetrics.response_rate,
      avgResponseTime: rawPreviousMetrics.avg_response_time,
      engagementRate: rawPreviousMetrics.engagement_rate,
      resolutionRate: rawPreviousMetrics.resolution_rate,
    };

    const healthScore =
      rawCurrentMetrics.total_posts > 0
        ? calculateHealthScore(rawCurrentMetrics)
        : 100;
    const prevHealthScore = calculateHealthScore(rawPreviousMetrics);

    return {
      healthScore,
      status: getHealthStatus(healthScore, rawCurrentMetrics.total_posts),
      timeRange: query.timeRange,
      metrics: currentMetrics,
      changes: {
        healthScore: Math.round((healthScore - prevHealthScore) * 100) / 100,
        responseRate:
          Math.round(
            (currentMetrics.responseRate - previousMetrics.responseRate) * 100,
          ) / 100,
        avgResponseTime:
          currentMetrics.avgResponseTime !== null &&
          previousMetrics.avgResponseTime !== null
            ? Math.round(
                (currentMetrics.avgResponseTime -
                  previousMetrics.avgResponseTime) *
                  10,
              ) / 10
            : null,
        engagementRate:
          Math.round(
            (currentMetrics.engagementRate - previousMetrics.engagementRate) *
              100,
          ) / 100,
        resolutionRate:
          Math.round(
            (currentMetrics.resolutionRate - previousMetrics.resolutionRate) *
              100,
          ) / 100,
      },
      previousPeriod: {
        ...previousMetrics,
        healthScore: prevHealthScore,
      },
      recommendations: generateRecommendations(rawCurrentMetrics),
      period: {
        current: { start: currentStart.toISOString(), end: now.toISOString() },
        previous: {
          start: previousStart.toISOString(),
          end: previousEnd.toISOString(),
        },
      },
    };
  }

  private async fetchHealthRow(
    workspaceId: string,
    start: Date,
    end: Date,
  ): Promise<RawHealthRow> {
    const result = await this.db.execute<RawHealthRow>(sql`
      SELECT
        (SELECT COUNT(*) FROM posts
          WHERE workspace_id = ${workspaceId} AND created_at >= ${start} AND created_at < ${end}) AS total_posts,

        (SELECT COUNT(*) FROM posts
          WHERE workspace_id = ${workspaceId} AND created_at >= ${start} AND created_at < ${end}
            AND comments_count > 0) AS responded_posts,

        (SELECT COUNT(*) FROM posts p
          JOIN post_statuses ps ON ps.id = p.status_id
          WHERE p.workspace_id = ${workspaceId} AND p.created_at >= ${start} AND p.created_at < ${end}
            AND ps.value IN ${RESOLVED_STATUS_VALUES}) AS resolved_posts,

        (SELECT COUNT(*) FROM post_comments
          WHERE workspace_id = ${workspaceId} AND is_spam = false
            AND created_at >= ${start} AND created_at < ${end}) AS total_comments,

        (SELECT COUNT(*) FROM post_votes
          WHERE workspace_id = ${workspaceId} AND created_at >= ${start} AND created_at < ${end}) AS total_votes,

        (
          SELECT AVG(EXTRACT(EPOCH FROM (first_comment.created_at - p.created_at)) / 3600.0)
          FROM (
            SELECT id, created_at FROM posts
            WHERE workspace_id = ${workspaceId} AND created_at >= ${start} AND created_at < ${end}
              AND comments_count > 0
            ORDER BY created_at DESC
            LIMIT 100
          ) p
          CROSS JOIN LATERAL (
            SELECT created_at FROM post_comments
            WHERE post_id = p.id AND is_spam = false
            ORDER BY created_at ASC
            LIMIT 1
          ) first_comment
          WHERE first_comment.created_at > p.created_at
        ) AS avg_response_hours
    `);

    const r = result.rows[0];

    return {
      total_posts: Number(r.total_posts),
      responded_posts: Number(r.responded_posts),
      resolved_posts: Number(r.resolved_posts),
      total_comments: Number(r.total_comments),
      total_votes: Number(r.total_votes),
      avg_response_hours: r.avg_response_hours
        ? Number(r.avg_response_hours)
        : null,
    };
  }

  async getPopularItems(
    workspaceId: string,
    query: PopularItemsQueryDto,
  ): Promise<HomePopularItemsResponse> {
    const now = new Date();
    const { currentStart: startDate } = getPeriodRange(query.timeRange, now);

    const result = await this.db.execute<PopularItemRow>(sql`
      SELECT
        p.id AS post_id, p.title AS post_title, p.votes_count, p.comments_count, p.created_at,
        p.board_id, b.title AS board_title, b.is_private AS board_is_private,
        p.category_id, c.name AS category_name,
        NULL::uuid AS tag_id, NULL::text AS tag_name
      FROM posts p
      JOIN boards b ON b.id = p.board_id
      LEFT JOIN post_categories c ON c.id = p.category_id
      WHERE p.workspace_id = ${workspaceId} AND p.created_at >= ${startDate}

      UNION ALL

      SELECT
        p.id AS post_id, p.title AS post_title, p.votes_count, p.comments_count, p.created_at,
        p.board_id, b.title AS board_title, b.is_private AS board_is_private,
        p.category_id, c.name AS category_name,
        t.id AS tag_id, t.name AS tag_name
      FROM posts p
      JOIN boards b ON b.id = p.board_id
      LEFT JOIN post_categories c ON c.id = p.category_id
      JOIN post_tags pt ON pt.post_id = p.id AND pt.workspace_id = ${workspaceId}
      JOIN tags t ON t.id = pt.tag_id
      WHERE p.workspace_id = ${workspaceId} AND p.created_at >= ${startDate}
    `);

    return this.aggregatePopularItems(result.rows, query, startDate, now);
  }

  private aggregatePopularItems(
    rows: PopularItemRow[],
    query: PopularItemsQueryDto,
    startDate: Date,
    now: Date,
  ): HomePopularItemsResponse {
    const calculatePostScore = (row: PopularItemRow) => {
      const ageInDays =
        (now.getTime() - new Date(row.created_at).getTime()) / 86400000;
      const votesScore = (row.votes_count || 0) * 3;
      const commentsScore = (row.comments_count || 0) * 2;
      const recencyScore = Math.max(0, 100 - ageInDays * 2);
      return (
        Math.round((votesScore + commentsScore + recencyScore) * 100) / 100
      );
    };

    const postsMap = new Map<string, PopularPost>();
    const boardsMap = new Map<string, BoardAggregate>();
    const categoriesMap = new Map<string, StatsAggregate>();
    const tagsMap = new Map<string, StatsAggregate>();

    for (const row of rows) {
      if (!postsMap.has(row.post_id)) {
        postsMap.set(row.post_id, {
          id: row.post_id,
          title: row.post_title,
          boardName: row.board_title || 'بدون تخته',
          categoryName: row.category_name || 'بدون دسته‌بندی',
          votesCount: Number(row.votes_count) || 0,
          commentsCount: Number(row.comments_count) || 0,
          popularityScore: calculatePostScore(row),
          createdAt: row.created_at,
        });
      }

      if (!boardsMap.has(row.board_id)) {
        boardsMap.set(row.board_id, {
          id: row.board_id,
          title: row.board_title,
          isPrivate: Boolean(row.board_is_private),
          posts: new Set<string>(),
        });
      }
      boardsMap.get(row.board_id)!.posts.add(row.post_id);

      if (row.category_id) {
        if (!categoriesMap.has(row.category_id)) {
          categoriesMap.set(row.category_id, {
            id: row.category_id,
            name: row.category_name!,
            posts: new Set<string>(),
            boards: new Set<string>(),
          });
        }
        categoriesMap.get(row.category_id)!.posts.add(row.post_id);
        categoriesMap.get(row.category_id)!.boards.add(row.board_id);
      }

      if (row.tag_id && row.tag_name) {
        if (!tagsMap.has(row.tag_id)) {
          tagsMap.set(row.tag_id, {
            id: row.tag_id,
            name: row.tag_name,
            posts: new Set<string>(),
            boards: new Set<string>(),
          });
        }
        tagsMap.get(row.tag_id)!.posts.add(row.post_id);
        tagsMap.get(row.tag_id)!.boards.add(row.board_id);
      }
    }

    const sortAndSlice = <T extends { popularityScore: number }>(
      arr: T[],
    ): T[] =>
      [...arr]
        .sort((a, b) => b.popularityScore - a.popularityScore)
        .slice(0, query.limit);

    const posts = sortAndSlice([...postsMap.values()]);

    const boards = sortAndSlice(
      [...boardsMap.values()].map((b) => ({
        id: b.id,
        title: b.title,
        postsCount: b.posts.size,
        isPrivate: b.isPrivate,
        popularityScore: b.posts.size * 10 + (b.isPrivate ? 0 : 5),
      })),
    );

    const categories = sortAndSlice(
      [...categoriesMap.values()].map((c) => ({
        id: c.id,
        name: c.name,
        postsCount: c.posts.size,
        boardCount: c.boards.size,
        popularityScore: c.posts.size * 10 + c.boards.size * 5,
      })),
    );

    const tags = sortAndSlice(
      [...tagsMap.values()].map((t) => ({
        id: t.id,
        name: t.name,
        postsCount: t.posts.size,
        boardCount: t.boards.size,
        popularityScore: t.posts.size * 10 + t.boards.size * 5,
      })),
    );

    return {
      timeRange: query.timeRange,
      limit: query.limit,
      period: {
        start: startDate.toISOString(),
        end: now.toISOString(),
      },
      posts: { total: posts.length, items: posts },
      boards: { total: boards.length, items: boards },
      categories: { total: categories.length, items: categories },
      tags: { total: tags.length, items: tags },
    };
  }
}
