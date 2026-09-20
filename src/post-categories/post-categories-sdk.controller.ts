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
import type { Workspace } from '../db/schema';
import { CurrentSdkWorkspace } from '../sdk/decorators/sdk-workspace.decorator';
import { SdkWorkspaceGuard } from '../sdk/guards/sdk-workspace.guard';

@Controller({ path: 'sdk/post-categories', version: VERSION_NEUTRAL })
@UseGuards(SdkWorkspaceGuard)
@Throttle({ default: { limit: 120, ttl: 60_000 } })
export class PostCategoriesSdkController {
  constructor(private readonly postCategoriesService: PostCategoriesService) {}

  @Get()
  findAll(
    @CurrentSdkWorkspace() workspace: Workspace,
    @Query() query: QueryPostCategoriesDto,
  ) {
    return this.postCategoriesService.findAllPublicByWorkspace(
      workspace.id,
      query,
    );
  }

  @Get(':id')
  findOne(
    @CurrentSdkWorkspace() workspace: Workspace,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postCategoriesService.findOnePublic(id, workspace.id);
  }
}
