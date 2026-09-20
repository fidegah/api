import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  VERSION_NEUTRAL,
} from '@nestjs/common';

import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { MarkAsReadDto } from './dto/mark-as-read.dto';
import { NotificationsService } from './notifications.service';

@Controller({
  path: 'workspaces/:workspaceId/notifications',
  version: VERSION_NEUTRAL,
})
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @CurrentUserId() userId: string,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    return this.notificationsService.findAll(
      workspaceId,
      userId,
      paginationQuery,
    );
  }

  @Post('mark-as-read')
  markAsRead(
    @CurrentUserId() userId: string,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() markAsReadDto: MarkAsReadDto,
  ) {
    return this.notificationsService.markAsRead(
      workspaceId,
      userId,
      markAsReadDto,
    );
  }

  @Delete(':id')
  remove(
    @CurrentUserId() userId: string,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationsService.remove(id, workspaceId, userId);
  }
}
