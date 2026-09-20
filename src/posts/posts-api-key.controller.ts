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
} from '@nestjs/common';

import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';
import { CurrentWorkspace } from '../api-keys/decorators/current-workspace.decorator';
import { CurrentApiKeyUser } from '../api-keys/decorators/current-api-key-user.decorator';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { PostTagsService } from './post-tags.service';
import { PostVotesService } from './post-votes.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import type { Workspace } from '../db/schema';

@Controller({ path: 'posts', version: '1' })
@UseGuards(ApiKeyGuard)
export class PostsApiKeyController {
  constructor(
    private readonly postsService: PostsService,
    private readonly postTagsService: PostTagsService,
    private readonly postVotesService: PostVotesService,
  ) {}

  @Post()
  create(
    @CurrentWorkspace() workspace: Workspace,
    @CurrentApiKeyUser() userId: string,
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postsService.create(workspace.id, userId, createPostDto);
  }

  @Post(':id/tags/:tagId')
  addTag(
    @CurrentWorkspace() workspace: Workspace,
    @Param('id', ParseUUIDPipe) postId: string,
    @Param('tagId', ParseUUIDPipe) tagId: string,
  ) {
    return this.postTagsService.addTagToPost(postId, tagId, workspace.id);
  }

  @Post(':id/vote')
  toggleVote(
    @CurrentWorkspace() workspace: Workspace,
    @CurrentApiKeyUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postVotesService.toggleVote(id, userId, workspace.id);
  }

  @Get()
  findAll(
    @CurrentWorkspace() workspace: Workspace,
    @CurrentApiKeyUser() userId: string,
    @Query() query: QueryPostsDto,
  ) {
    return this.postsService.findAll(workspace.id, userId, query);
  }

  @Get(':id/voters')
  findVoters(
    @CurrentWorkspace() workspace: Workspace,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.postVotesService.findVotersByPost(
      id,
      workspace.id,
      paginationQuery,
    );
  }

  @Get(':id')
  findOne(
    @CurrentWorkspace() workspace: Workspace,
    @CurrentApiKeyUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postsService.findOne(id, workspace.id, userId);
  }

  @Patch(':id')
  update(
    @CurrentWorkspace() workspace: Workspace,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.update(id, workspace.id, updatePostDto);
  }

  @Delete(':id/tags/:tagId')
  removeTag(
    @CurrentWorkspace() workspace: Workspace,
    @Param('id', ParseUUIDPipe) postId: string,
    @Param('tagId', ParseUUIDPipe) tagId: string,
  ) {
    return this.postTagsService.removeTagFromPost(postId, tagId, workspace.id);
  }

  @Delete(':id')
  remove(
    @CurrentWorkspace() workspace: Workspace,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postsService.remove(id, workspace.id);
  }
}
