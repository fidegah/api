import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';

import { DATABASE, type DrizzleDB } from '../db/database.provider';
import {
  boards,
  posts,
  roadmapCustomFactorValues,
  roadmapCustomFactors,
  roadmapItems,
  roadmaps,
  RoadmapItem,
} from '../db/schema';
import { CreateRoadmapItemDto } from './dto/create-roadmap-item.dto';
import { UpdateRoadmapItemDto } from './dto/update-roadmap-item.dto';
import { RoadmapsService } from './roadmaps.service';
import { validateFactorValue } from './utils/validate-factor-value.util';
import {
  calculateRoadmapItemScore,
  CalculatedRoadmapItem,
} from './utils/calculate-roadmap-score.util';

@Injectable()
export class RoadmapItemsService {
  constructor(
    @Inject(DATABASE) private readonly db: DrizzleDB,
    private readonly roadmapsService: RoadmapsService,
  ) {}

  async findAllByRoadmap(
    roadmapId: string,
    workspaceId: string,
    filters: { search?: string; boardIds?: string[]; statusIds?: string[] },
  ): Promise<{
    items: CalculatedRoadmapItem[];
    columns: (typeof roadmapCustomFactors.$inferSelect)[];
  }> {
    await this.roadmapsService.findOne(roadmapId, workspaceId);

    const factors = await this.db.query.roadmapCustomFactors.findMany({
      where: eq(roadmapCustomFactors.roadmapId, roadmapId),
    });

    const conditions = [eq(roadmapItems.roadmapId, roadmapId)];

    const items = await this.db
      .select({
        item: roadmapItems,
        post: posts,
        boardTitle: boards.title,
      })
      .from(roadmapItems)
      .innerJoin(posts, eq(posts.id, roadmapItems.postId))
      .innerJoin(boards, eq(boards.id, posts.boardId))
      .where(and(...conditions));

    let filtered = items;

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter((row) =>
        row.post.title.toLowerCase().includes(search),
      );
    }

    if (filters.boardIds && filters.boardIds.length > 0) {
      filtered = filtered.filter((row) =>
        filters.boardIds!.includes(row.post.boardId),
      );
    }

    if (filters.statusIds && filters.statusIds.length > 0) {
      filtered = filtered.filter(
        (row) =>
          row.post.statusId && filters.statusIds!.includes(row.post.statusId),
      );
    }

    const itemIds = filtered.map((row) => row.item.id);

    const customValues =
      itemIds.length > 0
        ? await this.db.query.roadmapCustomFactorValues.findMany({
            where: inArray(roadmapCustomFactorValues.roadmapItemId, itemIds),
          })
        : [];

    const calculatedItems = filtered.map((row) => {
      const itemValues = customValues.filter(
        (v) => v.roadmapItemId === row.item.id,
      );
      return calculateRoadmapItemScore(
        row.item,
        { ...row.post, boardTitle: row.boardTitle },
        factors,
        itemValues,
      );
    });

    calculatedItems.sort((a, b) => b.score - a.score);

    return { items: calculatedItems, columns: factors };
  }

  async create(
    roadmapId: string,
    workspaceId: string,
    createRoadmapItemDto: CreateRoadmapItemDto,
  ): Promise<CalculatedRoadmapItem> {
    await this.roadmapsService.findOne(roadmapId, workspaceId);

    const post = await this.db.query.posts.findFirst({
      where: and(
        eq(posts.id, createRoadmapItemDto.postId),
        eq(posts.workspaceId, workspaceId),
      ),
    });

    if (!post) {
      throw new NotFoundException('Post not found in this workspace');
    }

    const [item] = await this.db
      .insert(roadmapItems)
      .values({ roadmapId, postId: createRoadmapItemDto.postId })
      .returning();

    return this.fetchAndCalculateOne(item.id, roadmapId);
  }

  async update(
    itemId: string,
    workspaceId: string,
    updateRoadmapItemDto: UpdateRoadmapItemDto,
  ): Promise<CalculatedRoadmapItem> {
    const item = await this.findItemInWorkspace(itemId, workspaceId);

    if (updateRoadmapItemDto.eta !== undefined) {
      await this.db
        .update(roadmapItems)
        .set({
          eta: updateRoadmapItemDto.eta,
        })
        .where(eq(roadmapItems.id, itemId));
    }

    if (
      updateRoadmapItemDto.factorId !== undefined &&
      updateRoadmapItemDto.factorValue !== undefined
    ) {
      const factor = await this.db.query.roadmapCustomFactors.findFirst({
        where: eq(roadmapCustomFactors.id, updateRoadmapItemDto.factorId),
      });

      if (!factor) {
        throw new NotFoundException('Factor not found');
      }

      if (factor.source === 'built_in') {
        throw new BadRequestException(
          'Cannot manually set a value for a built-in factor',
        );
      }

      const validationError = validateFactorValue(
        factor.type!,
        updateRoadmapItemDto.factorValue,
      );
      if (validationError) {
        throw new BadRequestException(validationError);
      }

      await this.db
        .insert(roadmapCustomFactorValues)
        .values({
          roadmapItemId: itemId,
          factorId: updateRoadmapItemDto.factorId,
          value: updateRoadmapItemDto.factorValue,
        })
        .onConflictDoUpdate({
          target: [
            roadmapCustomFactorValues.roadmapItemId,
            roadmapCustomFactorValues.factorId,
          ],
          set: { value: updateRoadmapItemDto.factorValue },
        });
    }

    return this.fetchAndCalculateOne(itemId, item.roadmapId);
  }

  async remove(
    itemId: string,
    workspaceId: string,
  ): Promise<{ message: string }> {
    await this.findItemInWorkspace(itemId, workspaceId);

    await this.db.delete(roadmapItems).where(eq(roadmapItems.id, itemId));

    return { message: 'Roadmap item deleted successfully' };
  }

  private async findItemInWorkspace(
    itemId: string,
    workspaceId: string,
  ): Promise<RoadmapItem> {
    const result = await this.db
      .select({ item: roadmapItems })
      .from(roadmapItems)
      .innerJoin(roadmaps, eq(roadmaps.id, roadmapItems.roadmapId))
      .where(
        and(eq(roadmapItems.id, itemId), eq(roadmaps.workspaceId, workspaceId)),
      )
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundException('Roadmap item not found in this workspace');
    }

    return result[0].item;
  }

  private async fetchAndCalculateOne(
    itemId: string,
    roadmapId: string,
  ): Promise<CalculatedRoadmapItem> {
    const [row] = await this.db
      .select({ item: roadmapItems, post: posts, boardTitle: boards.title })
      .from(roadmapItems)
      .innerJoin(posts, eq(posts.id, roadmapItems.postId))
      .innerJoin(boards, eq(boards.id, posts.boardId))
      .where(eq(roadmapItems.id, itemId))
      .limit(1);

    const factors = await this.db.query.roadmapCustomFactors.findMany({
      where: eq(roadmapCustomFactors.roadmapId, roadmapId),
    });

    const values = await this.db.query.roadmapCustomFactorValues.findMany({
      where: eq(roadmapCustomFactorValues.roadmapItemId, itemId),
    });

    return calculateRoadmapItemScore(
      row.item,
      { ...row.post, boardTitle: row.boardTitle },
      factors,
      values,
    );
  }
}
