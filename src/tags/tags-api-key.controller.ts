import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';
import { CurrentWorkspace } from '../api-keys/decorators/current-workspace.decorator';
import { CurrentApiKeyUser } from '../api-keys/decorators/current-api-key-user.decorator';
import * as schema from '../db/schema';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { QueryTagsDto } from './dto/query-tags.dto';

@Controller({ path: 'tags', version: '1' })
@UseGuards(ApiKeyGuard)
export class TagsApiKeyController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  create(
    @CurrentWorkspace() workspace: schema.Workspace,
    @CurrentApiKeyUser() userId: string,
    @Body() createTagDto: CreateTagDto,
  ) {
    return this.tagsService.create(workspace.id, userId, createTagDto);
  }

  @Get()
  findAll(
    @CurrentWorkspace() workspace: schema.Workspace,
    @Query() query: QueryTagsDto,
  ) {
    return this.tagsService.findAllByWorkspace(workspace.id, query);
  }

  @Get(':id')
  findOne(
    @CurrentWorkspace() workspace: schema.Workspace,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tagsService.findOne(id, workspace.id);
  }

  @Patch(':id')
  update(
    @CurrentWorkspace() workspace: schema.Workspace,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTagDto: UpdateTagDto,
  ) {
    return this.tagsService.update(id, workspace.id, updateTagDto);
  }

  @Delete(':id')
  remove(
    @CurrentWorkspace() workspace: schema.Workspace,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tagsService.remove(id, workspace.id);
  }
}
