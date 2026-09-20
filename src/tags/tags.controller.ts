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

import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequireRole } from '../common/decorators/require-role.decorator';
import { WorkspaceRoleGuard } from '../common/guards/workspace-role.guard';
import { CreateTagDto } from './dto/create-tag.dto';
import { QueryTagsDto } from './dto/query-tags.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagsService } from './tags.service';

@Controller({
  path: 'workspaces/:workspaceId/tags',
  version: VERSION_NEUTRAL,
})
@UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() createTagDto: CreateTagDto,
  ) {
    return this.tagsService.create(workspaceId, userId, createTagDto);
  }

  @Get()
  findAll(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() query: QueryTagsDto,
  ) {
    return this.tagsService.findAllByWorkspace(workspaceId, query);
  }

  @Get(':id')
  findOne(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tagsService.findOne(id, workspaceId);
  }

  @Patch(':id')
  @RequireRole('owner', 'admin')
  update(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTagDto: UpdateTagDto,
  ) {
    return this.tagsService.update(id, workspaceId, updateTagDto);
  }

  @Delete(':id')
  @RequireRole('owner', 'admin')
  remove(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tagsService.remove(id, workspaceId);
  }
}
