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
import { Throttle } from '@nestjs/throttler';

import { PostCommentsService } from './post-comments.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PortalWorkspaceGuard } from '../portal/guards/portal-workspace.guard';
import { CurrentPortalWorkspace } from '../portal/decorators/portal-data.decorator';
import {
  CurrentPortalUser,
  OptionalPortalUser,
} from '../portal/decorators/portal-user.decorator';
import type { Workspace } from '../db/schema';
import { CreatePostCommentDto } from './dto/create-post-comment.dto';
import { UpdatePostCommentDto } from './dto/update-post-comment.dto';
import { CommentLikesService } from './comment-likes.service';
import { PortalJwtAuthGuard } from '../portal/guards/portal-jwt-auth.guard';
import { RequirePortalAuth } from '../portal/decorators/require-portal-auth.decorator';

@Controller({ path: 'portal/posts', version: VERSION_NEUTRAL })
@UseGuards(PortalWorkspaceGuard, PortalJwtAuthGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class PostCommentsPortalController {
  constructor(
    private readonly postCommentsService: PostCommentsService,
    private readonly commentLikesService: CommentLikesService,
  ) {}

  @Post(':postId/comments')
  @RequirePortalAuth()
  create(
    @CurrentPortalWorkspace() workspace: Workspace,
    @CurrentPortalUser() userId: string,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() createPostCommentDto: CreatePostCommentDto,
  ) {
    return this.postCommentsService.create(
      postId,
      workspace.id,
      userId,
      createPostCommentDto,
    );
  }

  @Get(':postId/comments')
  findAllByPost(
    @CurrentPortalWorkspace() workspace: Workspace,
    @OptionalPortalUser() userId: string | null,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.postCommentsService.findAllByPost(
      postId,
      workspace.id,
      userId,
      paginationQuery,
    );
  }

  @Get('comments/:commentId/replies')
  findReplies(
    @CurrentPortalWorkspace() workspace: Workspace,
    @OptionalPortalUser() userId: string | null,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.postCommentsService.findReplies(
      commentId,
      workspace.id,
      userId,
      paginationQuery,
    );
  }

  @Patch('comments/:commentId')
  @RequirePortalAuth()
  update(
    @CurrentPortalWorkspace() workspace: Workspace,
    @CurrentPortalUser() userId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() updatePostCommentDto: UpdatePostCommentDto,
  ) {
    return this.postCommentsService.update(
      commentId,
      workspace.id,
      userId,
      updatePostCommentDto,
    );
  }

  @Delete('comments/:commentId')
  @RequirePortalAuth()
  remove(
    @CurrentPortalWorkspace() workspace: Workspace,
    @CurrentPortalUser() userId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
  ) {
    return this.postCommentsService.removePortalComment(
      commentId,
      workspace.id,
      userId,
    );
  }

  @Post('comments/:commentId/like')
  @RequirePortalAuth()
  toggleLike(
    @CurrentPortalUser() userId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
  ) {
    return this.commentLikesService.toggleLike(commentId, userId);
  }
}
