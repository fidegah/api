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
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { WorkspaceRoleGuard } from '../common/guards/workspace-role.guard';
import { CommentLikesService } from './comment-likes.service';
import { CreatePostCommentDto } from './dto/create-post-comment.dto';
import { UpdatePostCommentDto } from './dto/update-post-comment.dto';
import { PostCommentsService } from './post-comments.service';

@Controller({
  path: 'workspaces/:workspaceId/posts/:postId/comments',
  version: VERSION_NEUTRAL,
})
@UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
export class PostCommentsController {
  constructor(
    private readonly postCommentsService: PostCommentsService,
    private readonly commentLikesService: CommentLikesService,
  ) {}

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() createPostCommentDto: CreatePostCommentDto,
  ) {
    return this.postCommentsService.create(
      postId,
      workspaceId,
      userId,
      createPostCommentDto,
    );
  }

  @Get()
  findAll(
    @CurrentUserId() userId: string,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.postCommentsService.findAllByPost(
      postId,
      workspaceId,
      userId,
      paginationQuery,
    );
  }

  @Get('summary')
  @RequireRole('owner', 'admin')
  summarizeComments(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('postId', ParseUUIDPipe) postId: string,
  ) {
    return this.postCommentsService.summarizeComments(postId, workspaceId);
  }

  @Get(':id/replies')
  findReplies(
    @CurrentUserId() userId: string,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.postCommentsService.findReplies(
      id,
      workspaceId,
      userId,
      paginationQuery,
    );
  }

  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePostCommentDto: UpdatePostCommentDto,
  ) {
    return this.postCommentsService.update(
      id,
      workspaceId,
      userId,
      updatePostCommentDto,
    );
  }

  @Delete(':id')
  @RequireRole('owner', 'admin')
  remove(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postCommentsService.remove(id, workspaceId);
  }

  @Post(':id/pin')
  @RequireRole('owner', 'admin')
  togglePin(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postCommentsService.togglePin(id, workspaceId);
  }

  @Post(':id/spam')
  @RequireRole('owner', 'admin')
  toggleSpam(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postCommentsService.toggleSpam(id, workspaceId);
  }

  @Post(':id/like')
  toggleLike(
    @CurrentUserId() userId: string,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.commentLikesService.toggleLike(id, workspaceId, userId);
  }
}
