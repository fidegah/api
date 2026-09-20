import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';

import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequireRole } from '../common/decorators/require-role.decorator';
import { WorkspaceRoleGuard } from '../common/guards/workspace-role.guard';
import { CreateRoadmapDto } from './dto/create-roadmap.dto';
import { UpdateRoadmapDto } from './dto/update-roadmap.dto';
import { RoadmapsService } from './roadmaps.service';

@Controller({
  path: 'workspaces/:workspaceId/roadmaps',
  version: VERSION_NEUTRAL,
})
@UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
export class RoadmapsController {
  constructor(private readonly roadmapsService: RoadmapsService) {}

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() createRoadmapDto: CreateRoadmapDto,
  ) {
    return this.roadmapsService.create(workspaceId, userId, createRoadmapDto);
  }

  @Get()
  findAll(@Param('workspaceId', ParseUUIDPipe) workspaceId: string) {
    return this.roadmapsService.findAllByWorkspace(workspaceId);
  }

  @Patch(':roadmapId')
  @RequireRole('owner', 'admin')
  update(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('roadmapId', ParseUUIDPipe) roadmapId: string,
    @Body() updateRoadmapDto: UpdateRoadmapDto,
  ) {
    return this.roadmapsService.update(
      roadmapId,
      workspaceId,
      updateRoadmapDto,
    );
  }

  @Delete(':roadmapId')
  @RequireRole('owner', 'admin')
  remove(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('roadmapId', ParseUUIDPipe) roadmapId: string,
  ) {
    return this.roadmapsService.remove(roadmapId, workspaceId);
  }
}
