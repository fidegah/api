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

import type { Workspace } from '../db/schema';
import { CurrentSdkWorkspace } from '../sdk/decorators/sdk-workspace.decorator';
import { SdkExternalUserId } from '../sdk/decorators/sdk-external-user.decorator';
import { SdkWorkspaceGuard } from '../sdk/guards/sdk-workspace.guard';
import { SdkSessionGuard } from '../sdk/guards/sdk-session.guard';
import { PostsService } from './posts.service';
import { PostVotesService } from './post-votes.service';
import { PostTagsService } from './post-tags.service';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { OptionalSdkSessionGuard } from '../sdk/guards/optional-sdk.session.guard';

@Controller({ path: 'sdk/posts', version: VERSION_NEUTRAL })
@UseGuards(SdkWorkspaceGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class PostsSdkController {
  constructor(
    private readonly postsService: PostsService,
    private readonly postVotesService: PostVotesService,
    private readonly postTagsService: PostTagsService,
  ) {}

  @Post()
  @UseGuards(SdkSessionGuard)
  create(
    @CurrentSdkWorkspace() workspace: Workspace,
    @SdkExternalUserId() externalUserId: string,
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postsService.createSdk(
      workspace.id,
      externalUserId,
      createPostDto,
    );
  }

  @Post(':id/vote')
  @UseGuards(SdkSessionGuard)
  toggleVote(
    @CurrentSdkWorkspace() workspace: Workspace,
    @SdkExternalUserId() externalUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postVotesService.toggleVoteSdk(
      id,
      externalUserId,
      workspace.id,
    );
  }

  @Get()
  @UseGuards(OptionalSdkSessionGuard)
  findAll(
    @CurrentSdkWorkspace() workspace: Workspace,
    @SdkExternalUserId() externalUserId: string | null,
    @Query() query: QueryPostsDto,
  ) {
    return this.postsService.findAllSdkPublic(
      workspace.id,
      externalUserId,
      query,
    );
  }

  @Get(':id/tags')
  async findTags(
    @CurrentSdkWorkspace() workspace: Workspace,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.postsService.findOneSdkPublic(id, workspace.id, null);
    return this.postTagsService.findTagsByPost(id, workspace.id);
  }

  @Get(':id/voters')
  @UseGuards(OptionalSdkSessionGuard)
  findVoters(
    @CurrentSdkWorkspace() workspace: Workspace,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.postVotesService.findVotersByPostSdk(
      id,
      workspace.id,
      paginationQuery,
    );
  }

  @Get(':id')
  @UseGuards(OptionalSdkSessionGuard)
  findOne(
    @CurrentSdkWorkspace() workspace: Workspace,
    @SdkExternalUserId() externalUserId: string | null,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postsService.findOneSdkPublic(id, workspace.id, externalUserId);
  }
}
