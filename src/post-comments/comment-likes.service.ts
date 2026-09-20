import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';

import { DATABASE, type DrizzleDB } from '../db/database.provider';
import { boards, commentLikes, postComments, posts } from '../db/schema';

@Injectable()
export class CommentLikesService {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  // Workspace

  async toggleLike(
    commentId: string,
    workspaceId: string,
    userId: string,
  ): Promise<{ liked: boolean; likesCount: number }> {
    await this.assertComment(commentId, workspaceId, false);
    return this.internalToggle(commentId, workspaceId, userId, null);
  }

  // SDK

  async toggleLikeSdk(
    commentId: string,
    workspaceId: string,
    externalUserId: string,
  ): Promise<{ liked: boolean; likesCount: number }> {
    await this.assertComment(commentId, workspaceId, true);
    return this.internalToggle(commentId, workspaceId, null, externalUserId);
  }

  // Private helpers

  private async assertComment(
    commentId: string,
    workspaceId: string,
    requirePublicBoard: boolean,
  ): Promise<void> {
    const comment = await this.db.query.postComments.findFirst({
      where: and(
        eq(postComments.id, commentId),
        eq(postComments.workspaceId, workspaceId),
      ),
      columns: { postId: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found in this workspace');
    }

    if (!requirePublicBoard) return;

    const post = await this.db.query.posts.findFirst({
      where: and(
        eq(posts.id, comment.postId),
        eq(posts.workspaceId, workspaceId),
      ),
      columns: { boardId: true },
    });

    if (!post) {
      throw new NotFoundException('Comment not found in this workspace');
    }

    const board = await this.db.query.boards.findFirst({
      where: and(
        eq(boards.id, post.boardId),
        eq(boards.workspaceId, workspaceId),
        eq(boards.isPrivate, false),
      ),
    });

    if (!board) {
      throw new NotFoundException('Comment not found in this workspace');
    }
  }

  private async internalToggle(
    commentId: string,
    workspaceId: string,
    userId: string | null,
    externalUserId: string | null,
  ): Promise<{ liked: boolean; likesCount: number }> {
    return this.db.transaction(async (tx) => {
      const whereCondition = userId
        ? and(
            eq(commentLikes.commentId, commentId),
            eq(commentLikes.userId, userId),
          )
        : and(
            eq(commentLikes.commentId, commentId),
            eq(commentLikes.externalUserId, externalUserId!),
          );

      const existing = await tx.query.commentLikes.findFirst({
        where: whereCondition,
      });

      const scope = and(
        eq(postComments.id, commentId),
        eq(postComments.workspaceId, workspaceId),
      );

      if (existing) {
        await tx.delete(commentLikes).where(eq(commentLikes.id, existing.id));

        const [comment] = await tx
          .update(postComments)
          .set({ likesCount: sql`GREATEST(${postComments.likesCount} - 1, 0)` })
          .where(scope)
          .returning({ likesCount: postComments.likesCount });

        return { liked: false, likesCount: comment.likesCount };
      }

      await tx.insert(commentLikes).values({
        commentId,
        userId,
        externalUserId,
      });

      const [comment] = await tx
        .update(postComments)
        .set({ likesCount: sql`${postComments.likesCount} + 1` })
        .where(scope)
        .returning({ likesCount: postComments.likesCount });

      return { liked: true, likesCount: comment.likesCount };
    });
  }
}
