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

import { ChangelogsService } from './changelogs.service';
import { ChangelogLikesService } from './changelog-likes.service';
import { CreateChangelogDto } from './dto/create-changelog.dto';
import { UpdateChangelogDto } from './dto/update-changelog.dto';
import { QueryChangelogsDto } from './dto/query-changelogs.dto';
import { ChangelogTagsService } from './changelog-tags.service';

@Controller({
  path: 'workspaces/:workspaceId/changelogs',
  version: VERSION_NEUTRAL,
})
@UseGuards(JwtAuthGuard)
export class ChangelogsController {
  constructor(
    private readonly changelogsService: ChangelogsService,
    private readonly changelogLikesService: ChangelogLikesService,
    private readonly changelogTagsService: ChangelogTagsService,
  ) {}

  @Get('tags')
  async getTags() {
    return this.changelogTagsService.findAll();
  }

  @Post()
  @UseGuards(WorkspaceRoleGuard)
  async create(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() createChangelogDto: CreateChangelogDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;

    return this.changelogsService.create(
      workspaceId,
      user.id,
      createChangelogDto,
    );
  }

  @Get()
  @UseGuards(WorkspaceRoleGuard)
  async findAll(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() query: QueryChangelogsDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;

    return this.changelogsService.findAll(workspaceId, user.id, query);
  }

  @Get(':id')
  @UseGuards(WorkspaceRoleGuard)
  async findOne(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;

    return this.changelogsService.findOneAndIncrementViews(
      id,
      workspaceId,
      user.id,
    );
  }

  @Patch(':id')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  async update(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateChangelogDto: UpdateChangelogDto,
  ) {
    return this.changelogsService.update(id, workspaceId, updateChangelogDto);
  }

  @Delete(':id')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  async remove(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.changelogsService.remove(id, workspaceId);
  }

  @Post(':id/like')
  @UseGuards(WorkspaceRoleGuard)
  async toggleLike(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;

    return this.changelogLikesService.toggleLike(id, user.id);
  }
}
