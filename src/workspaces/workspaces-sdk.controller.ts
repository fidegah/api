import { Controller, Get, UseGuards, VERSION_NEUTRAL } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import type { Workspace } from '../db/schema';
import { CurrentSdkWorkspace } from '../sdk/decorators/sdk-workspace.decorator';
import { SdkWorkspaceGuard } from '../sdk/guards/sdk-workspace.guard';

@Controller({ path: 'sdk/workspaces', version: VERSION_NEUTRAL })
@UseGuards(SdkWorkspaceGuard)
@Throttle({ default: { limit: 120, ttl: 60_000 } })
export class WorkspacesSdkController {
  @Get('current')
  getCurrentWorkspace(@CurrentSdkWorkspace() workspace: Workspace) {
    return {
      id: workspace.id,
      name: workspace.name,
      subdomain: workspace.subdomain,
    };
  }
}
