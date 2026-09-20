import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, eq, gte, ilike, inArray, lt, sql } from 'drizzle-orm';

import { DATABASE, type DrizzleDB } from '../db/database.provider';
import {
  boards,
  Post,
  postCategories,
  posts,
  postStatuses,
  postTags,
  postVotes,
  users,
} from '../db/schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostActivityStatus, QueryPostsDto } from './dto/query-posts.dto';
import {
  PostWithVoteStatus,
  PostCreator,
} from './types/post-with-vote-status.type';
import { PaginatedResult } from '../common/types/pagination.type';
import { buildPagination } from '../common/utils/build-pagination.util';
import { NotificationsService } from '../notifications/notifications.service';

const ACTIVITY_WINDOW_DAYS = 30;

@Injectable()
export class PostsService {
  constructor(
    @Inject(DATABASE) private readonly db: DrizzleDB,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Workspace

  async create(
    workspaceId: string,
    userId: string,
    createPostDto: CreatePostDto,
  ): Promise<Post> {
    const statusId =
      createPostDto.statusId ?? (await this.resolveDefaultStatusId());

    const [newPost] = await this.db
      .insert(posts)
      .values({
        ...createPostDto,
        workspaceId,
        userId,
        statusId,
      })
      .returning();

    return newPost;
  }

  async findAll(
    workspaceId: string,
    userId: string | null,
    query: QueryPostsDto,
    externalUserId: string | null = null,
  ): Promise<PaginatedResult<PostWithVoteStatus>> {
    const { page, limit, offset } = query;

    const conditions = [eq(posts.workspaceId, workspaceId)];

    if (query.search) {
      conditions.push(ilike(posts.title, `%${query.search}%`));
    }

    if (query.statusId && query.statusId.length > 0) {
      conditions.push(inArray(posts.statusId, query.statusId));
    }

    if (query.statusValue && query.statusValue.length > 0) {
      const matchedStatuses = await this.db.query.postStatuses.findMany({
        where: inArray(postStatuses.value, query.statusValue),
        columns: { id: true },
      });

      const statusIds = matchedStatuses.map((s) => s.id);

      if (statusIds.length === 0) {
        return { data: [], pagination: buildPagination(page, limit, 0) };
      }

      conditions.push(inArray(posts.statusId, statusIds));
    }

    if (query.status) {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - ACTIVITY_WINDOW_DAYS);

      const referenceDate = sql`COALESCE(${posts.lastInteractionAt}, ${posts.createdAt})`;

      if (query.status === PostActivityStatus.ACTIVE) {
        conditions.push(gte(referenceDate, threshold));
      } else {
        conditions.push(lt(referenceDate, threshold));
      }
    }

    let postIds: string[] | null = null;

    if (query.tagId && query.tagId.length > 0) {
      const tagged = await this.db.query.postTags.findMany({
        where: and(
          eq(postTags.workspaceId, workspaceId),
          inArray(postTags.tagId, query.tagId),
        ),
        columns: { postId: true },
      });

      postIds = tagged.map((t) => t.postId);

      if (postIds.length === 0) {
        return { data: [], pagination: buildPagination(page, limit, 0) };
      }
    }

    if (postIds) {
      conditions.push(inArray(posts.id, postIds));
    }

    const where = and(...conditions);

    const [result, [{ total }]] = await Promise.all([
      this.db.query.posts.findMany({
        where,
        orderBy: (posts, { desc }) => [desc(posts.createdAt)],
        limit,
        offset,
      }),
      this.db.select({ total: count() }).from(posts).where(where),
    ]);

    const data = await this.enrichPosts(result, userId, externalUserId);
    return { data, pagination: buildPagination(page, limit, total) };
  }

  async findOne(
    id: string,
    workspaceId: string,
    userId: string | null,
    externalUserId: string | null = null,
  ): Promise<PostWithVoteStatus> {
    const post = await this.db.query.posts.findFirst({
      where: and(eq(posts.id, id), eq(posts.workspaceId, workspaceId)),
    });

    if (!post) {
      throw new NotFoundException('Post not found in this workspace');
    }

    const [enriched] = await this.enrichPosts([post], userId, externalUserId);
    return enriched;
  }

