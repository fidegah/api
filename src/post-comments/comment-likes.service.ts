import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';

import { DATABASE, type DrizzleDB } from '../db/database.provider';
import { commentLikes, postComments } from '../db/schema';

@Injectable()
export class CommentLikesService {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  async toggleLike(
    commentId: string,
    userId: string,
  ): Promise<{ liked: boolean; likesCount: number }> {
    return this.internalToggle(commentId, userId, null);
  }

  async toggleLikeSdk(
    commentId: string,
    externalUserId: string,
  ): Promise<{ liked: boolean; likesCount: number }> {
    return this.internalToggle(commentId, null, externalUserId);
  }

  private async internalToggle(
    commentId: string,
    userId: string | null,
    externalUserId: string | null,
  ): Promise<{ liked: boolean; likesCount: number }> {
    const whereCondition = userId
      ? and(
          eq(commentLikes.commentId, commentId),
          eq(commentLikes.userId, userId),
        )
      : and(
          eq(commentLikes.commentId, commentId),
          eq(commentLikes.externalUserId, externalUserId!),
        );

    const existing = await this.db.query.commentLikes.findFirst({
      where: whereCondition,
    });

    if (existing) {
      await this.db
        .delete(commentLikes)
        .where(eq(commentLikes.id, existing.id));

      const [comment] = await this.db
        .update(postComments)
        .set({ likesCount: sql`${postComments.likesCount} - 1` })
        .where(eq(postComments.id, commentId))
        .returning({ likesCount: postComments.likesCount });

      return { liked: false, likesCount: comment.likesCount };
    }

    await this.db.insert(commentLikes).values({
      commentId,
      userId,
      externalUserId,
    });

    const [comment] = await this.db
      .update(postComments)
      .set({ likesCount: sql`${postComments.likesCount} + 1` })
      .where(eq(postComments.id, commentId))
      .returning({ likesCount: postComments.likesCount });

    return { liked: true, likesCount: comment.likesCount };
  }
}
