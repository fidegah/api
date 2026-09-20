import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';

import { DATABASE, type DrizzleDB } from '../db/database.provider';
import { boards, postCategories, PostCategory } from '../db/schema';
import { CreatePostCategoryDto } from './dto/create-post-category.dto';
import { UpdatePostCategoryDto } from './dto/update-post-category.dto';
import { QueryPostCategoriesDto } from './dto/query-post-categories.dto';

@Injectable()
export class PostCategoriesService {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  // Workspace

  async create(
    workspaceId: string,
    userId: string,
    createPostCategoryDto: CreatePostCategoryDto,
  ): Promise<PostCategory> {
    const [category] = await this.db
      .insert(postCategories)
      .values({
        workspaceId,
        userId,
        ...createPostCategoryDto,
      })
      .returning();

    return category;
  }

  async findOne(id: string, workspaceId: string): Promise<PostCategory> {
    const category = await this.db.query.postCategories.findFirst({
      where: and(
        eq(postCategories.id, id),
        eq(postCategories.workspaceId, workspaceId),
      ),
    });

    if (!category) {
      throw new NotFoundException('Category not found in this workspace');
    }

    return category;
  }

  async update(
    id: string,
    workspaceId: string,
    updatePostCategoryDto: UpdatePostCategoryDto,
  ): Promise<PostCategory> {
    await this.findOne(id, workspaceId);

    const [updated] = await this.db
      .update(postCategories)
      .set(updatePostCategoryDto)
      .where(
        and(
          eq(postCategories.id, id),
          eq(postCategories.workspaceId, workspaceId),
        ),
      )
      .returning();

    return updated;
  }

  async remove(id: string, workspaceId: string): Promise<{ message: string }> {
    await this.findOne(id, workspaceId);

    await this.db
      .delete(postCategories)
      .where(
        and(
          eq(postCategories.id, id),
          eq(postCategories.workspaceId, workspaceId),
        ),
      );

    return { message: 'Category deleted successfully' };
  }

  // Portal

  async findAllPublicByWorkspace(
    workspaceId: string,
    query: QueryPostCategoriesDto,
  ): Promise<PostCategory[]> {
    const publicBoards = await this.db.query.boards.findMany({
      where: and(
        eq(boards.workspaceId, workspaceId),
        eq(boards.isPrivate, false),
      ),
      columns: { id: true },
    });

    const publicBoardIds = publicBoards.map((b) => b.id);
    if (publicBoardIds.length === 0) return [];

    const targetIds = query.boardId
      ? publicBoardIds.filter((id) => id === query.boardId)
      : publicBoardIds;

    if (targetIds.length === 0) return [];

    return this.db.query.postCategories.findMany({
      where: and(
        eq(postCategories.workspaceId, workspaceId),
        inArray(postCategories.boardId, targetIds),
      ),
    });
  }

  async findOnePublic(id: string, workspaceId: string): Promise<PostCategory> {
    const category = await this.findOne(id, workspaceId);

    const board = await this.db.query.boards.findFirst({
      where: and(
        eq(boards.id, category.boardId),
        eq(boards.workspaceId, workspaceId),
        eq(boards.isPrivate, false),
      ),
    });

    if (!board) {
      throw new NotFoundException('Category not found in this workspace');
    }

    return category;
  }
}
