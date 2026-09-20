import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, count, eq, inArray, isNull, sql } from 'drizzle-orm';

import { DATABASE, type DrizzleDB } from '../db/database.provider';
import {
  boards,
  commentLikes,
  externalUsers,
  PostComment,
  postComments,
  posts,
  users,
} from '../db/schema';
import { CreatePostCommentDto } from './dto/create-post-comment.dto';
import { UpdatePostCommentDto } from './dto/update-post-comment.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { buildPagination } from '../common/utils/build-pagination.util';
import { PaginatedResult } from '../common/types/pagination.type';
import { SpamCheckService } from '../ai/spam-check.service';
import { CommentSummaryService } from '../ai/comment-summary.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CommentWithDetails,
  CommentCreator,
} from './types/comment-with-details.type';

@Injectable()
export class PostCommentsService {
  constructor(
    @Inject(DATABASE) private readonly db: DrizzleDB,
    private readonly spamCheckService: SpamCheckService,
    private readonly commentSummaryService: CommentSummaryService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Workspace

  async create(
    postId: string,
    workspaceId: string,
    userId: string,
    createPostCommentDto: CreatePostCommentDto,
  ): Promise<PostComment> {
    return this.internalCreate(
      postId,
      workspaceId,
      createPostCommentDto,
      userId,
      null,
    );
  }

  async findAllByPost(
    postId: string,
    workspaceId: string,
    userId: string | null,
    paginationQuery: PaginationQueryDto,
    externalUserId: string | null = null,
  ): Promise<PaginatedResult<CommentWithDetails>> {
    const { page, limit, offset } = paginationQuery;

    const where = and(
      eq(postComments.postId, postId),
      eq(postComments.workspaceId, workspaceId),
      isNull(postComments.parentId),
    );

    const [rawData, [{ total }]] = await Promise.all([
      this.db.query.postComments.findMany({
        where,
        orderBy: (comments, { desc, asc }) => [
          desc(comments.isPinned),
          asc(comments.createdAt),
        ],
        limit,
        offset,
      }),
      this.db.select({ total: count() }).from(postComments).where(where),
    ]);

    const finalData = await this.enrichComments(
      rawData,
      userId,
      externalUserId,
    );

    return { data: finalData, pagination: buildPagination(page, limit, total) };
  }

  async findReplies(
    commentId: string,
    workspaceId: string,
    userId: string | null,
    paginationQuery: PaginationQueryDto,
    externalUserId: string | null = null,
  ): Promise<PaginatedResult<CommentWithDetails>> {
    const { page, limit, offset } = paginationQuery;

    const where = and(
      eq(postComments.parentId, commentId),
      eq(postComments.workspaceId, workspaceId),
    );

    const [rawData, [{ total }]] = await Promise.all([
      this.db.query.postComments.findMany({
        where,
        orderBy: (comments, { asc }) => [asc(comments.createdAt)],
        limit,
        offset,
      }),
      this.db.select({ total: count() }).from(postComments).where(where),
    ]);

    const finalData = await this.enrichComments(
      rawData,
      userId,
      externalUserId,
    );

    return { data: finalData, pagination: buildPagination(page, limit, total) };
  }

  async findOne(id: string, workspaceId: string): Promise<PostComment> {
    const comment = await this.db.query.postComments.findFirst({
      where: and(
        eq(postComments.id, id),
        eq(postComments.workspaceId, workspaceId),
      ),
    });

    if (!comment) {
      throw new NotFoundException('Comment not found in this workspace');
    }

    return comment;
  }

  async update(
    id: string,
    workspaceId: string,
    userId: string,
    updatePostCommentDto: UpdatePostCommentDto,
  ): Promise<PostComment> {
    const comment = await this.findOne(id, workspaceId);

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comment');
    }

    const [updated] = await this.db
      .update(postComments)
      .set({ content: updatePostCommentDto.content, updatedAt: new Date() })
      .where(
        and(eq(postComments.id, id), eq(postComments.workspaceId, workspaceId)),
      )
      .returning();

    return updated;
  }

  async remove(id: string, workspaceId: string): Promise<{ message: string }> {
    return this.internalRemove(id, workspaceId);
  }

  async togglePin(id: string, workspaceId: string): Promise<PostComment> {
    const comment = await this.findOne(id, workspaceId);

    const [updated] = await this.db
      .update(postComments)
      .set({ isPinned: !comment.isPinned })
      .where(
        and(eq(postComments.id, id), eq(postComments.workspaceId, workspaceId)),
      )
      .returning();

    return updated;
  }

