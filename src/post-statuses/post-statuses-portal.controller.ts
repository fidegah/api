import { Controller, Get, UseGuards, VERSION_NEUTRAL } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { PostStatusesService } from './post-statuses.service';
import { PortalWorkspaceGuard } from '../portal/guards/portal-workspace.guard';

@Controller({ path: 'portal/post-statuses', version: VERSION_NEUTRAL })
@UseGuards(PortalWorkspaceGuard)
@Throttle({ default: { limit: 60, ttl: 60_000 } })
export class PostStatusesPortalController {
  constructor(private readonly postStatusesService: PostStatusesService) {}

  @Get()
  findAll() {
    return this.postStatusesService.findAll();
  }
}
