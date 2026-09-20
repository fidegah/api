import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { AnnouncementsService } from './announcements.service';
import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';

@Controller({ path: 'announcements', version: VERSION_NEUTRAL })
@UseGuards(JwtAuthGuard)
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  findAll(
    @CurrentUserId() userId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.announcementsService.findAll(userId, paginationQuery);
  }

  @Post(':id/view')
  markAsViewed(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.announcementsService.markAsViewed(id, userId);
  }
}
