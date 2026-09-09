import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';

import type { Request } from 'express';

import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../users/types/auth-user.type';
import { WorkspaceRoleGuard } from '../common/guards/workspace-role.guard';
import { RequireRole } from '../common/decorators/require-role.decorator';

@Controller({
  path: 'workspaces/:workspaceId/boards',
  version: VERSION_NEUTRAL,
})
@UseGuards(JwtAuthGuard)
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  @UseGuards(WorkspaceRoleGuard)
  async create(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Req() req: Request,
    @Body() createBoardDto: CreateBoardDto,
  ) {
    const user = req.user as AuthenticatedUser;

    return this.boardsService.create(workspaceId, user.id, createBoardDto);
  }

  @Get()
  @UseGuards(WorkspaceRoleGuard)
  async findAll(@Param('workspaceId', ParseUUIDPipe) workspaceId: string) {
    return this.boardsService.findAllByWorkspace(workspaceId);
  }

  @Get('default')
  @UseGuards(WorkspaceRoleGuard)
  findDefault(@Param('workspaceId', ParseUUIDPipe) workspaceId: string) {
    return this.boardsService.findDefault(workspaceId);
  }

  @Get(':id')
  @UseGuards(WorkspaceRoleGuard)
  async findOne(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.boardsService.findOne(id, workspaceId);
  }

  @Patch(':id/set-default')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  setDefault(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.boardsService.setDefault(id, workspaceId);
  }

  @Patch(':id')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  async update(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBoardDto: UpdateBoardDto,
  ) {
    return this.boardsService.update(id, workspaceId, updateBoardDto);
  }

  @Delete(':id')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  async remove(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.boardsService.remove(id, workspaceId);
  }
}
