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

import type * as schema from '../db/schema';
import { PostCommentsService } from './post-comments.service';
import { CreatePostCommentDto } from './dto/create-post-comment.dto';
import { UpdatePostCommentDto } from './dto/update-post-comment.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CommentLikesService } from './comment-likes.service';
import { CurrentSdkWorkspace } from '../sdk/decorators/sdk-workspace.decorator';
import { SdkExternalUserId } from '../sdk/decorators/sdk-external-user.decorator';
import { SdkWorkspaceGuard } from '../sdk/guards/sdk-workspace.guard';
import { SdkSessionGuard } from '../sdk/guards/sdk-session.guard';
import { OptionalSdkSessionGuard } from '../sdk/guards/optional-sdk.session.guard';

@Controller({ path: 'sdk/posts/:postId/comments', version: VERSION_NEUTRAL })
@UseGuards(SdkWorkspaceGuard)
export class PostCommentsSdkController {
  constructor(
    private readonly postCommentsService: PostCommentsService,
    private readonly commentLikesService: CommentLikesService,
  ) {}

  @Post()
  @UseGuards(SdkSessionGuard)
  create(
    @CurrentSdkWorkspace() workspace: schema.Workspace,
    @SdkExternalUserId() externalUserId: string,
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

  @Post(':id/like')
  @UseGuards(SdkSessionGuard)
  toggleLike(
    @CurrentSdkWorkspace() workspace: schema.Workspace,
    @SdkExternalUserId() externalUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.commentLikesService.toggleLikeSdk(
      id,
      workspace.id,
      externalUserId,
    );
  }

  @Get()
  @UseGuards(OptionalSdkSessionGuard)
  findAll(
    @CurrentSdkWorkspace() workspace: schema.Workspace,
    @SdkExternalUserId() externalUserId: string | null,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.postCommentsService.findAllByPostSdk(
      postId,
      workspace.id,
      paginationQuery,
      externalUserId,
    );
  }

  @Get(':id/replies')
  @UseGuards(OptionalSdkSessionGuard)
  findReplies(
    @CurrentSdkWorkspace() workspace: schema.Workspace,
    @SdkExternalUserId() externalUserId: string | null,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.postCommentsService.findRepliesSdk(
      id,
      workspace.id,
      paginationQuery,
      externalUserId,
    );
  }

  @Patch(':id')
  @UseGuards(SdkSessionGuard)
  update(
    @CurrentSdkWorkspace() workspace: schema.Workspace,
    @SdkExternalUserId() externalUserId: string,
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
  @UseGuards(SdkSessionGuard)
  remove(
    @CurrentSdkWorkspace() workspace: schema.Workspace,
    @SdkExternalUserId() externalUserId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postCommentsService.removeSdk(id, workspace.id, externalUserId);
  }
}