  async toggleSpam(id: string, workspaceId: string): Promise<PostComment> {
    return this.db.transaction(async (tx) => {
      const comment = await this.findOne(id, workspaceId);
      const nextIsSpam = !comment.isSpam;
      const delta = nextIsSpam ? -1 : 1;

      const [updated] = await tx
        .update(postComments)
        .set({ isSpam: nextIsSpam })
        .where(
          and(
            eq(postComments.id, id),
            eq(postComments.workspaceId, workspaceId),
          ),
        )
        .returning();

      await tx
        .update(posts)
        .set({
          commentsCount: sql`GREATEST(${posts.commentsCount} + ${delta}, 0)`,
        })
        .where(eq(posts.id, comment.postId));

      if (comment.parentId) {
        await tx
          .update(postComments)
          .set({
            repliesCount: sql`GREATEST(${postComments.repliesCount} + ${delta}, 0)`,
          })
          .where(eq(postComments.id, comment.parentId));
      }

      return updated;
    });
  }

  async summarizeComments(
    postId: string,
    workspaceId: string,
  ): Promise<string> {
    const baseWhere = and(
      eq(postComments.postId, postId),
      eq(postComments.workspaceId, workspaceId),
      eq(postComments.isSpam, false),
    );

    let comments = await this.db
      .select({ content: postComments.content })
      .from(postComments)
      .where(and(baseWhere, sql`char_length(${postComments.content}) >= 15`))
      .orderBy(
        sql`${postComments.isPinned} DESC`,
        sql`(${postComments.likesCount} * 2 + ${postComments.repliesCount} * 1.5) DESC`,
        sql`${postComments.createdAt} DESC`,
      )
      .limit(50);

    if (comments.length === 0) {
      comments = await this.db
        .select({ content: postComments.content })
        .from(postComments)
        .where(baseWhere)
        .orderBy(
          sql`${postComments.isPinned} DESC`,
          sql`(${postComments.likesCount} * 2 + ${postComments.repliesCount} * 1.5) DESC`,
          sql`${postComments.createdAt} DESC`,
        )
        .limit(50);
    }

    if (comments.length === 0) {
      return '';
    }

    return this.commentSummaryService.summarize(comments);
  }

  // Portal

  async removePortalComment(
    id: string,
    workspaceId: string,
    userId: string | null,
  ): Promise<{ message: string }> {
    if (!userId) {
      throw new ForbiddenException('You can only delete your own comment');
    }

    const comment = await this.findOne(id, workspaceId);

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comment');
    }

