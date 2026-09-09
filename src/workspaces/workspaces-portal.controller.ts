import { Controller, Get, UseGuards, VERSION_NEUTRAL } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PortalWorkspaceGuard } from '../portal/guards/portal-workspace.guard';
import { CurrentPortalWorkspace } from '../portal/decorators/portal-data.decorator';
import type { Workspace } from '../db/schema';
import { CurrentPortalUser } from '../portal/decorators/portal-user.decorator';
import { WorkspaceUsersService } from './workspace-users.service';
import { PortalJwtAuthGuard } from '../portal/guards/portal-jwt-auth.guard';
import { RequirePortalAuth } from '../portal/decorators/require-portal-auth.decorator';

@Controller({ path: 'portal/workspaces', version: VERSION_NEUTRAL })
@UseGuards(PortalWorkspaceGuard, PortalJwtAuthGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class WorkspacesPortalController {
  constructor(private readonly workspaceUsersService: WorkspaceUsersService) {}

  @Get('current')
  findCurrent(@CurrentPortalWorkspace() workspace: Workspace) {
    return workspace;
  }

  @Get('me')
  @RequirePortalAuth()
  getMyMembership(
    @CurrentPortalWorkspace() workspace: Workspace,
    @CurrentPortalUser() userId: string,
  ) {
    return this.workspaceUsersService.getMembership(workspace.id, userId);
  }
}
