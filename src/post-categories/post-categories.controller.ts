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
  VERSION_NEUTRAL,
} from '@nestjs/common';

import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequireRole } from '../common/decorators/require-role.decorator';
import { WorkspaceRoleGuard } from '../common/guards/workspace-role.guard';
import { CreatePostCategoryDto } from './dto/create-post-category.dto';
import { QueryPostCategoriesDto } from './dto/query-post-categories.dto';
import { UpdatePostCategoryDto } from './dto/update-post-category.dto';
import { PostCategoriesService } from './post-categories.service';

@Controller({
  path: 'workspaces/:workspaceId/post-categories',
  version: VERSION_NEUTRAL,
})
@UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
export class PostCategoriesController {
  constructor(private readonly postCategoriesService: PostCategoriesService) {}

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() createPostCategoryDto: CreatePostCategoryDto,
  ) {
    return this.postCategoriesService.create(
      workspaceId,
      userId,
      createPostCategoryDto,
    );
  }

  @Get()
  findAll(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() query: QueryPostCategoriesDto,
  ) {
    return this.postCategoriesService.findAllPublicByWorkspace(
      workspaceId,
      query,
    );
  }

  @Get(':id')
  findOne(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postCategoriesService.findOne(id, workspaceId);
  }

  @Patch(':id')
  @RequireRole('owner', 'admin')
  update(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePostCategoryDto: UpdatePostCategoryDto,
  ) {
    return this.postCategoriesService.update(
      id,
      workspaceId,
      updatePostCategoryDto,
    );
  }

  @Delete(':id')
  @RequireRole('owner', 'admin')
  remove(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postCategoriesService.remove(id, workspaceId);
  }
}
