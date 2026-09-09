import { Module } from '@nestjs/common';
import { PollsService } from './polls.service';
import { PollsController } from './polls.controller';
import { PollsApiKeyController } from './polls-api-key.controller';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { PortalModule } from '../portal/portal.module';
import { PollsPortalController } from './polls-portal.controller';

@Module({
  imports: [WorkspacesModule, PortalModule],
  controllers: [PollsController, PollsApiKeyController, PollsPortalController],
  providers: [PollsService],
})
export class PollsModule {}
