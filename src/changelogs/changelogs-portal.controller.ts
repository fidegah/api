import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { ChangelogsService } from './changelogs.service';
import { ChangelogTagsService } from './changelog-tags.service';
import { QueryChangelogsDto } from './dto/query-changelogs.dto';
import { PortalWorkspaceGuard } from '../portal/guards/portal-workspace.guard';
import { CurrentPortalWorkspace } from '../portal/decorators/portal-data.decorator';
import {
  CurrentPortalUser,
  OptionalPortalUser,
} from '../portal/decorators/portal-user.decorator';
import type { Workspace } from '../db/schema';
import { ChangelogLikesService } from './changelog-likes.service';
import { PortalJwtAuthGuard } from '../portal/guards/portal-jwt-auth.guard';
import { RequirePortalAuth } from '../portal/decorators/require-portal-auth.decorator';

@Controller({ path: 'portal/changelogs', version: VERSION_NEUTRAL })
@UseGuards(PortalWorkspaceGuard, PortalJwtAuthGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class ChangelogsPortalController {
  constructor(
    private readonly changelogsService: ChangelogsService,
    private readonly changelogLikesService: ChangelogLikesService,
    private readonly changelogTagsService: ChangelogTagsService,
  ) {}

  @Get('tags')
  getTags() {
    return this.changelogTagsService.findAll();
  }

  @Get()
  findAll(
    @CurrentPortalWorkspace() workspace: Workspace,
    @OptionalPortalUser() userId: string | null,
    @Query() query: QueryChangelogsDto,
  ) {
    return this.changelogsService.findAll(workspace.id, userId, query);
  }

  @Get(':id')
  findOne(
    @CurrentPortalWorkspace() workspace: Workspace,
    @OptionalPortalUser() userId: string | null,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.changelogsService.findOneAndIncrementViews(
      id,
      workspace.id,
      userId,
    );
  }

  @Post(':id/like')
  @RequirePortalAuth()
  toggleLike(
    @CurrentPortalUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.changelogLikesService.toggleLike(id, userId);
  }
}
