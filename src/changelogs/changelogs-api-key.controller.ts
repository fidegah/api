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

import { CurrentApiKeyUser } from '../api-keys/decorators/current-api-key-user.decorator';
import { CurrentWorkspace } from '../api-keys/decorators/current-workspace.decorator';
import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';
import * as schema from '../db/schema';
import { ChangelogLikesService } from './changelog-likes.service';
import { ChangelogTagsService } from './changelog-tags.service';
import { ChangelogsService } from './changelogs.service';
import { CreateChangelogDto } from './dto/create-changelog.dto';
import { QueryChangelogsDto } from './dto/query-changelogs.dto';
import { UpdateChangelogDto } from './dto/update-changelog.dto';

@Controller({ path: 'changelogs', version: '1' })
@UseGuards(ApiKeyGuard)
export class ChangelogsApiKeyController {
  constructor(
    private readonly changelogsService: ChangelogsService,
    private readonly changelogLikesService: ChangelogLikesService,
    private readonly changelogTagsService: ChangelogTagsService,
  ) {}

  @Post()
  create(
    @CurrentWorkspace() workspace: schema.Workspace,
    @CurrentApiKeyUser() userId: string,
    @Body() createChangelogDto: CreateChangelogDto,
  ) {
    return this.changelogsService.create(
      workspace.id,
      userId,
      createChangelogDto,
    );
  }

  @Get()
  findAll(
    @CurrentWorkspace() workspace: schema.Workspace,
    @CurrentApiKeyUser() userId: string,
    @Query() query: QueryChangelogsDto,
  ) {
    return this.changelogsService.findAll(workspace.id, userId, query);
  }

  @Get('tags')
  getTags() {
    return this.changelogTagsService.findAll();
  }

  @Get(':id')
  findOne(
    @CurrentWorkspace() workspace: schema.Workspace,
    @CurrentApiKeyUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.changelogsService.findOneAndIncrementViews(
      id,
      workspace.id,
      userId,
    );
  }

  @Patch(':id')
  update(
    @CurrentWorkspace() workspace: schema.Workspace,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateChangelogDto: UpdateChangelogDto,
  ) {
    return this.changelogsService.update(id, workspace.id, updateChangelogDto);
  }

  @Delete(':id')
  remove(
    @CurrentWorkspace() workspace: schema.Workspace,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.changelogsService.remove(id, workspace.id);
  }

  @Post(':id/like')
  toggleLike(
    @CurrentApiKeyUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.changelogLikesService.toggleLike(id, userId);
  }
}
