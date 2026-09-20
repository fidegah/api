import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';

import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequireRole } from '../common/decorators/require-role.decorator';
import { WorkspaceRoleGuard } from '../common/guards/workspace-role.guard';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Controller({
  path: 'workspaces/:workspaceId/boards',
  version: VERSION_NEUTRAL,
})
@UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() createBoardDto: CreateBoardDto,
  ) {
    return this.boardsService.create(workspaceId, userId, createBoardDto);
  }

  @Get()
  findAll(@Param('workspaceId', ParseUUIDPipe) workspaceId: string) {
    return this.boardsService.findAllByWorkspace(workspaceId);
  }

  @Get('default')
  findDefault(@Param('workspaceId', ParseUUIDPipe) workspaceId: string) {
    return this.boardsService.findDefault(workspaceId);
  }

  @Get(':id')
  findOne(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.boardsService.findOne(id, workspaceId);
  }

  @Patch(':id/set-default')
  @RequireRole('owner', 'admin')
  setDefault(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.boardsService.setDefault(id, workspaceId);
  }

  @Patch(':id')
  @RequireRole('owner', 'admin')
  update(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBoardDto: UpdateBoardDto,
  ) {
    return this.boardsService.update(id, workspaceId, updateBoardDto);
  }

  @Delete(':id')
  @RequireRole('owner', 'admin')
  remove(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.boardsService.remove(id, workspaceId);
  }
}
