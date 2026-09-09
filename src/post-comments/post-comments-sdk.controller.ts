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

import { SdkGuard } from '../sdk/guards/sdk.guard';

import * as schema from '../db/schema';
import { PostCommentsService } from './post-comments.service';
import { CreatePostCommentDto } from './dto/create-post-comment.dto';
import { UpdatePostCommentDto } from './dto/update-post-comment.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CommentLikesService } from './comment-likes.service';
import { CurrentSdkWorkspace } from '../sdk/decorators/sdk-workspace.decorator';
import { CurrentExternalUserId } from '../sdk/decorators/current-external-user.decorator';

@Controller({ path: 'sdk/posts/:postId/comments', version: VERSION_NEUTRAL })
@UseGuards(SdkGuard)
export class PostCommentsSdkController {
  constructor(
    private readonly postCommentsService: PostCommentsService,
    private readonly commentLikesService: CommentLikesService,
  ) {}

  @Post()
  create(
    @CurrentSdkWorkspace() workspace: schema.Workspace,
    @CurrentExternalUserId() externalUserId: string,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() createPostCommentDto: CreatePostCommentDto,
  ) {
    return this.postCommentsService.createSdk(
      postId,
      workspace.id,
      externalUserId,
      createPostCommentDto,
    );
  }

  @Get()
  findAll(
    @CurrentSdkWorkspace() workspace: schema.Workspace,
    @CurrentExternalUserId() externalUserId: string,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.postCommentsService.findAllByPost(
      postId,
      workspace.id,
      null,
      paginationQuery,
      externalUserId,
    );
  }

  @Get(':id/replies')
  findReplies(
    @CurrentSdkWorkspace() workspace: schema.Workspace,
    @CurrentExternalUserId() externalUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.postCommentsService.findReplies(
      id,
      workspace.id,
      null,
      paginationQuery,
      externalUserId,
    );
  }

  @Patch(':id')
  update(
    @CurrentSdkWorkspace() workspace: schema.Workspace,
    @CurrentExternalUserId() externalUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePostCommentDto: UpdatePostCommentDto,
  ) {
    return this.postCommentsService.updateSdk(
      id,
      workspace.id,
      externalUserId,
      updatePostCommentDto,
    );
  }

  @Delete(':id')
  remove(
    @CurrentSdkWorkspace() workspace: schema.Workspace,
    @CurrentExternalUserId() externalUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postCommentsService.removeSdk(id, workspace.id, externalUserId);
  }

  @Post(':id/like')
  toggleLike(
    @CurrentExternalUserId() externalUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.commentLikesService.toggleLikeSdk(id, externalUserId);
  }
}
