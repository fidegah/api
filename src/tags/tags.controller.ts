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
  Req,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';

import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../users/types/auth-user.type';
import { WorkspaceRoleGuard } from '../common/guards/workspace-role.guard';
import { RequireRole } from '../common/decorators/require-role.decorator';

import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { QueryTagsDto } from './dto/query-tags.dto';

@Controller({
  path: 'workspaces/:workspaceId/tags',
  version: VERSION_NEUTRAL,
})
@UseGuards(JwtAuthGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @UseGuards(WorkspaceRoleGuard)
  async create(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() createTagDto: CreateTagDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;

    return this.tagsService.create(workspaceId, user.id, createTagDto);
  }

  @Get()
  @UseGuards(WorkspaceRoleGuard)
  findAll(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() query: QueryTagsDto,
  ) {
    return this.tagsService.findAllByWorkspace(workspaceId, query);
  }

  @Get(':id')
  @UseGuards(WorkspaceRoleGuard)
  async findOne(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tagsService.findOne(id, workspaceId);
  }

  @Patch(':id')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  async update(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTagDto: UpdateTagDto,
  ) {
    return this.tagsService.update(id, workspaceId, updateTagDto);
  }

  @Delete(':id')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  async remove(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tagsService.remove(id, workspaceId);
  }
}
