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
import * as schema from '../db/schema';
import { PostCommentsService } from './post-comments.service';
import { CreatePostCommentDto } from './dto/create-post-comment.dto';
import { UpdatePostCommentDto } from './dto/update-post-comment.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CommentLikesService } from './comment-likes.service';

@Controller({ path: 'posts/:postId/comments', version: '1' })
@UseGuards(ApiKeyGuard)
export class PostCommentsApiKeyController {
  constructor(
    private readonly postCommentsService: PostCommentsService,
    private readonly commentLikesService: CommentLikesService,
  ) {}

  @Post()
  create(
    @CurrentWorkspace() workspace: schema.Workspace,
    @CurrentApiKeyUser() userId: string,
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

  @Get()
  findAll(
    @CurrentWorkspace() workspace: schema.Workspace,
    @CurrentApiKeyUser() userId: string,
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

  @Get(':id/replies')
  findReplies(
    @CurrentWorkspace() workspace: schema.Workspace,
    @CurrentApiKeyUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.postCommentsService.findReplies(
      id,
      workspace.id,
      userId,
      paginationQuery,
    );
  }

  @Patch(':id')
  update(
    @CurrentWorkspace() workspace: schema.Workspace,
    @CurrentApiKeyUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePostCommentDto: UpdatePostCommentDto,
  ) {
    return this.postCommentsService.update(
      id,
      workspace.id,
      userId,
      updatePostCommentDto,
    );
  }

  @Delete(':id')
  remove(
    @CurrentWorkspace() workspace: schema.Workspace,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postCommentsService.remove(id, workspace.id);
  }

  @Post(':id/like')
  toggleLike(
    @CurrentApiKeyUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.commentLikesService.toggleLike(id, userId);
  }
}
