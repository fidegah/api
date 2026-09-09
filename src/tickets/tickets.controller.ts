import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../users/types/auth-user.type';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ticketAttachmentsMulterOptions } from './config/multer.config';
import { MAX_TICKET_ATTACHMENTS } from './constants/ticket-attachment.constant';
import { WorkspaceRoleGuard } from '../common/guards/workspace-role.guard';

@Controller({
  path: 'workspaces/:workspaceId/tickets',
  version: VERSION_NEUTRAL,
})
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @UseGuards(WorkspaceRoleGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseInterceptors(
    FilesInterceptor(
      'attachments',
      MAX_TICKET_ATTACHMENTS,
      ticketAttachmentsMulterOptions,
    ),
  )
  async create(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() createTicketDto: CreateTicketDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
    @Req() req: Request,
  ) {
    const user = req.user as AuthenticatedUser;
    return this.ticketsService.create(
      workspaceId,
      user.id,
      createTicketDto,
      files,
    );
  }
}
