import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DATABASE, type DrizzleDB } from '../db/database.provider';
import {
  RoadmapCustomFactor,
  roadmapCustomFactors,
  roadmaps,
} from '../db/schema';
import {
  CreateRoadmapFactorDto,
  FactorSource,
} from './dto/create-roadmap-factor.dto';
import { UpdateRoadmapFactorDto } from './dto/update-roadmap-factor.dto';
import { RoadmapsService } from './roadmaps.service';

@Injectable()
export class RoadmapFactorsService {
  constructor(
    @Inject(DATABASE) private readonly db: DrizzleDB,
    private readonly roadmapsService: RoadmapsService,
  ) {}

  async create(
    roadmapId: string,
    workspaceId: string,
    createRoadmapFactorDto: CreateRoadmapFactorDto,
  ): Promise<RoadmapCustomFactor> {
    await this.roadmapsService.findOne(roadmapId, workspaceId);

    if (
      createRoadmapFactorDto.source === FactorSource.CUSTOM &&
      !createRoadmapFactorDto.type
    ) {
      throw new BadRequestException('type is required for custom factors');
    }

    if (
      createRoadmapFactorDto.source === FactorSource.BUILT_IN &&
      !createRoadmapFactorDto.metric
    ) {
      throw new BadRequestException('metric is required for built-in factors');
    }

    const [factor] = await this.db
      .insert(roadmapCustomFactors)
      .values({
        roadmapId,
        name: createRoadmapFactorDto.name,
        type:
          createRoadmapFactorDto.source === FactorSource.CUSTOM
            ? createRoadmapFactorDto.type
            : null,
        metric:
          createRoadmapFactorDto.source === FactorSource.BUILT_IN
            ? createRoadmapFactorDto.metric
            : null,
        source: createRoadmapFactorDto.source,
        weight: createRoadmapFactorDto.weight,
        isEffort: createRoadmapFactorDto.isEffort,
      })
      .returning();

    return factor;
  }

  async findAllByRoadmap(roadmapId: string): Promise<RoadmapCustomFactor[]> {
    return this.db.query.roadmapCustomFactors.findMany({
      where: eq(roadmapCustomFactors.roadmapId, roadmapId),
    });
  }

  private async findFactorInWorkspace(
    factorId: string,
    workspaceId: string,
  ): Promise<RoadmapCustomFactor> {
    const result = await this.db
      .select({ factor: roadmapCustomFactors })
      .from(roadmapCustomFactors)
      .innerJoin(roadmaps, eq(roadmaps.id, roadmapCustomFactors.roadmapId))
      .where(
        and(
          eq(roadmapCustomFactors.id, factorId),
          eq(roadmaps.workspaceId, workspaceId),
        ),
      )
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundException('Factor not found in this workspace');
    }

    return result[0].factor;
  }

  async update(
    factorId: string,
    workspaceId: string,
    updateRoadmapFactorDto: UpdateRoadmapFactorDto,
  ): Promise<RoadmapCustomFactor> {
    await this.findFactorInWorkspace(factorId, workspaceId);

    const [updated] = await this.db
      .update(roadmapCustomFactors)
      .set(updateRoadmapFactorDto)
      .where(eq(roadmapCustomFactors.id, factorId))
      .returning();

    return updated;
  }

  async remove(
    factorId: string,
    workspaceId: string,
  ): Promise<{ message: string }> {
    await this.findFactorInWorkspace(factorId, workspaceId);

    await this.db
      .delete(roadmapCustomFactors)
      .where(eq(roadmapCustomFactors.id, factorId));

    return { message: 'Impact factor deleted successfully' };
  }
}