  async update(
    id: string,
    workspaceId: string,
    updatePostDto: UpdatePostDto,
  ): Promise<Post> {
    const existingPost = await this.db.query.posts.findFirst({
      where: and(eq(posts.id, id), eq(posts.workspaceId, workspaceId)),
    });

    if (!existingPost) {
      throw new NotFoundException('Post not found in this workspace');
    }

    const [updated] = await this.db
      .update(posts)
      .set({ ...updatePostDto, updatedAt: new Date() })
      .where(and(eq(posts.id, id), eq(posts.workspaceId, workspaceId)))
      .returning();

    if (
      updatePostDto.statusId &&
      updatePostDto.statusId !== existingPost.statusId
    ) {
      await this.notifyOnStatusChange(
        workspaceId,
        updated,
        updatePostDto.statusId,
      );
    }

    return updated;
  }

  async remove(id: string, workspaceId: string): Promise<{ message: string }> {
    const existing = await this.db.query.posts.findFirst({
      where: and(eq(posts.id, id), eq(posts.workspaceId, workspaceId)),
    });

    if (!existing) {
      throw new NotFoundException('Post not found in this workspace');
    }

    await this.db
      .delete(posts)
      .where(and(eq(posts.id, id), eq(posts.workspaceId, workspaceId)));

    return { message: 'Post deleted successfully' };
  }

  // Portal

  async findAllPublic(
    workspaceId: string,
    userId: string | null,
    query: QueryPostsDto,
  ): Promise<PaginatedResult<PostWithVoteStatus>> {
    const publicBoards = await this.db.query.boards.findMany({
      where: and(
        eq(boards.workspaceId, workspaceId),
        eq(boards.isPrivate, false),
      ),
      columns: { id: true },
    });

    const publicBoardIds = publicBoards.map((b) => b.id);

    if (publicBoardIds.length === 0) {
      return {
        data: [],
        pagination: buildPagination(query.page, query.limit, 0),
      };
    }

    const targetBoardIds =
      query.boardId && query.boardId.length > 0
        ? query.boardId.filter((id) => publicBoardIds.includes(id))
        : publicBoardIds;

    if (targetBoardIds.length === 0) {
      return {
        data: [],
        pagination: buildPagination(query.page, query.limit, 0),
      };
    }

    return this.findAll(workspaceId, userId, {
      ...query,
      boardId: targetBoardIds,
      offset: query.offset,
    });
  }

  async findOnePublic(
    id: string,
    workspaceId: string,
    userId: string | null,
  ): Promise<PostWithVoteStatus> {
    const post = await this.findOne(id, workspaceId, userId);

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

    return post;
  }

  // SDK

  async createSdk(
    workspaceId: string,
    externalUserId: string,
    createPostDto: CreatePostDto,
  ): Promise<Post> {
    await this.assertPublicBoard(createPostDto.boardId, workspaceId);

    if (createPostDto.categoryId) {
      const category = await this.db.query.postCategories.findFirst({
        where: and(
          eq(postCategories.id, createPostDto.categoryId),
          eq(postCategories.workspaceId, workspaceId),
          eq(postCategories.boardId, createPostDto.boardId),
        ),
      });

      if (!category) {
        throw new NotFoundException('Category not found in this board');
      }
    }

    const statusId = await this.resolveDefaultStatusId();

    const [newPost] = await this.db
      .insert(posts)
      .values({
        title: createPostDto.title,
        description: createPostDto.description,
        boardId: createPostDto.boardId,
        categoryId: createPostDto.categoryId ?? null,
        workspaceId,
        externalUserId,
        statusId,
        visibility: 'public',
        lastInteractionAt: new Date(),
      })
      .returning();

    return newPost;
  }

