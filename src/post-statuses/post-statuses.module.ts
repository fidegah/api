import { Module } from '@nestjs/common';
import { PostStatusesService } from './post-statuses.service';
import { PostStatusesController } from './post-statuses.controller';
import { PostStatusesApiKeyController } from './post-statuses-api-key.controller';
import { PortalModule } from '../portal/portal.module';
import { PostStatusesPortalController } from './post-statuses-portal.controller';

@Module({
  imports: [PortalModule],
  controllers: [
    PostStatusesController,
    PostStatusesApiKeyController,
    PostStatusesPortalController,
  ],
  providers: [PostStatusesService],
})
export class PostStatusesModule {}
