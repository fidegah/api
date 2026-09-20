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
import { ChangelogLikesService } from './changelog-likes.service';
import { ChangelogTagsService } from './changelog-tags.service';
import { ChangelogsService } from './changelogs.service';
import { CreateChangelogDto } from './dto/create-changelog.dto';
import { QueryChangelogsDto } from './dto/query-changelogs.dto';
import { UpdateChangelogDto } from './dto/update-changelog.dto';

@Controller({
  path: 'workspaces/:workspaceId/changelogs',
  version: VERSION_NEUTRAL,
})
@UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
export class ChangelogsController {
  constructor(
    private readonly changelogsService: ChangelogsService,
    private readonly changelogLikesService: ChangelogLikesService,
    private readonly changelogTagsService: ChangelogTagsService,
  ) {}

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() createChangelogDto: CreateChangelogDto,
  ) {
    return this.changelogsService.create(
      workspaceId,
      userId,
      createChangelogDto,
    );
  }

  @Get()
  findAll(
    @CurrentUserId() userId: string,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() query: QueryChangelogsDto,
  ) {
    return this.changelogsService.findAll(workspaceId, userId, query);
  }

  @Get('tags')
  getTags() {
    return this.changelogTagsService.findAll();
  }

  @Get(':id')
  findOne(
    @CurrentUserId() userId: string,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.changelogsService.findOneAndIncrementViews(
      id,
      workspaceId,
      userId,
    );
  }

  @Patch(':id')
  @RequireRole('owner', 'admin')
  update(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateChangelogDto: UpdateChangelogDto,
  ) {
    return this.changelogsService.update(id, workspaceId, updateChangelogDto);
  }

  @Delete(':id')
  @RequireRole('owner', 'admin')
  remove(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.changelogsService.remove(id, workspaceId);
  }

  @Post(':id/like')
  toggleLike(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.changelogLikesService.toggleLike(id, userId);
  }
}
