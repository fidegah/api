import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { BoardsService } from './boards.service';
import { PortalWorkspaceGuard } from '../portal/guards/portal-workspace.guard';
import { CurrentPortalWorkspace } from '../portal/decorators/portal-data.decorator';
import type { Workspace } from '../db/schema';

@Controller({ path: 'portal/boards', version: VERSION_NEUTRAL })
@UseGuards(PortalWorkspaceGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class BoardsPortalController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  findAll(@CurrentPortalWorkspace() workspace: Workspace) {
    return this.boardsService.findPublicByWorkspace(workspace.id);
  }

  @Get('default')
  findDefault(@CurrentPortalWorkspace() workspace: Workspace) {
    return this.boardsService.findPublicDefault(workspace.id);
  }

  @Get(':id')
  findOne(
    @CurrentPortalWorkspace() workspace: Workspace,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.boardsService.findPublicOne(id, workspace.id);
  }
}
