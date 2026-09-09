import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DATABASE, type DrizzleDB } from '../db/database.provider';
import { Tag, tags } from '../db/schema';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { QueryTagsDto } from './dto/query-tags.dto';

@Injectable()
export class TagsService {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  async create(
    workspaceId: string,
    userId: string,
    createTagDto: CreateTagDto,
  ): Promise<Tag> {
    const [tag] = await this.db
      .insert(tags)
      .values({ workspaceId, userId, ...createTagDto })
      .returning();

    return tag;
  }

  async findAllByWorkspace(
    workspaceId: string,
    query: QueryTagsDto,
  ): Promise<Tag[]> {
    const conditions = [eq(tags.workspaceId, workspaceId)];

    if (query.boardId) {
      conditions.push(eq(tags.boardId, query.boardId));
    }

    return this.db.query.tags.findMany({
      where: and(...conditions),
    });
  }

  async findOne(id: string, workspaceId: string): Promise<Tag> {
    const tag = await this.db.query.tags.findFirst({
      where: and(eq(tags.id, id), eq(tags.workspaceId, workspaceId)),
    });

    if (!tag) {
      throw new NotFoundException('Tag not found in this workspace');
    }

    return tag;
  }

  async update(
    id: string,
    workspaceId: string,
    updateTagDto: UpdateTagDto,
  ): Promise<Tag> {
    await this.findOne(id, workspaceId);

    const [updated] = await this.db
      .update(tags)
      .set(updateTagDto)
      .where(and(eq(tags.id, id), eq(tags.workspaceId, workspaceId)))
      .returning();

    return updated;
  }

  async remove(id: string, workspaceId: string): Promise<{ message: string }> {
    await this.findOne(id, workspaceId);

    await this.db
      .delete(tags)
      .where(and(eq(tags.id, id), eq(tags.workspaceId, workspaceId)));

    return { message: 'Tag deleted successfully' };
  }
}
