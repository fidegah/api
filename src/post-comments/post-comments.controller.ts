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
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

import { PostCommentsService } from './post-comments.service';
import { CreatePostCommentDto } from './dto/create-post-comment.dto';
import { UpdatePostCommentDto } from './dto/update-post-comment.dto';
import { CommentLikesService } from './comment-likes.service';

@Controller({
  path: 'workspaces/:workspaceId/posts/:postId/comments',
  version: VERSION_NEUTRAL,
})
@UseGuards(JwtAuthGuard)
export class PostCommentsController {
  constructor(
    private readonly postCommentsService: PostCommentsService,
    private readonly commentLikesService: CommentLikesService,
  ) {}

  @Post()
  @UseGuards(WorkspaceRoleGuard)
  async create(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() createPostCommentDto: CreatePostCommentDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;

    return this.postCommentsService.create(
      postId,
      workspaceId,
      user.id,
      createPostCommentDto,
    );
  }

  @Get()
  @UseGuards(WorkspaceRoleGuard)
  async findAll(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query() paginationQuery: PaginationQueryDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;

    return this.postCommentsService.findAllByPost(
      postId,
      workspaceId,
      user.id,
      paginationQuery,
    );
  }

  @Get(':id/replies')
  @UseGuards(WorkspaceRoleGuard)
  async findReplies(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() paginationQuery: PaginationQueryDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;

    return this.postCommentsService.findReplies(
      id,
      workspaceId,
      user.id,
      paginationQuery,
    );
  }

  @Patch(':id')
  @UseGuards(WorkspaceRoleGuard)
  async update(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePostCommentDto: UpdatePostCommentDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;

    return this.postCommentsService.update(
      id,
      workspaceId,
      user.id,
      updatePostCommentDto,
    );
  }

  @Delete(':id')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  async remove(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postCommentsService.remove(id, workspaceId);
  }

  @Post(':id/pin')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  async togglePin(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postCommentsService.togglePin(id, workspaceId);
  }

  @Post(':id/spam')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  async toggleSpam(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postCommentsService.toggleSpam(id, workspaceId);
  }

  @Get('summary')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  async summarizeComments(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('postId', ParseUUIDPipe) postId: string,
  ) {
    return this.postCommentsService.summarizeComments(postId, workspaceId);
  }

  @Post(':id/like')
  @UseGuards(WorkspaceRoleGuard)
  async toggleLike(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;

    return this.commentLikesService.toggleLike(id, user.id);
  }
}
