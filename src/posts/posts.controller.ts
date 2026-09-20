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
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { WorkspaceRoleGuard } from '../common/guards/workspace-role.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostTagsService } from './post-tags.service';
import { PostVotesService } from './post-votes.service';
import { PostsService } from './posts.service';

@Controller({
  path: 'workspaces/:workspaceId/posts',
  version: VERSION_NEUTRAL,
})
@UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly postTagsService: PostTagsService,
    private readonly postVotesService: PostVotesService,
  ) {}

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() createPostDto: CreatePostDto,
  ) {
    return this.postsService.create(workspaceId, userId, createPostDto);
  }

  @Get()
  findAll(
    @CurrentUserId() userId: string,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() query: QueryPostsDto,
  ) {
    return this.postsService.findAll(workspaceId, userId, query);
  }

  @Get(':id/tags')
  findTags(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postTagsService.findTagsByPost(id, workspaceId);
  }

  @Get(':id/voters')
  findVoters(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.postVotesService.findVotersByPost(
      id,
      workspaceId,
      paginationQuery,
    );
  }

  @Get(':id')
  findOne(
    @CurrentUserId() userId: string,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postsService.findOne(id, workspaceId, userId);
  }

  @Patch(':id')
  update(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.update(id, workspaceId, updatePostDto);
  }

  @Delete(':id')
  remove(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postsService.remove(id, workspaceId);
  }

  @Post(':id/vote')
  toggleVote(
    @CurrentUserId() userId: string,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postVotesService.toggleVote(id, userId, workspaceId);
  }

  @Post(':id/tags/:tagId')
  addTag(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) postId: string,
    @Param('tagId', ParseUUIDPipe) tagId: string,
  ) {
    return this.postTagsService.addTagToPost(postId, tagId, workspaceId);
  }

  @Delete(':id/tags/:tagId')
  removeTag(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) postId: string,
    @Param('tagId', ParseUUIDPipe) tagId: string,
  ) {
    return this.postTagsService.removeTagFromPost(postId, tagId, workspaceId);
  }
}