  async findAllSdkPublic(
    workspaceId: string,
    externalUserId: string | null,
    query: QueryPostsDto,
  ): Promise<PaginatedResult<PostWithVoteStatus>> {
    const publicBoards = await this.db.query.boards.findMany({
      where: and(
        eq(boards.workspaceId, workspaceId),
        eq(boards.isPrivate, false),
      ),
      columns: { id: true },
    });

    const publicBoardIds = publicBoards.map((b) => b.id);

    if (publicBoardIds.length === 0) {
      return {
        data: [],
        pagination: buildPagination(query.page, query.limit, 0),
      };
    }

    const targetBoardIds =
      query.boardId && query.boardId.length > 0
        ? query.boardId.filter((id) => publicBoardIds.includes(id))
        : publicBoardIds;

    if (targetBoardIds.length === 0) {
      return {
        data: [],
        pagination: buildPagination(query.page, query.limit, 0),
      };
    }

    return this.findAll(
      workspaceId,
      null,
      {
        ...query,
        boardId: targetBoardIds,
        offset: query.offset,
      },
      externalUserId,
    );
  }

  async findOneSdkPublic(
    id: string,
    workspaceId: string,
    externalUserId: string | null,
  ): Promise<PostWithVoteStatus> {
    const post = await this.findOne(id, workspaceId, null, externalUserId);
    await this.assertPublicBoard(post.boardId, workspaceId);
    return post;
  }

  // Private helpers

  private async enrichPosts(
    postsList: Post[],
    userId: string | null,
    externalUserId: string | null = null,
  ): Promise<PostWithVoteStatus[]> {
    if (postsList.length === 0) return [];

    const postIds = postsList.map((p) => p.id);

    const userIds = [
      ...new Set(
        postsList
          .map((p) => p.userId)
          .filter((id): id is string => id !== null),
      ),
    ];

    let votesPromise: Promise<{ postId: string }[]> = Promise.resolve([]);

    if (userId) {
      votesPromise = this.db.query.postVotes.findMany({
        where: and(
          inArray(postVotes.postId, postIds),
          eq(postVotes.userId, userId),
        ),
        columns: { postId: true },
      });
    } else if (externalUserId) {
      votesPromise = this.db.query.postVotes.findMany({
        where: and(
          inArray(postVotes.postId, postIds),
          eq(postVotes.externalUserId, externalUserId),
        ),
        columns: { postId: true },
      });
    }

    const creatorsPromise: Promise<PostCreator[]> =
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

    const [votes, creators] = await Promise.all([
      votesPromise,
      creatorsPromise,
    ]);

    const votedIds = new Set(votes.map((v) => v.postId));

    const creatorMap = new Map<string, PostCreator>(
      creators.map((c) => [c.id, c] as [string, PostCreator]),
    );

    return postsList.map((post) => ({
      ...post,
      isVoted: votedIds.has(post.id),
      creator: post.userId ? (creatorMap.get(post.userId) ?? null) : null,
    }));
  }

  private async assertPublicBoard(
    boardId: string,
    workspaceId: string,
  ): Promise<void> {
    const board = await this.db.query.boards.findFirst({
      where: and(
        eq(boards.id, boardId),
        eq(boards.workspaceId, workspaceId),
        eq(boards.isPrivate, false),
      ),
    });

    if (!board) {
      throw new NotFoundException('Board not found in this workspace');
    }
  }

  private async resolveDefaultStatusId(): Promise<string> {
    const defaultStatus = await this.db.query.postStatuses.findFirst({
      where: and(eq(postStatuses.value, 'open')),
    });

    if (!defaultStatus) {
      throw new NotFoundException('Default post status (open) not found');
    }

    return defaultStatus.id;
  }

  private async notifyOnStatusChange(
    workspaceId: string,
    post: Post,
    newStatusId: string,
  ): Promise<void> {
    if (!post.userId) return;

    const newStatus = await this.db.query.postStatuses.findFirst({
      where: eq(postStatuses.id, newStatusId),
    });

    if (!newStatus) return;

    await this.notificationsService.create({
      workspaceId,
      userId: post.userId,
      title: 'وضعیت پست شما به‌روزرسانی شد',
      description: `وضعیت پست «${post.title}» به «${newStatus.label}» تغییر کرد.`,
    });
  }
}
