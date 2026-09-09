import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceRoleGuard } from '../common/guards/workspace-role.guard';
import { RequireRole } from '../common/decorators/require-role.decorator';

import { RoadmapItemsService } from './roadmap-items.service';
import { CreateRoadmapItemDto } from './dto/create-roadmap-item.dto';
import { UpdateRoadmapItemDto } from './dto/update-roadmap-item.dto';

@Controller({
  path: 'workspaces/:workspaceId',
  version: VERSION_NEUTRAL,
})
@UseGuards(JwtAuthGuard)
export class RoadmapItemsController {
  constructor(private readonly roadmapItemsService: RoadmapItemsService) {}

  @Get('roadmaps/:roadmapId/items')
  @UseGuards(WorkspaceRoleGuard)
  async findAll(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('roadmapId', ParseUUIDPipe) roadmapId: string,
    @Query('search') search: string | undefined,
    @Query('boardId') boardId: string | undefined,
    @Query('postStatusId') postStatusId: string | undefined,
  ) {
    return this.roadmapItemsService.findAllByRoadmap(roadmapId, workspaceId, {
      search,
      boardIds: boardId?.split(','),
      statusIds: postStatusId?.split(','),
    });
  }

  @Post('roadmaps/:roadmapId/items')
  @UseGuards(WorkspaceRoleGuard)
  async create(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('roadmapId', ParseUUIDPipe) roadmapId: string,
    @Body() createRoadmapItemDto: CreateRoadmapItemDto,
  ) {
    return this.roadmapItemsService.create(
      roadmapId,
      workspaceId,
      createRoadmapItemDto,
    );
  }

  @Patch('roadmap-items/:itemId')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  async update(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() updateRoadmapItemDto: UpdateRoadmapItemDto,
  ) {
    return this.roadmapItemsService.update(
      itemId,
      workspaceId,
      updateRoadmapItemDto,
    );
  }

  @Delete('roadmap-items/:itemId')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  async remove(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.roadmapItemsService.remove(itemId, workspaceId);
  }
}
