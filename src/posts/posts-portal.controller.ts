import {
  Body,
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

import { PostsService } from './posts.service';
import { PostVotesService } from './post-votes.service';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PortalWorkspaceGuard } from '../portal/guards/portal-workspace.guard';
import { CurrentPortalWorkspace } from '../portal/decorators/portal-data.decorator';
import {
  OptionalPortalUser,
  CurrentPortalUser,
} from '../portal/decorators/portal-user.decorator';
import type { Workspace } from '../db/schema';
import type { AuthenticatedUser } from '../users/types/auth-user.type';
import { PortalJwtAuthGuard } from '../portal/guards/portal-jwt-auth.guard';
import { RequirePortalAuth } from '../portal/decorators/require-portal-auth.decorator';

@Controller({ path: 'portal/posts', version: VERSION_NEUTRAL })
@UseGuards(PortalWorkspaceGuard, PortalJwtAuthGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class PostsPortalController {
  constructor(
    private readonly postsService: PostsService,
    private readonly postVotesService: PostVotesService,
  ) {}

  @Post()
  @RequirePortalAuth()
  create(
    @CurrentPortalWorkspace() workspace: Workspace,
    @CurrentPortalUser() user: AuthenticatedUser,
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postsService.create(workspace.id, user.id, createPostDto);
  }

  @Get()
  findAll(
    @CurrentPortalWorkspace() workspace: Workspace,
    @OptionalPortalUser() userId: string | null,
    @Query() query: QueryPostsDto,
  ) {
    return this.postsService.findAllPublic(workspace.id, userId, query);
  }

  @Get(':id')
  findOne(
    @CurrentPortalWorkspace() workspace: Workspace,
    @OptionalPortalUser() userId: string | null,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postsService.findOnePublic(id, workspace.id, userId);
  }

  @Get(':id/voters')
  findVoters(
    @CurrentPortalWorkspace() workspace: Workspace,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.postVotesService.findVotersByPost(
      id,
      workspace.id,
      paginationQuery,
    );
  }

  @Post(':id/vote')
  @RequirePortalAuth()
  toggleVote(
    @CurrentPortalWorkspace() workspace: Workspace,
    @CurrentPortalUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postVotesService.toggleVote(id, userId, workspace.id);
  }
}
