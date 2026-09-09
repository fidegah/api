import { Module } from '@nestjs/common';
import { ChangelogsService } from './changelogs.service';
import { ChangelogsController } from './changelogs.controller';
import { ChangelogsApiKeyController } from './changelogs-api-key.controller';
import { ChangelogLikesService } from './changelog-likes.service';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ChangelogTagsService } from './changelog-tags.service';
import { PortalModule } from '../portal/portal.module';
import { ChangelogsPortalController } from './changelogs-portal.controller';

@Module({
  imports: [WorkspacesModule, PortalModule],
  controllers: [
    ChangelogsController,
    ChangelogsApiKeyController,
    ChangelogsPortalController,
  ],
  providers: [ChangelogsService, ChangelogLikesService, ChangelogTagsService],
})
export class ChangelogsModule {}
