import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';

import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../users/types/auth-user.type';
import { WorkspaceRoleGuard } from '../common/guards/workspace-role.guard';
import { RequireRole } from '../common/decorators/require-role.decorator';

import { RoadmapsService } from './roadmaps.service';
import { CreateRoadmapDto } from './dto/create-roadmap.dto';
import { UpdateRoadmapDto } from './dto/update-roadmap.dto';

@Controller({
  path: 'workspaces/:workspaceId/roadmaps',
  version: VERSION_NEUTRAL,
})
@UseGuards(JwtAuthGuard)
export class RoadmapsController {
  constructor(private readonly roadmapsService: RoadmapsService) {}

  @Post()
  @UseGuards(WorkspaceRoleGuard)
  async create(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() createRoadmapDto: CreateRoadmapDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;

    return this.roadmapsService.create(workspaceId, user.id, createRoadmapDto);
  }

  @Get()
  @UseGuards(WorkspaceRoleGuard)
  async findAll(@Param('workspaceId', ParseUUIDPipe) workspaceId: string) {
    return this.roadmapsService.findAllByWorkspace(workspaceId);
  }

  @Patch(':roadmapId')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  async update(
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
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  async remove(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('roadmapId', ParseUUIDPipe) roadmapId: string,
  ) {
    return this.roadmapsService.remove(roadmapId, workspaceId);
  }
}
