import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';

import { CurrentUserId } from '../auth/decorators/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceRoleGuard } from '../common/guards/workspace-role.guard';
import { ticketAttachmentsMulterOptions } from './config/multer.config';
import { MAX_TICKET_ATTACHMENTS } from './constants/ticket-attachment.constant';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketsService } from './tickets.service';

@Controller({
  path: 'workspaces/:workspaceId/tickets',
  version: VERSION_NEUTRAL,
})
@UseGuards(JwtAuthGuard, WorkspaceRoleGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseInterceptors(
    FilesInterceptor(
      'attachments',
      MAX_TICKET_ATTACHMENTS,
      ticketAttachmentsMulterOptions,
    ),
  )
  create(
    @CurrentUserId() userId: string,
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() createTicketDto: CreateTicketDto,
    @UploadedFiles() files: Array<Express.Multer.File> = [],
  ) {
    return this.ticketsService.create(
      workspaceId,
      userId,
      createTicketDto,
      files,
    );
  }
}