    return this.internalRemove(id, workspaceId);
  }

  // SDK

  async createSdk(
    postId: string,
    workspaceId: string,
    externalUserId: string,
    createPostCommentDto: CreatePostCommentDto,
  ): Promise<PostComment> {
    await this.assertPostIsPublic(postId, workspaceId);

    return this.internalCreate(
      postId,
      workspaceId,
      createPostCommentDto,
      null,
      externalUserId,
    );
  }

  async findAllByPostSdk(
    postId: string,
    workspaceId: string,
    paginationQuery: PaginationQueryDto,
    externalUserId: string | null,
  ): Promise<PaginatedResult<CommentWithDetails>> {
    await this.assertPostIsPublic(postId, workspaceId);

    const { page, limit, offset } = paginationQuery;

    const where = and(
      eq(postComments.postId, postId),
      eq(postComments.workspaceId, workspaceId),
      isNull(postComments.parentId),
      eq(postComments.isSpam, false),
    );

    const [rawData, [{ total }]] = await Promise.all([
      this.db.query.postComments.findMany({
        where,
        orderBy: (c, { desc, asc }) => [desc(c.isPinned), asc(c.createdAt)],
        limit,
        offset,
      }),
      this.db.select({ total: count() }).from(postComments).where(where),
    ]);

    const finalData = await this.enrichComments(rawData, null, externalUserId);
    return { data: finalData, pagination: buildPagination(page, limit, total) };
  }

  async findRepliesSdk(
    commentId: string,
    workspaceId: string,
    paginationQuery: PaginationQueryDto,
    externalUserId: string | null,
  ): Promise<PaginatedResult<CommentWithDetails>> {
    const parent = await this.findOne(commentId, workspaceId);
    await this.assertPostIsPublic(parent.postId, workspaceId);

    const { page, limit, offset } = paginationQuery;

    const where = and(
      eq(postComments.parentId, commentId),
      eq(postComments.workspaceId, workspaceId),
      eq(postComments.isSpam, false),
    );

    const [rawData, [{ total }]] = await Promise.all([
      this.db.query.postComments.findMany({
        where,
        orderBy: (c, { asc }) => [asc(c.createdAt)],
        limit,
        offset,
      }),
      this.db.select({ total: count() }).from(postComments).where(where),
    ]);

    const finalData = await this.enrichComments(rawData, null, externalUserId);
    return { data: finalData, pagination: buildPagination(page, limit, total) };
  }

  async updateSdk(
    id: string,
    workspaceId: string,
    externalUserId: string,
    updatePostCommentDto: UpdatePostCommentDto,
  ): Promise<PostComment> {
    const comment = await this.findOne(id, workspaceId);
    await this.assertPostIsPublic(comment.postId, workspaceId);

    if (!comment.externalUserId || comment.externalUserId !== externalUserId) {
      throw new ForbiddenException('You can only edit your own comment');
    }

    const [updated] = await this.db
      .update(postComments)
      .set({ content: updatePostCommentDto.content, updatedAt: new Date() })
      .where(
        and(eq(postComments.id, id), eq(postComments.workspaceId, workspaceId)),
      )
      .returning();

    return updated;
  }

  async removeSdk(
    id: string,
    workspaceId: string,
    externalUserId: string,
  ): Promise<{ message: string }> {
    const comment = await this.findOne(id, workspaceId);
    await this.assertPostIsPublic(comment.postId, workspaceId);

    if (!comment.externalUserId || comment.externalUserId !== externalUserId) {
      throw new ForbiddenException('You can only delete your own comment');
    }

    return this.internalRemove(id, workspaceId);
  }

  // Private helpers

  private async enrichComments(
    comments: PostComment[],
    userId: string | null,
    externalUserId: string | null = null,
  ): Promise<CommentWithDetails[]> {
    if (comments.length === 0) return [];

    const commentIds = comments.map((c) => c.id);

    const userIds = [
      ...new Set(
        comments.map((c) => c.userId).filter((id): id is string => id !== null),
      ),
    ];

    const externalUserIds = [
      ...new Set(
        comments
          .map((c) => c.externalUserId)
          .filter((id): id is string => id !== null),
      ),
    ];

    let likesPromise: Promise<{ commentId: string }[]> = Promise.resolve([]);

    if (userId) {
      likesPromise = this.db.query.commentLikes.findMany({
        where: and(
          inArray(commentLikes.commentId, commentIds),
          eq(commentLikes.userId, userId),
        ),
        columns: { commentId: true },
      });
    } else if (externalUserId) {
      likesPromise = this.db.query.commentLikes.findMany({
        where: and(
          inArray(commentLikes.commentId, commentIds),
          eq(commentLikes.externalUserId, externalUserId),
        ),
        columns: { commentId: true },
      });
    }

    const creatorsPromise: Promise<CommentCreator[]> =
      userIds.length > 0
        ? this.db
            .select({
              id: users.id,
              fullName: users.fullName,
              avatarUrl: users.avatarUrl,
            })
            .from(users)
            .where(inArray(users.id, userIds))
        : Promise.resolve([]);

    const externalCreatorsPromise: Promise<CommentCreator[]> =
      externalUserIds.length > 0
        ? this.db
            .select({
              id: externalUsers.id,
              fullName: externalUsers.fullName,
              avatarUrl: externalUsers.avatarUrl,
            })
            .from(externalUsers)
            .where(inArray(externalUsers.id, externalUserIds))
        : Promise.resolve([]);

    const [likes, creators, externalCreators] = await Promise.all([
      likesPromise,
      creatorsPromise,
      externalCreatorsPromise,
    ]);

    const likedIds = new Set(likes.map((l) => l.commentId));

    const creatorMap = new Map<string, CommentCreator>(
      creators.map((c) => [c.id, c] as [string, CommentCreator]),
    );

    const externalCreatorMap = new Map<string, CommentCreator>(
      externalCreators
        .filter((c) => !!c.fullName)
        .map((c) => [c.id, c] as [string, CommentCreator]),
    );

    return comments.map((comment) => ({
      ...comment,
      isLiked: likedIds.has(comment.id),
      creator: comment.userId
        ? (creatorMap.get(comment.userId) ?? null)
        : comment.externalUserId
          ? (externalCreatorMap.get(comment.externalUserId) ?? null)
          : null,
    }));
  }

  private async assertPostIsPublic(
    postId: string,
    workspaceId: string,
  ): Promise<void> {
    const post = await this.db.query.posts.findFirst({
      where: and(eq(posts.id, postId), eq(posts.workspaceId, workspaceId)),
      columns: { boardId: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found in this workspace');
    }

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

  private async internalCreate(
    postId: string,
    workspaceId: string,
    dto: CreatePostCommentDto,
    userId: string | null,
    externalUserId: string | null,
  ): Promise<PostComment> {
    if (dto.parentId) {
      const parent = await this.db.query.postComments.findFirst({
        where: and(
          eq(postComments.id, dto.parentId),
          eq(postComments.postId, postId),
        ),
      });

      if (!parent) {
        throw new NotFoundException('Parent comment not found in this post');
      }
    }

    const isSpam = await this.spamCheckService.isSpam(dto.content);

    const [comment] = await this.db
      .insert(postComments)
      .values({
        content: dto.content,
        parentId: dto.parentId ?? null,
        postId,
        workspaceId,
        userId,
        externalUserId,
        isSpam,
      })
      .returning();

    if (!isSpam) {
      await this.db
        .update(posts)
        .set({
          commentsCount: sql`${posts.commentsCount} + 1`,
          lastInteractionAt: new Date(),
        })
        .where(eq(posts.id, postId));
    } else {
      await this.db
        .update(posts)
        .set({ lastInteractionAt: new Date() })
        .where(eq(posts.id, postId));
    }

    if (dto.parentId && !isSpam) {
      await this.db
        .update(postComments)
        .set({ repliesCount: sql`${postComments.repliesCount} + 1` })
        .where(eq(postComments.id, dto.parentId));
    }

    if (userId) {
      await this.notifyOnNewComment(postId, workspaceId, userId, dto);
    }

    return comment;
  }

  private async notifyOnNewComment(
    postId: string,
    workspaceId: string,
    commenterId: string,
    dto: CreatePostCommentDto,
  ): Promise<void> {
    const post = await this.db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });

    if (post && post.userId && post.userId !== commenterId) {
      await this.notificationsService.create({
        workspaceId,
        userId: post.userId,
        title: 'دیدگاه جدیدی روی پست شما ثبت شد',
        description: dto.content.slice(0, 100),
      });
    }

    if (dto.parentId) {
      const parentComment = await this.db.query.postComments.findFirst({
        where: eq(postComments.id, dto.parentId),
      });

      if (
        parentComment &&
        parentComment.userId &&
        parentComment.userId !== commenterId
      ) {
        await this.notificationsService.create({
          workspaceId,
          userId: parentComment.userId,
          title: 'پاسخ جدیدی به دیدگاه شما ارسال شد',
          description: dto.content.slice(0, 100),
        });
      }
    }
  }

  private async internalRemove(
    id: string,
    workspaceId: string,
  ): Promise<{ message: string }> {
    const comment = await this.findOne(id, workspaceId);

    return this.db.transaction(async (tx) => {
      const result = await tx.execute(sql`
        WITH RECURSIVE tree AS (
          SELECT id, is_spam FROM post_comments WHERE id = ${id}
          UNION ALL
          SELECT c.id, c.is_spam
          FROM post_comments c
          JOIN tree t ON c.parent_id = t.id
        )
        SELECT
          COUNT(*) FILTER (WHERE is_spam = false)::int AS visible,
          array_agg(id) AS ids
        FROM tree
      `);

      const row = (
        result as unknown as { rows: { visible: number; ids: string[] }[] }
      ).rows[0];

      await tx.delete(postComments).where(inArray(postComments.id, row.ids));

      await tx
        .update(posts)
        .set({
          commentsCount: sql`GREATEST(${posts.commentsCount} - ${row.visible}, 0)`,
        })
        .where(eq(posts.id, comment.postId));

      if (comment.parentId && !comment.isSpam) {
        await tx
          .update(postComments)
          .set({
            repliesCount: sql`GREATEST(${postComments.repliesCount} - 1, 0)`,
          })
          .where(eq(postComments.id, comment.parentId));
      }

      return { message: 'Comment deleted successfully' };
    });
  }
}
