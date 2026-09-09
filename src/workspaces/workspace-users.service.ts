import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, eq, ilike, inArray, or, SQL } from 'drizzle-orm';

import { DATABASE, type DrizzleDB } from '../db/database.provider';
import {
  WorkspaceUser,
  workspaceUsers,
  users,
  posts,
  postVotes,
  postComments,
  externalUsers,
} from '../db/schema';
import { buildPagination } from '../common/utils/build-pagination.util';
import { PaginatedResult } from '../common/types/pagination.type';
import { QueryWorkspaceUsersDto } from './dto/query-workspace-users.dto';
import {
  ActivityFilter,
  QueryUserActivityDto,
} from './dto/query-user-activity.dto';
import { WorkspaceMember } from './types/workspace-member.type';
import {
  ActivitySummary,
  UserActivityPost,
  UserActivityStatus,
} from './types/user-activity.type';

@Injectable()
export class WorkspaceUsersService {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  // --- Internal Users ---

  async getMembership(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceUser> {
    const membership = await this.db.query.workspaceUsers.findFirst({
      where: and(
        eq(workspaceUsers.workspaceId, workspaceId),
        eq(workspaceUsers.userId, userId),
      ),
    });

    if (!membership) {
      throw new NotFoundException('You are not a member of this workspace');
    }

    if (membership.isBanned) {
      throw new ForbiddenException('You have been banned from this workspace');
    }

    return membership;
  }

  async findOneMember(
    workspaceId: string,
    targetUserId: string,
  ): Promise<WorkspaceMember> {
    const [row] = await this.db
      .select({
        id: workspaceUsers.id,
        workspaceId: workspaceUsers.workspaceId,
        userId: workspaceUsers.userId,
        role: workspaceUsers.role,
        isBanned: workspaceUsers.isBanned,
        bannedAt: workspaceUsers.bannedAt,
        createdAt: workspaceUsers.createdAt,
        browserName: workspaceUsers.browserName,
        engineName: workspaceUsers.engineName,
        deviceModel: workspaceUsers.deviceModel,
        osName: workspaceUsers.osName,
        fullName: users.fullName,
        avatarUrl: users.avatarUrl,
        email: users.email,
      })
      .from(workspaceUsers)
      .innerJoin(users, eq(users.id, workspaceUsers.userId))
      .where(
        and(
          eq(workspaceUsers.workspaceId, workspaceId),
          eq(workspaceUsers.userId, targetUserId),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException('This user is not a member of the workspace');
    }

    return row;
  }

  async findAllByWorkspace(
    workspaceId: string,
    query: QueryWorkspaceUsersDto,
  ): Promise<PaginatedResult<WorkspaceMember>> {
    const { page, limit, offset } = query;
    const conditions: SQL[] = [eq(workspaceUsers.workspaceId, workspaceId)];

    if (query.search) {
      conditions.push(
        or(
          ilike(users.fullName, `%${query.search}%`),
          ilike(users.email, `%${query.search}%`),
        )!,
      );
    }

    const where = and(...conditions);

    const [rows, [{ total }]] = await Promise.all([
      this.db
        .select({
          id: workspaceUsers.id,
          workspaceId: workspaceUsers.workspaceId,
          userId: workspaceUsers.userId,
          role: workspaceUsers.role,
          isBanned: workspaceUsers.isBanned,
          bannedAt: workspaceUsers.bannedAt,
          createdAt: workspaceUsers.createdAt,
          browserName: workspaceUsers.browserName,
          engineName: workspaceUsers.engineName,
          deviceModel: workspaceUsers.deviceModel,
          osName: workspaceUsers.osName,
          fullName: users.fullName,
          avatarUrl: users.avatarUrl,
          email: users.email,
        })
        .from(workspaceUsers)
        .innerJoin(users, eq(users.id, workspaceUsers.userId))
        .where(where)
        .orderBy(workspaceUsers.createdAt)
        .limit(limit)
        .offset(offset),
      this.db
        .select({ total: count() })
        .from(workspaceUsers)
        .innerJoin(users, eq(users.id, workspaceUsers.userId))
        .where(where),
    ]);

    return { data: rows, pagination: buildPagination(page, limit, total) };
  }

  async removeUser(
    workspaceId: string,
    targetUserId: string,
  ): Promise<{ message: string }> {
    const membership = await this.findMembershipOrThrow(
      workspaceId,
      targetUserId,
    );

    if (membership.role === 'owner') {
      throw new ForbiddenException('Cannot remove the workspace owner');
    }

    await this.db
      .delete(workspaceUsers)
      .where(
        and(
          eq(workspaceUsers.workspaceId, workspaceId),
          eq(workspaceUsers.userId, targetUserId),
        ),
      );

    return { message: 'User removed successfully' };
  }

  async banUser(
    workspaceId: string,
    targetUserId: string,
  ): Promise<{ message: string }> {
    const membership = await this.findMembershipOrThrow(
      workspaceId,
      targetUserId,
    );

    if (membership.role === 'owner') {
      throw new ForbiddenException('Cannot ban the workspace owner');
    }

    if (membership.isBanned) {
      throw new ConflictException('User is already banned');
    }

    await this.db
      .update(workspaceUsers)
      .set({ isBanned: true, bannedAt: new Date() })
      .where(
        and(
          eq(workspaceUsers.workspaceId, workspaceId),
          eq(workspaceUsers.userId, targetUserId),
        ),
      );

    return { message: 'User banned successfully' };
  }

  async unbanUser(
    workspaceId: string,
    targetUserId: string,
  ): Promise<{ message: string }> {
    const membership = await this.findMembershipOrThrow(
      workspaceId,
      targetUserId,
    );

    if (!membership.isBanned) {
      throw new ConflictException('User is not banned');
    }

    await this.db
      .update(workspaceUsers)
      .set({ isBanned: false, bannedAt: null })
      .where(
        and(
          eq(workspaceUsers.workspaceId, workspaceId),
          eq(workspaceUsers.userId, targetUserId),
        ),
      );

    return { message: 'User unbanned successfully' };
  }

  async getUserActivityStatus(
    workspaceId: string,
    targetUserId: string,
    query: QueryUserActivityDto,
  ): Promise<{
    data: UserActivityStatus;
    pagination: ReturnType<typeof buildPagination>;
  }> {
    const [createdPosts, votedRows, commentedRows] = await Promise.all([
      this.db.query.posts.findMany({
        where: and(
          eq(posts.workspaceId, workspaceId),
          eq(posts.userId, targetUserId),
        ),
        columns: { id: true },
      }),
      this.db.query.postVotes.findMany({
        where: and(
          eq(postVotes.workspaceId, workspaceId),
          eq(postVotes.userId, targetUserId),
        ),
        columns: { postId: true },
      }),
      this.db.query.postComments.findMany({
        where: and(
          eq(postComments.workspaceId, workspaceId),
          eq(postComments.userId, targetUserId),
        ),
        columns: { postId: true },
      }),
    ]);

    return this.buildActivityResponse(
      workspaceId,
      createdPosts,
      votedRows,
      commentedRows,
      query,
    );
  }

  private async findMembershipOrThrow(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceUser> {
    const membership = await this.db.query.workspaceUsers.findFirst({
      where: and(
        eq(workspaceUsers.workspaceId, workspaceId),
        eq(workspaceUsers.userId, userId),
      ),
    });

    if (!membership) {
      throw new NotFoundException('This user is not a member of the workspace');
    }

    return membership;
  }

  // --- External Users ---

  async findAllExternalByWorkspace(
    workspaceId: string,
    query: QueryWorkspaceUsersDto,
  ) {
    const { page, limit, offset } = query;
    const conditions: SQL[] = [eq(externalUsers.workspaceId, workspaceId)];

    if (query.search) {
      conditions.push(
        or(
          ilike(externalUsers.fullName, `%${query.search}%`),
          ilike(externalUsers.email, `%${query.search}%`),
          ilike(externalUsers.externalId, `%${query.search}%`),
        )!,
      );
    }

    const where = and(...conditions);

    const [rows, [{ total }]] = await Promise.all([
      this.db.query.externalUsers.findMany({
        where,
        orderBy: (table, { desc }) => [desc(table.createdAt)],
        limit,
        offset,
      }),
      this.db.select({ total: count() }).from(externalUsers).where(where),
    ]);

    return { data: rows, pagination: buildPagination(page, limit, total) };
  }

  async findOneExternalMember(workspaceId: string, externalUserId: string) {
    const user = await this.db.query.externalUsers.findFirst({
      where: and(
        eq(externalUsers.workspaceId, workspaceId),
        eq(externalUsers.id, externalUserId),
      ),
    });

    if (!user) {
      throw new NotFoundException('External user not found in this workspace');
    }

    return user;
  }

  async removeExternalUser(
    workspaceId: string,
    externalUserId: string,
  ): Promise<{ message: string }> {
    await this.findOneExternalMember(workspaceId, externalUserId);

    await this.db
      .delete(externalUsers)
      .where(
        and(
          eq(externalUsers.workspaceId, workspaceId),
          eq(externalUsers.id, externalUserId),
        ),
      );

    return { message: 'External user removed successfully' };
  }

  async banExternalUser(
    workspaceId: string,
    externalUserId: string,
  ): Promise<{ message: string }> {
    const user = await this.findOneExternalMember(workspaceId, externalUserId);

    if (user.isBanned) {
      throw new ConflictException('External user is already banned');
    }

    await this.db
      .update(externalUsers)
      .set({ isBanned: true, bannedAt: new Date() })
      .where(
        and(
          eq(externalUsers.workspaceId, workspaceId),
          eq(externalUsers.id, externalUserId),
        ),
      );

    return { message: 'External user banned successfully' };
  }

  async unbanExternalUser(
    workspaceId: string,
    externalUserId: string,
  ): Promise<{ message: string }> {
    const user = await this.findOneExternalMember(workspaceId, externalUserId);

    if (!user.isBanned) {
      throw new ConflictException('External user is not banned');
    }

    await this.db
      .update(externalUsers)
      .set({ isBanned: false, bannedAt: null })
      .where(
        and(
          eq(externalUsers.workspaceId, workspaceId),
          eq(externalUsers.id, externalUserId),
        ),
      );

    return { message: 'External user unbanned successfully' };
  }

  async getExternalUserActivityStatus(
    workspaceId: string,
    externalUserId: string,
    query: QueryUserActivityDto,
  ): Promise<{
    data: UserActivityStatus;
    pagination: ReturnType<typeof buildPagination>;
  }> {
    const [createdPosts, votedRows, commentedRows] = await Promise.all([
      this.db.query.posts.findMany({
        where: and(
          eq(posts.workspaceId, workspaceId),
          eq(posts.externalUserId, externalUserId),
        ),
        columns: { id: true },
      }),
      this.db.query.postVotes.findMany({
        where: and(
          eq(postVotes.workspaceId, workspaceId),
          eq(postVotes.externalUserId, externalUserId),
        ),
        columns: { postId: true },
      }),
      this.db.query.postComments.findMany({
        where: and(
          eq(postComments.workspaceId, workspaceId),
          eq(postComments.externalUserId, externalUserId),
        ),
        columns: { postId: true },
      }),
    ]);

    return this.buildActivityResponse(
      workspaceId,
      createdPosts,
      votedRows,
      commentedRows,
      query,
    );
  }

  // --- Shared Helpers ---

  private async buildActivityResponse(
    workspaceId: string,
    createdPosts: { id: string }[],
    votedRows: { postId: string }[],
    commentedRows: { postId: string }[],
    query: QueryUserActivityDto,
  ) {
    const { page, limit, offset } = query;

    const postedIds = new Set(createdPosts.map((p) => p.id));
    const votedIds = new Set(votedRows.map((v) => v.postId));
    const commentedIds = new Set(commentedRows.map((c) => c.postId));

    const summary: ActivitySummary = {
      totalPosts: postedIds.size,
      postsCreated: postedIds.size,
      votesGiven: votedIds.size,
      commentsWritten: commentedRows.length,
    };

    let relevantIds = new Set([...postedIds, ...votedIds, ...commentedIds]);

    if (query.filter === ActivityFilter.POSTED) {
      relevantIds = postedIds;
    } else if (query.filter === ActivityFilter.VOTED) {
      relevantIds = votedIds;
    } else if (query.filter === ActivityFilter.COMMENTED) {
      relevantIds = commentedIds;
    }

    const relevantIdsArray = Array.from(relevantIds);

    if (relevantIdsArray.length === 0) {
      return {
        data: { posts: [], summary },
        pagination: buildPagination(page, limit, 0),
      };
    }

    const where = and(
      eq(posts.workspaceId, workspaceId),
      inArray(posts.id, relevantIdsArray),
    );

    const [postRows, [{ total }]] = await Promise.all([
      this.db.query.posts.findMany({
        where,
        orderBy: (postsTable, { desc }) => [desc(postsTable.createdAt)],
        limit,
        offset,
      }),
      this.db.select({ total: count() }).from(posts).where(where),
    ]);

    const data: UserActivityPost[] = postRows.map((post) => ({
      postId: post.id,
      title: post.title,
      description: post.description,
      votesCount: post.votesCount,
      commentsCount: post.commentsCount,
      createdAt: post.createdAt.toISOString(),
      hasPosted: postedIds.has(post.id),
      hasVoted: votedIds.has(post.id),
      hasCommented: commentedIds.has(post.id),
    }));

    return {
      data: { posts: data, summary },
      pagination: buildPagination(page, limit, total),
    };
  }
}
