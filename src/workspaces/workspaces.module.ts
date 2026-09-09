import { Module } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import { WorkspaceApiKeyController } from './workspaces-api-key.controller';
import { WorkspaceUsersService } from './workspace-users.service';
import { WorkspacesPortalController } from './workspaces-portal.controller';
import { PortalModule } from '../portal/portal.module';
import { WorkspacesSdkController } from './workspaces-sdk.controller';

@Module({
  imports: [PortalModule],
  controllers: [
    WorkspacesController,
    WorkspaceApiKeyController,
    WorkspacesPortalController,
    WorkspacesSdkController,
  ],
  providers: [WorkspacesService, WorkspaceUsersService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
