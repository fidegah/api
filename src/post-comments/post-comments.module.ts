import { Module } from '@nestjs/common';
import { PostCommentsService } from './post-comments.service';
import { PostCommentsController } from './post-comments.controller';
import { PostCommentsApiKeyController } from './post-comments-api-key.controller';
import { AiModule } from '../ai/ai.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { CommentLikesService } from './comment-likes.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PortalModule } from '../portal/portal.module';
import { PostCommentsPortalController } from './post-comments-portal.controller';
import { PostCommentsSdkController } from './post-comments-sdk.controller';

@Module({
  imports: [AiModule, WorkspacesModule, NotificationsModule, PortalModule],
  controllers: [
    PostCommentsController,
    PostCommentsApiKeyController,
    PostCommentsPortalController,
    PostCommentsSdkController,
  ],
  providers: [PostCommentsService, CommentLikesService],
})
export class PostCommentsModule {}
