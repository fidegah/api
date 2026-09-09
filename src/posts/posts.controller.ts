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

import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { PostTagsService } from './post-tags.service';
import { PostVotesService } from './post-votes.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Controller({
  path: 'workspaces/:workspaceId/posts',
  version: VERSION_NEUTRAL,
})
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly postTagsService: PostTagsService,
    private readonly postVotesService: PostVotesService,
  ) {}

  @Post()
  @UseGuards(WorkspaceRoleGuard)
  async create(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() createPostDto: CreatePostDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;

    return this.postsService.create(workspaceId, user.id, createPostDto);
  }

  @Get()
  @UseGuards(WorkspaceRoleGuard)
  async findAll(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() query: QueryPostsDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;

    return this.postsService.findAll(workspaceId, user.id, query);
  }

  @Get(':id')
  @UseGuards(WorkspaceRoleGuard)
  async findOne(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;

    return this.postsService.findOne(id, workspaceId, user.id);
  }

  @Patch(':id')
  @UseGuards(WorkspaceRoleGuard)
  async update(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.update(id, workspaceId, updatePostDto);
  }

  @Delete(':id')
  @UseGuards(WorkspaceRoleGuard)
  async remove(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postsService.remove(id, workspaceId);
  }

  @Get(':id/tags')
  @UseGuards(WorkspaceRoleGuard)
  findTags(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postTagsService.findTagsByPost(id, workspaceId);
  }

  @Post(':id/tags/:tagId')
  @UseGuards(WorkspaceRoleGuard)
  async addTag(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) postId: string,
    @Param('tagId', ParseUUIDPipe) tagId: string,
  ) {
    return this.postTagsService.addTagToPost(postId, tagId, workspaceId);
  }

  @Delete(':id/tags/:tagId')
  @UseGuards(WorkspaceRoleGuard)
  async removeTag(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) postId: string,
    @Param('tagId', ParseUUIDPipe) tagId: string,
  ) {
    return this.postTagsService.removeTagFromPost(postId, tagId, workspaceId);
  }

  @Get(':id/voters')
  @UseGuards(WorkspaceRoleGuard)
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

  @Post(':id/vote')
  @UseGuards(WorkspaceRoleGuard)
  async toggleVote(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;

    return this.postVotesService.toggleVote(id, user.id, workspaceId);
  }
}
