import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';

import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../users/types/auth-user.type';
import { WorkspaceRoleGuard } from '../common/guards/workspace-role.guard';
import { RequireRole } from '../common/decorators/require-role.decorator';

import { PollsService } from './polls.service';
import { CreatePollDto } from './dto/create-poll.dto';
import { GetPollsQueryDto } from './dto/get-polls-query.dto';

@Controller({
  path: 'workspaces/:workspaceId/polls',
  version: VERSION_NEUTRAL,
})
@UseGuards(JwtAuthGuard)
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Post()
  @UseGuards(WorkspaceRoleGuard)
  async create(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() createPollDto: CreatePollDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;

    return this.pollsService.create(workspaceId, user.id, createPollDto);
  }

  @Get()
  @UseGuards(WorkspaceRoleGuard)
  async findAll(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() query: GetPollsQueryDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;

    return this.pollsService.findAll(workspaceId, user.id, query);
  }

  @Get(':id')
  @UseGuards(WorkspaceRoleGuard)
  async findOne(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;

    return this.pollsService.findOne(id, workspaceId, user.id);
  }

  @Delete(':id')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  async remove(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.pollsService.remove(id, workspaceId);
  }
}
