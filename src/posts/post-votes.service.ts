import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, eq, isNotNull, or, sql } from 'drizzle-orm';

import { DATABASE, type DrizzleDB } from '../db/database.provider';
import { boards, externalUsers, postVotes, posts, users } from '../db/schema';
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

  // Workspace

  async findVotersByPost(
    postId: string,
    workspaceId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResult<PostVoter>> {
    const { page, limit, offset } = paginationQuery;

    const where = and(
      eq(postVotes.postId, postId),
      eq(postVotes.workspaceId, workspaceId),
      or(isNotNull(postVotes.userId), isNotNull(postVotes.externalUserId)),
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

    const data: PostVoter[] = rawData.map((row) =>
      row.externalUser?.id
        ? {
            id: row.externalUser.id,
            fullName: row.externalUser.fullName ?? null,
            avatarUrl: row.externalUser.avatarUrl ?? null,
            votedAt: row.votedAt,
            isExternal: true,
          }
        : {
            id: row.internalUser!.id,
            fullName: row.internalUser!.fullName ?? null,
            avatarUrl: row.internalUser!.avatarUrl ?? null,
            votedAt: row.votedAt,
            isExternal: false,
          },
    );

    return { data, pagination: buildPagination(page, limit, total) };
  }

  async toggleVote(
    postId: string,
    userId: string,
    workspaceId: string,
  ): Promise<{ voted: boolean; votesCount: number }> {
    await this.assertPost(postId, workspaceId, false);
    return this.executeToggleVote(postId, workspaceId, { userId });
  }

  // SDK

  async findVotersByPostSdk(
    postId: string,
    workspaceId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResult<PostVoter>> {
    await this.assertPost(postId, workspaceId, true);
    return this.findVotersByPost(postId, workspaceId, paginationQuery);
  }

  async toggleVoteSdk(
    postId: string,
    externalUserId: string,
    workspaceId: string,
  ): Promise<{ voted: boolean; votesCount: number }> {
    await this.assertPost(postId, workspaceId, true);
    return this.executeToggleVote(postId, workspaceId, { externalUserId });
  }

  // Private helpers

  private async assertPost(
    postId: string,
    workspaceId: string,
    requirePublicBoard: boolean,
  ): Promise<void> {
    const post = await this.db.query.posts.findFirst({
      where: and(eq(posts.id, postId), eq(posts.workspaceId, workspaceId)),
      columns: { boardId: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found in this workspace');
    }

    if (!requirePublicBoard) return;

    const board = await this.db.query.boards.findFirst({
      where: and(
        eq(boards.id, post.boardId),
        eq(boards.workspaceId, workspaceId),
        eq(boards.isPrivate, false),
      ),
    });

    if (!board) {
      throw new NotFoundException('Post not found in this workspace');
    }
  }

  private async executeToggleVote(
    postId: string,
    workspaceId: string,
    voter: { userId?: string; externalUserId?: string },
  ): Promise<{ voted: boolean; votesCount: number }> {
    return this.db.transaction(async (tx) => {
      const userCondition = voter.userId
        ? eq(postVotes.userId, voter.userId)
        : eq(postVotes.externalUserId, voter.externalUserId as string);

      const existing = await tx.query.postVotes.findFirst({
        where: and(
          eq(postVotes.postId, postId),
          eq(postVotes.workspaceId, workspaceId),
          userCondition,
        ),
      });

      if (existing) {
        await tx.delete(postVotes).where(eq(postVotes.id, existing.id));

        const [post] = await tx
          .update(posts)
          .set({
            votesCount: sql`GREATEST(${posts.votesCount} - 1, 0)`,
            lastInteractionAt: new Date(),
          })
          .where(and(eq(posts.id, postId), eq(posts.workspaceId, workspaceId)))
          .returning({ votesCount: posts.votesCount });

        return { voted: false, votesCount: post.votesCount };
      }

      await tx.insert(postVotes).values({
        postId,
        workspaceId,
        userId: voter.userId ?? null,
        externalUserId: voter.externalUserId ?? null,
      });

      const [post] = await tx
        .update(posts)
        .set({
          votesCount: sql`${posts.votesCount} + 1`,
          lastInteractionAt: new Date(),
        })
        .where(and(eq(posts.id, postId), eq(posts.workspaceId, workspaceId)))
        .returning({ votesCount: posts.votesCount });

      return { voted: true, votesCount: post.votesCount };
    });
  }
}
