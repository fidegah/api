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
  Req,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';

import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../users/types/auth-user.type';
import { WorkspaceRoleGuard } from '../common/guards/workspace-role.guard';
import { RequireRole } from '../common/decorators/require-role.decorator';

import { PostCategoriesService } from './post-categories.service';
import { CreatePostCategoryDto } from './dto/create-post-category.dto';
import { UpdatePostCategoryDto } from './dto/update-post-category.dto';
import { QueryPostCategoriesDto } from './dto/query-post-categories.dto';

@Controller({
  path: 'workspaces/:workspaceId/post-categories',
  version: VERSION_NEUTRAL,
})
@UseGuards(JwtAuthGuard)
export class PostCategoriesController {
  constructor(private readonly postCategoriesService: PostCategoriesService) {}

  @Post()
  @UseGuards(WorkspaceRoleGuard)
  async create(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() createPostCategoryDto: CreatePostCategoryDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;

    return this.postCategoriesService.create(
      workspaceId,
      user.id,
      createPostCategoryDto,
    );
  }

  @Get()
  @UseGuards(WorkspaceRoleGuard)
  findAll(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() query: QueryPostCategoriesDto,
  ) {
    return this.postCategoriesService.findAllByWorkspace(workspaceId, query);
  }

  @Get(':id')
  @UseGuards(WorkspaceRoleGuard)
  async findOne(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postCategoriesService.findOne(id, workspaceId);
  }

  @Patch(':id')
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  async update(
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
  @UseGuards(WorkspaceRoleGuard)
  @RequireRole('owner', 'admin')
  async remove(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postCategoriesService.remove(id, workspaceId);
  }
}
