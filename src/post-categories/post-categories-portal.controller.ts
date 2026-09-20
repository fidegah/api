import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { PostCategoriesService } from './post-categories.service';
import { QueryPostCategoriesDto } from './dto/query-post-categories.dto';
import { PortalWorkspaceGuard } from '../portal/guards/portal-workspace.guard';
import { CurrentPortalWorkspace } from '../portal/decorators/portal-data.decorator';
import type { Workspace } from '../db/schema';

@Controller({ path: 'portal/post-categories', version: VERSION_NEUTRAL })
@UseGuards(PortalWorkspaceGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class PostCategoriesPortalController {
  constructor(private readonly postCategoriesService: PostCategoriesService) {}

  @Get()
  findAll(
    @CurrentPortalWorkspace() workspace: Workspace,
    @Query() query: QueryPostCategoriesDto,
  ) {
    return this.postCategoriesService.findAllPublicByWorkspace(
      workspace.id,
      query,
    );
  }

  @Get(':id')
  async findOne(
    @CurrentPortalWorkspace() workspace: Workspace,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postCategoriesService.findOne(id, workspace.id);
  }
}
