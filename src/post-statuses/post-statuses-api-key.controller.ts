import { Controller, Get, UseGuards } from '@nestjs/common';

import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';
import { PostStatusesService } from './post-statuses.service';

@Controller({ path: 'post-statuses', version: '1' })
@UseGuards(ApiKeyGuard)
export class PostStatusesApiKeyController {
  constructor(private readonly postStatusesService: PostStatusesService) {}

  @Get()
  findAll() {
    return this.postStatusesService.findAll();
  }
}
