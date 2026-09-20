import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import type { Workspace } from '../db/schema';
import { BoardsService } from './boards.service';
import { CurrentSdkWorkspace } from '../sdk/decorators/sdk-workspace.decorator';
import { SdkWorkspaceGuard } from '../sdk/guards/sdk-workspace.guard';

@Controller({ path: 'sdk/boards', version: VERSION_NEUTRAL })
@UseGuards(SdkWorkspaceGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class BoardsSdkController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  findAll(@CurrentSdkWorkspace() workspace: Workspace) {
    return this.boardsService.findPublicByWorkspace(workspace.id);
  }

  @Get('default')
  findDefault(@CurrentSdkWorkspace() workspace: Workspace) {
    return this.boardsService.findPublicDefault(workspace.id);
  }

  @Get(':id')
  findOne(
    @CurrentSdkWorkspace() workspace: Workspace,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.boardsService.findPublicOne(id, workspace.id);
  }
}
