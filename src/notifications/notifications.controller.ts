import {
  Body,
  Controller,
  Delete,
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
import { NotificationsService } from './notifications.service';
import { MarkAsReadDto } from './dto/mark-as-read.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Controller({
  path: 'workspaces/:workspaceId/notifications',
  version: VERSION_NEUTRAL,
})
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() paginationQuery: PaginationQueryDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;

    return this.notificationsService.findAll(
      workspaceId,
      user.id,
      paginationQuery,
    );
  }

  @Delete(':id')
  remove(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;

    return this.notificationsService.remove(id, workspaceId, user.id);
  }

  @Post('mark-as-read')
  markAsRead(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() markAsReadDto: MarkAsReadDto,
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;

    return this.notificationsService.markAsRead(
      workspaceId,
      user.id,
      markAsReadDto,
    );
  }
}
