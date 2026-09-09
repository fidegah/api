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
} from '@nestjs/common';

import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';
import { CurrentWorkspace } from '../api-keys/decorators/current-workspace.decorator';
import * as schema from '../db/schema';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { CurrentApiKeyUser } from '../api-keys/decorators/current-api-key-user.decorator';

@Controller({ path: 'boards', version: '1' })
@UseGuards(ApiKeyGuard)
export class BoardsApiKeyController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  create(
    @CurrentWorkspace() workspace: schema.Workspace,
    @CurrentApiKeyUser() userId: string,
    @Body() createBoardDto: CreateBoardDto,
  ) {
    return this.boardsService.create(workspace.id, userId, createBoardDto);
  }

  @Get()
  findAll(@CurrentWorkspace() workspace: schema.Workspace) {
    return this.boardsService.findAllByWorkspace(workspace.id);
  }

  @Get(':id')
  findOne(
    @CurrentWorkspace() workspace: schema.Workspace,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.boardsService.findOne(id, workspace.id);
  }

  @Patch(':id')
  update(
    @CurrentWorkspace() workspace: schema.Workspace,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBoardDto: UpdateBoardDto,
  ) {
    return this.boardsService.update(id, workspace.id, updateBoardDto);
  }

  @Delete(':id')
  remove(
    @CurrentWorkspace() workspace: schema.Workspace,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.boardsService.remove(id, workspace.id);
  }
}
