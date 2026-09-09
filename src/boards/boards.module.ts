import { Module } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { BoardsController } from './boards.controller';
import { BoardsApiKeyController } from './boards-api-key.controller';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { BoardsPortalController } from './boards-portal.controller';
import { PortalModule } from '../portal/portal.module';
import { BoardsSdkController } from './boards-sdk.controller';

@Module({
  imports: [WorkspacesModule, PortalModule],
  controllers: [
    BoardsController,
    BoardsApiKeyController,
    BoardsPortalController,
    BoardsSdkController,
  ],
  providers: [BoardsService],
})
export class BoardsModule {}
