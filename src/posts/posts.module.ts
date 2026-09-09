import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PostsApiKeyController } from './posts-api-key.controller';
import { PostTagsService } from './post-tags.service';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { PostVotesService } from './post-votes.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PortalModule } from '../portal/portal.module';
import { PostsPortalController } from './posts-portal.controller';
import { PostsSdkController } from './posts-sdk.controller';

@Module({
  imports: [WorkspacesModule, NotificationsModule, PortalModule],
  controllers: [
    PostsController,
    PostsApiKeyController,
    PostsPortalController,
    PostsSdkController,
  ],
  providers: [PostsService, PostTagsService, PostVotesService],
})
export class PostsModule {}
