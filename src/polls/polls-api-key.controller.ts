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
} from '@nestjs/common';

import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';
import { CurrentWorkspace } from '../api-keys/decorators/current-workspace.decorator';
import { CurrentApiKeyUser } from '../api-keys/decorators/current-api-key-user.decorator';
import * as schema from '../db/schema';
import { PollsService } from './polls.service';
import { CreatePollDto } from './dto/create-poll.dto';
import { VotePollDto } from './dto/vote-poll.dto';
import { GetPollsQueryDto } from './dto/get-polls-query.dto';

@Controller({ path: 'polls', version: '1' })
@UseGuards(ApiKeyGuard)
export class PollsApiKeyController {
  constructor(private readonly pollsService: PollsService) {}

  @Post()
  create(
    @CurrentWorkspace() workspace: schema.Workspace,
    @CurrentApiKeyUser() userId: string,
    @Body() createPollDto: CreatePollDto,
  ) {
    return this.pollsService.create(workspace.id, userId, createPollDto);
  }

  @Get()
  findAll(
    @CurrentWorkspace() workspace: schema.Workspace,
    @CurrentApiKeyUser() userId: string,
    @Query() query: GetPollsQueryDto,
  ) {
    return this.pollsService.findAll(workspace.id, userId, query);
  }

  @Get(':id')
  findOne(
    @CurrentWorkspace() workspace: schema.Workspace,
    @CurrentApiKeyUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.pollsService.findOne(id, workspace.id, userId);
  }

  @Delete(':id')
  remove(
    @CurrentWorkspace() workspace: schema.Workspace,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.pollsService.remove(id, workspace.id);
  }

  @Post(':id/vote')
  vote(
    @CurrentWorkspace() workspace: schema.Workspace,
    @CurrentApiKeyUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() votePollDto: VotePollDto,
  ) {
    return this.pollsService.vote(id, workspace.id, userId, votePollDto);
  }

  @Delete(':id/vote')
  removeVote(
    @CurrentWorkspace() workspace: schema.Workspace,
    @CurrentApiKeyUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.pollsService.removeVote(id, workspace.id, userId);
  }
}
