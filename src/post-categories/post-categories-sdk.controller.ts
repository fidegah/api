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
import { SdkGuard } from '../sdk/guards/sdk.guard';
import { CurrentSdkWorkspace } from '../sdk/decorators/sdk-workspace.decorator';

@Controller({ path: 'sdk/post-categories', version: VERSION_NEUTRAL })
@UseGuards(SdkGuard)
@Throttle({ default: { limit: 120, ttl: 60_000 } })
export class PostCategoriesSdkController {
  constructor(private readonly postCategoriesService: PostCategoriesService) {}

  @Get()
  findAll(
    @CurrentSdkWorkspace() workspace: Workspace,
    @Query() query: QueryPostCategoriesDto,
  ) {
    return this.postCategoriesService.findAllByWorkspace(workspace.id, query);
  }

  @Get(':id')
  async findOne(
    @CurrentSdkWorkspace() workspace: Workspace,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.postCategoriesService.findOne(id, workspace.id);
  }
}
