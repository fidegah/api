import { Module } from '@nestjs/common';
import { PostCategoriesService } from './post-categories.service';
import { PostCategoriesController } from './post-categories.controller';
import { PostCategoriesApiKeyController } from './post-categories-api-key.controller';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { PostCategoriesPortalController } from './post-categories-portal.controller';
import { PortalModule } from '../portal/portal.module';
import { PostCategoriesSdkController } from './post-categories-sdk.controller';

@Module({
  imports: [WorkspacesModule, PortalModule],
  controllers: [
    PostCategoriesController,
    PostCategoriesApiKeyController,
    PostCategoriesPortalController,
    PostCategoriesSdkController,
  ],
  providers: [PostCategoriesService],
})
export class PostCategoriesModule {}
