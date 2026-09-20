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
import { PostCategoriesService } from './post-categories.service';
import { CreatePostCategoryDto } from './dto/create-post-category.dto';
import { UpdatePostCategoryDto } from './dto/update-post-category.dto';
import { QueryPostCategoriesDto } from './dto/query-post-categories.dto';

@Controller({ path: 'post-categories', version: '1' })
@UseGuards(ApiKeyGuard)
export class PostCategoriesApiKeyController {
  constructor(private readonly postCategoriesService: PostCategoriesService) {}

  @Post()
  create(
    @CurrentWorkspace() workspace: schema.Workspace,
    @CurrentApiKeyUser() userId: string,
    @Body() createPostCategoryDto: CreatePostCategoryDto,
  ) {
    return this.postCategoriesService.create(
      workspace.id,
      userId,
      createPostCategoryDto,
    );
  }

  @Get()
  findAll(
    @CurrentWorkspace() workspace: schema.Workspace,
    @Query() query: QueryPostCategoriesDto,
  ) {
    return this.postCategoriesService.findAllPublicByWorkspace(
      workspace.id,
      query,
    );
  }

  @Get(':id')
  findOne(
    @CurrentWorkspace() workspace: schema.Workspace,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postCategoriesService.findOne(id, workspace.id);
  }

  @Patch(':id')
  update(
    @CurrentWorkspace() workspace: schema.Workspace,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePostCategoryDto: UpdatePostCategoryDto,
  ) {
    return this.postCategoriesService.update(
      id,
      workspace.id,
      updatePostCategoryDto,
    );
  }

  @Delete(':id')
  remove(
    @CurrentWorkspace() workspace: schema.Workspace,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postCategoriesService.remove(id, workspace.id);
  }
}
