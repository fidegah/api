import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../users/types/auth-user.type';
import { AnnouncementsService } from './announcements.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Controller({ path: 'announcements', version: VERSION_NEUTRAL })
@UseGuards(JwtAuthGuard)
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  findAll(@Query() paginationQuery: PaginationQueryDto, @Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.announcementsService.findAll(user.id, paginationQuery);
  }

  @Post(':id/view')
  markAsViewed(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.announcementsService.markAsViewed(id, user.id);
  }
}
