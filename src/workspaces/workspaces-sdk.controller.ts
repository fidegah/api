import { Controller, Get, UseGuards, VERSION_NEUTRAL } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { SdkGuard } from '../sdk/guards/sdk.guard';
import type { Workspace } from '../db/schema';
import { CurrentSdkWorkspace } from '../sdk/decorators/sdk-workspace.decorator';

@Controller({ path: 'sdk/workspaces', version: VERSION_NEUTRAL })
@UseGuards(SdkGuard)
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
