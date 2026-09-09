import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  and,
  arrayOverlaps,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
} from 'drizzle-orm';

import { DATABASE, type DrizzleDB } from '../db/database.provider';
import { changelogs, changelogLikes, users } from '../db/schema';
import { CreateChangelogDto } from './dto/create-changelog.dto';
import { UpdateChangelogDto } from './dto/update-changelog.dto';
import { buildPagination } from '../common/utils/build-pagination.util';
import { PaginatedResult } from '../common/types/pagination.type';
import { ChangelogWithLikeStatus } from './types/changelog-with-like-status.type';
import { ChangelogWithCreator } from './types/changelog-with-creator.type';
import { QueryChangelogsDto } from './dto/query-changelogs.dto';

@Injectable()
export class ChangelogsService {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  private readonly baseSelect = {
    id: changelogs.id,
    workspaceId: changelogs.workspaceId,
    userId: changelogs.userId,
    title: changelogs.title,
    content: changelogs.content,
    tagIds: changelogs.tagIds,
    likesCount: changelogs.likesCount,
    viewsCount: changelogs.viewsCount,
    createdAt: changelogs.createdAt,
    creator: {
      id: users.id,
      fullName: users.fullName,
      avatarUrl: users.avatarUrl,
    },
  };

  async create(
    workspaceId: string,
    userId: string,
    createChangelogDto: CreateChangelogDto,
  ): Promise<ChangelogWithCreator> {
    const [changelog] = await this.db
      .insert(changelogs)
      .values({
        workspaceId,
        userId,
        title: createChangelogDto.title,
        content: createChangelogDto.content,
        tagIds: createChangelogDto.tagIds ?? [],
      })
      .returning();

    return this.findOne(changelog.id, workspaceId);
  }

  async findAll(
    workspaceId: string,
    userId: string | null,
    query: QueryChangelogsDto,
  ): Promise<PaginatedResult<ChangelogWithLikeStatus>> {
    const { page, limit, offset, search, tagId } = query;

    const conditions = [eq(changelogs.workspaceId, workspaceId)];

    if (search) {
      conditions.push(
        or(
          ilike(changelogs.title, `%${search}%`),
          ilike(changelogs.content, `%${search}%`),
        )!,
      );
    }

    if (tagId && tagId.length > 0) {
      conditions.push(arrayOverlaps(changelogs.tagIds, tagId));
    }

    const where = and(...conditions);

    const [rows, [{ total }]] = await Promise.all([
      this.db
        .select(this.baseSelect)
        .from(changelogs)
        .innerJoin(users, eq(users.id, changelogs.userId))
        .where(where)
        .orderBy(desc(changelogs.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(changelogs).where(where),
    ]);

    const data = await this.attachLikeStatus(rows, userId);

    return {
      data,
      pagination: buildPagination(page, limit, total),
    };
  }

  async findOne(
    id: string,
    workspaceId: string,
  ): Promise<ChangelogWithCreator> {
    const [row] = await this.db
      .select(this.baseSelect)
      .from(changelogs)
      .innerJoin(users, eq(users.id, changelogs.userId))
      .where(
        and(eq(changelogs.id, id), eq(changelogs.workspaceId, workspaceId)),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException('Changelog not found in this workspace');
    }

    return row;
  }

  async findOneAndIncrementViews(
    id: string,
    workspaceId: string,
    userId: string | null,
  ): Promise<ChangelogWithLikeStatus> {
    await this.findOne(id, workspaceId);

    await this.db
      .update(changelogs)
      .set({ viewsCount: sql`${changelogs.viewsCount} + 1` })
      .where(
        and(eq(changelogs.id, id), eq(changelogs.workspaceId, workspaceId)),
      );

    const updated = await this.findOne(id, workspaceId);
    const [withLikeStatus] = await this.attachLikeStatus([updated], userId);
    return withLikeStatus;
  }

  async update(
    id: string,
    workspaceId: string,
    updateChangelogDto: UpdateChangelogDto,
  ): Promise<ChangelogWithCreator> {
    await this.findOne(id, workspaceId);

    await this.db
      .update(changelogs)
      .set(updateChangelogDto)
      .where(
        and(eq(changelogs.id, id), eq(changelogs.workspaceId, workspaceId)),
      );

    return this.findOne(id, workspaceId);
  }

  async remove(id: string, workspaceId: string): Promise<{ message: string }> {
    await this.findOne(id, workspaceId);

    await this.db
      .delete(changelogs)
      .where(
        and(eq(changelogs.id, id), eq(changelogs.workspaceId, workspaceId)),
      );

    return { message: 'Changelog deleted successfully' };
  }

  private async attachLikeStatus(
    items: ChangelogWithCreator[],
    userId: string | null,
  ): Promise<ChangelogWithLikeStatus[]> {
    if (!userId || items.length === 0) {
      return items.map((item) => ({ ...item, isLiked: false }));
    }

    const ids = items.map((item) => item.id);

    const likes = await this.db
      .select({ changelogId: changelogLikes.changelogId })
      .from(changelogLikes)
      .where(
        and(
          inArray(changelogLikes.changelogId, ids),
          eq(changelogLikes.userId, userId),
        ),
      );

    const likedIds = new Set(likes.map((l) => l.changelogId));

    return items.map((item) => ({
      ...item,
      isLiked: likedIds.has(item.id),
    }));
  }
}
