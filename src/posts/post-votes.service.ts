import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, sql } from 'drizzle-orm';

import { DATABASE, type DrizzleDB } from '../db/database.provider';
import { externalUsers, postVotes, posts, users } from '../db/schema';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { buildPagination } from '../common/utils/build-pagination.util';
import { PaginatedResult } from '../common/types/pagination.type';

export interface PostVoter {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  votedAt: Date;
  isExternal: boolean;
}

@Injectable()
export class PostVotesService {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  async findVotersByPost(
    postId: string,
    workspaceId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResult<PostVoter>> {
    const { page, limit, offset } = paginationQuery;

    const where = and(
      eq(postVotes.postId, postId),
      eq(postVotes.workspaceId, workspaceId),
    );

    const [rawData, [{ total }]] = await Promise.all([
      this.db
        .select({
          votedAt: postVotes.createdAt,
          internalUser: {
            id: users.id,
            fullName: users.fullName,
            avatarUrl: users.avatarUrl,
          },
          externalUser: {
            id: externalUsers.id,
            fullName: externalUsers.fullName,
            avatarUrl: externalUsers.avatarUrl,
          },
        })
        .from(postVotes)
        .leftJoin(users, eq(users.id, postVotes.userId))
        .leftJoin(externalUsers, eq(externalUsers.id, postVotes.externalUserId))
        .where(where)
        .orderBy(postVotes.createdAt)
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(postVotes).where(where),
    ]);

    const data: PostVoter[] = rawData
      .filter((row) => row.internalUser?.id || row.externalUser?.id)
      .map((row) => {
        if (row.externalUser?.id) {
          return {
            id: row.externalUser.id,
            fullName: row.externalUser.fullName ?? null,
            avatarUrl: row.externalUser.avatarUrl ?? null,
            votedAt: row.votedAt,
            isExternal: true,
          };
        }

        if (row.internalUser?.id) {
          return {
            id: row.internalUser.id,
            fullName: row.internalUser.fullName ?? null,
            avatarUrl: row.internalUser.avatarUrl ?? null,
            votedAt: row.votedAt,
            isExternal: false,
          };
        }

        throw new Error('No valid user found for vote');
      });

    return { data, pagination: buildPagination(page, limit, total) };
  }

  async toggleVote(
    postId: string,
    userId: string,
    workspaceId: string,
  ): Promise<{ voted: boolean; votesCount: number }> {
    return this.executeToggleVote(postId, workspaceId, { userId });
  }

  async toggleVoteSdk(
    postId: string,
    externalUserId: string,
    workspaceId: string,
  ): Promise<{ voted: boolean; votesCount: number }> {
    return this.executeToggleVote(postId, workspaceId, { externalUserId });
  }

  private async executeToggleVote(
    postId: string,
    workspaceId: string,
    voter: { userId?: string; externalUserId?: string },
  ): Promise<{ voted: boolean; votesCount: number }> {
    const userCondition = voter.userId
      ? eq(postVotes.userId, voter.userId)
      : eq(postVotes.externalUserId, voter.externalUserId as string);

    const existing = await this.db.query.postVotes.findFirst({
      where: and(
        eq(postVotes.postId, postId),
        eq(postVotes.workspaceId, workspaceId),
        userCondition,
      ),
    });

    if (existing) {
      await this.db.delete(postVotes).where(eq(postVotes.id, existing.id));
      const [post] = await this.db
        .update(posts)
        .set({ votesCount: sql`${posts.votesCount} - 1` })
        .where(eq(posts.id, postId))
        .returning({ votesCount: posts.votesCount });

      return { voted: false, votesCount: post.votesCount };
    }

    await this.db.insert(postVotes).values({
      postId,
      workspaceId,
      userId: voter.userId ?? null,
      externalUserId: voter.externalUserId ?? null,
    });

    const [post] = await this.db
      .update(posts)
      .set({ votesCount: sql`${posts.votesCount} + 1` })
      .where(eq(posts.id, postId))
      .returning({ votesCount: posts.votesCount });

    return { voted: true, votesCount: post.votesCount };
  }
}
