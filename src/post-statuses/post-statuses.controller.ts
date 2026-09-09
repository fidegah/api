import { Controller, Get, UseGuards, VERSION_NEUTRAL } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostStatusesService } from './post-statuses.service';

@Controller({ path: 'post-statuses', version: VERSION_NEUTRAL })
@UseGuards(JwtAuthGuard)
export class PostStatusesController {
  constructor(private readonly postStatusesService: PostStatusesService) {}

  @Get()
  findAll() {
    return this.postStatusesService.findAll();
  }
}
