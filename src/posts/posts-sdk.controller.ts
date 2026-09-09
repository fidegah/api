import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import type { Workspace } from '../db/schema';
import { CurrentSdkWorkspace } from '../sdk/decorators/sdk-workspace.decorator';
import { SdkExternalUserId } from '../sdk/decorators/sdk-external-user.decorator';
import { SdkGuard } from '../sdk/guards/sdk.guard';

import { PostsService } from './posts.service';
import { PostVotesService } from './post-votes.service';
import { PostTagsService } from './post-tags.service';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Controller({ path: 'sdk/posts', version: VERSION_NEUTRAL })
@UseGuards(SdkGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class PostsSdkController {
  constructor(
    private readonly postsService: PostsService,
    private readonly postVotesService: PostVotesService,
    private readonly postTagsService: PostTagsService,
  ) {}

  @Post()
  create(
    @CurrentSdkWorkspace() workspace: Workspace,
    @SdkExternalUserId() externalUserId: string | null,
    @Body() createPostDto: CreatePostDto,
  ) {
    if (!externalUserId) {
      throw new UnauthorizedException(
        'Session ID is required to create a post',
      );
    }
    return this.postsService.createSdk(
      workspace.id,
      externalUserId,
      createPostDto,
    );
  }

  @Get()
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

  @Get(':id')
  findOne(
    @CurrentSdkWorkspace() workspace: Workspace,
    @SdkExternalUserId() externalUserId: string | null,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postsService.findOne(id, workspace.id, null, externalUserId);
  }

  @Post(':id/vote')
  toggleVote(
    @CurrentSdkWorkspace() workspace: Workspace,
    @SdkExternalUserId() externalUserId: string | null,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    if (!externalUserId) {
      throw new UnauthorizedException('Session ID is required to vote');
    }
    return this.postVotesService.toggleVoteSdk(
      id,
      externalUserId,
      workspace.id,
    );
  }

  @Get(':id/voters')
  findVoters(
    @CurrentSdkWorkspace() workspace: Workspace,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.postVotesService.findVotersByPost(
      id,
      workspace.id,
      paginationQuery,
    );
  }

  @Get(':id/tags')
  findTags(
    @CurrentSdkWorkspace() workspace: Workspace,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postTagsService.findTagsByPost(id, workspace.id);
  }
}
