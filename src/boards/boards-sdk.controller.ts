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
import { CurrentSdkWorkspace } from '../sdk/decorators/sdk-workspace.decorator';
import { SdkGuard } from '../sdk/guards/sdk.guard';
import { BoardsService } from './boards.service';

@Controller({ path: 'sdk/boards', version: VERSION_NEUTRAL })
@UseGuards(SdkGuard)
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
