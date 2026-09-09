import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DATABASE, type DrizzleDB } from '../db/database.provider';
import { Roadmap, roadmaps } from '../db/schema';
import { CreateRoadmapDto } from './dto/create-roadmap.dto';
import { UpdateRoadmapDto } from './dto/update-roadmap.dto';
import { MAX_ROADMAPS_PER_WORKSPACE } from './constants/roadmap-limits.constant';

@Injectable()
export class RoadmapsService {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  async create(
    workspaceId: string,
    userId: string,
    createRoadmapDto: CreateRoadmapDto,
  ): Promise<Roadmap> {
    const existing = await this.db.query.roadmaps.findMany({
      where: eq(roadmaps.workspaceId, workspaceId),
    });

    if (existing.length >= MAX_ROADMAPS_PER_WORKSPACE) {
      throw new ForbiddenException('Roadmap limit reached');
    }

    const [roadmap] = await this.db
      .insert(roadmaps)
      .values({ workspaceId, userId, name: createRoadmapDto.name })
      .returning();

    return roadmap;
  }

  findAllByWorkspace(workspaceId: string): Promise<Roadmap[]> {
    return this.db.query.roadmaps.findMany({
      where: eq(roadmaps.workspaceId, workspaceId),
      orderBy: (roadmaps, { desc }) => [desc(roadmaps.createdAt)],
    });
  }

  async findOne(id: string, workspaceId: string): Promise<Roadmap> {
    const roadmap = await this.db.query.roadmaps.findFirst({
      where: and(eq(roadmaps.id, id), eq(roadmaps.workspaceId, workspaceId)),
    });

    if (!roadmap) {
      throw new NotFoundException('Roadmap not found in this workspace');
    }

    return roadmap;
  }

  async update(
    id: string,
    workspaceId: string,
    updateRoadmapDto: UpdateRoadmapDto,
  ): Promise<Roadmap> {
    await this.findOne(id, workspaceId);

    const [updated] = await this.db
      .update(roadmaps)
      .set(updateRoadmapDto)
      .where(and(eq(roadmaps.id, id), eq(roadmaps.workspaceId, workspaceId)))
      .returning();

    return updated;
  }

  async remove(id: string, workspaceId: string): Promise<{ message: string }> {
    await this.findOne(id, workspaceId);

    await this.db.delete(roadmaps).where(eq(roadmaps.id, id));

    return { message: 'Roadmap deleted successfully' };
  }
}
