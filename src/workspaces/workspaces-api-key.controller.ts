import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';

import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';
import { CurrentWorkspace } from '../api-keys/decorators/current-workspace.decorator';
import * as schema from '../db/schema';
import { WorkspacesService } from './workspaces.service';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { UpdateAllowedDomainsDto } from './dto/update-allowed-domains.dto';

@Controller({ path: 'workspaces', version: '1' })
@UseGuards(ApiKeyGuard)
export class WorkspaceApiKeyController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get('current')
  getCurrentWorkspace(@CurrentWorkspace() workspace: schema.Workspace) {
    return {
      id: workspace.id,
      name: workspace.name,
      subdomain: workspace.subdomain,
    };
  }

  @Get('credentials')
  getCredentials(@CurrentWorkspace() workspace: schema.Workspace) {
    return this.workspacesService.getCredentialsByWorkspaceId(workspace.id);
  }

  @Patch('current')
  updateWorkspace(
    @CurrentWorkspace() workspace: schema.Workspace,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.updateByWorkspaceId(
      workspace.id,
      updateWorkspaceDto,
    );
  }

  @Patch('allowed-domains')
  updateAllowedDomains(
    @CurrentWorkspace() workspace: schema.Workspace,
    @Body() updateAllowedDomainsDto: UpdateAllowedDomainsDto,
  ) {
    return this.workspacesService.updateAllowedDomainsByWorkspaceId(
      workspace.id,
      updateAllowedDomainsDto,
    );
  }

  @Patch('secure-identify')
  toggleSecureIdentify(
    @CurrentWorkspace() workspace: schema.Workspace,
    @Body('enforce') enforce: boolean,
  ) {
    return this.workspacesService.toggleSecureIdentifyByWorkspaceId(
      workspace.id,
      enforce,
    );
  }
}
