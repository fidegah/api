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

import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequireRole } from '../common/decorators/require-role.decorator';
import { WorkspaceRoleGuard } from '../common/guards/workspace-role.guard';
import { CreatePollDto } from './dto/create-poll.dto';
import { GetPollsQueryDto } from './dto/get-polls-query.dto';
import { PollsService } from './polls.service';

@Controller({
  path: 'workspaces/:workspaceId/polls',
  version: VERSION_NEUTRAL,
})
@UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() createPollDto: CreatePollDto,
  ) {
    return this.pollsService.create(workspaceId, userId, createPollDto);
  }

  @Get()
  findAll(
    @CurrentUserId() userId: string,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() query: GetPollsQueryDto,
  ) {
    return this.pollsService.findAll(workspaceId, userId, query);
  }

  @Get(':id')
  findOne(
    @CurrentUserId() userId: string,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.pollsService.findOne(id, workspaceId, userId);
  }

  @Delete(':id')
  @RequireRole('owner', 'admin')
  remove(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.pollsService.remove(id, workspaceId);
  }
}
