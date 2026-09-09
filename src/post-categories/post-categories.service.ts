import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DATABASE, type DrizzleDB } from '../db/database.provider';
import { postCategories, PostCategory } from '../db/schema';
import { CreatePostCategoryDto } from './dto/create-post-category.dto';
import { UpdatePostCategoryDto } from './dto/update-post-category.dto';
import { QueryPostCategoriesDto } from './dto/query-post-categories.dto';

@Injectable()
export class PostCategoriesService {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

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

  findAllByWorkspace(
    workspaceId: string,
    query: QueryPostCategoriesDto,
  ): Promise<PostCategory[]> {
    const conditions = [eq(postCategories.workspaceId, workspaceId)];

    if (query.boardId) {
      conditions.push(eq(postCategories.boardId, query.boardId));
    }

    return this.db.query.postCategories.findMany({
      where: and(...conditions),
    });
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
}
