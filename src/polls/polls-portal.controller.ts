import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { PollsService } from './polls.service';
import { GetPollsQueryDto } from './dto/get-polls-query.dto';
import { VotePollDto } from './dto/vote-poll.dto';
import { PortalWorkspaceGuard } from '../portal/guards/portal-workspace.guard';
import { CurrentPortalWorkspace } from '../portal/decorators/portal-data.decorator';
import {
  CurrentPortalUser,
  OptionalPortalUser,
} from '../portal/decorators/portal-user.decorator';
import type { Workspace } from '../db/schema';
import { PortalJwtAuthGuard } from '../portal/guards/portal-jwt-auth.guard';
import { RequirePortalAuth } from '../portal/decorators/require-portal-auth.decorator';

@Controller({ path: 'portal/polls', version: VERSION_NEUTRAL })
@UseGuards(PortalWorkspaceGuard, PortalJwtAuthGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class PollsPortalController {
  constructor(private readonly pollsService: PollsService) {}

  @Get()
  findAll(
    @CurrentPortalWorkspace() workspace: Workspace,
    @OptionalPortalUser() userId: string | null,
    @Query() query: GetPollsQueryDto,
  ) {
    return this.pollsService.findAll(workspace.id, userId, query);
  }

  @Get(':id')
  findOne(
    @CurrentPortalWorkspace() workspace: Workspace,
    @OptionalPortalUser() userId: string | null,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.pollsService.findOne(id, workspace.id, userId);
  }

  @Post(':id/vote')
  @RequirePortalAuth()
  vote(
    @CurrentPortalWorkspace() workspace: Workspace,
    @CurrentPortalUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() votePollDto: VotePollDto,
  ) {
    return this.pollsService.vote(id, workspace.id, userId, votePollDto);
  }

  @Delete(':id/vote')
  @RequirePortalAuth()
  removeVote(
    @CurrentPortalWorkspace() workspace: Workspace,
    @CurrentPortalUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.pollsService.removeVote(id, workspace.id, userId);
  }
}
