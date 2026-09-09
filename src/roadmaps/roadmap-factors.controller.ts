import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceRoleGuard } from '../common/guards/workspace-role.guard';
import { RequireRole } from '../common/decorators/require-role.decorator';

import { RoadmapFactorsService } from './roadmap-factors.service';
import { CreateRoadmapFactorDto } from './dto/create-roadmap-factor.dto';
import { UpdateRoadmapFactorDto } from './dto/update-roadmap-factor.dto';

@Controller({
  path: 'workspaces/:workspaceId',
  version: VERSION_NEUTRAL,
})
@UseGuards(JwtAuthGuard)
export class RoadmapFactorsController {
  constructor(private readonly roadmapFactorsService: RoadmapFactorsService) {}

  @Post('roadmaps/:roadmapId/factors')
  @UseGuards(WorkspaceRoleGuard)
  async create(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('roadmapId', ParseUUIDPipe) roadmapId: string,
    @Body() createRoadmapFactorDto: CreateRoadmapFactorDto,
  ) {
    return this.roadmapFactorsService.create(
      roadmapId,
      workspaceId,
      createRoadmapFactorDto,
    );
  }

  @Patch('roadmap-factors/:factorId')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  async update(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('factorId', ParseUUIDPipe) factorId: string,
    @Body() updateRoadmapFactorDto: UpdateRoadmapFactorDto,
  ) {
    return this.roadmapFactorsService.update(
      factorId,
      workspaceId,
      updateRoadmapFactorDto,
    );
  }

  @Delete('roadmap-factors/:factorId')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  async remove(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('factorId', ParseUUIDPipe) factorId: string,
  ) {
    return this.roadmapFactorsService.remove(factorId, workspaceId);
  }
}
