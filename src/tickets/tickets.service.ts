import { Inject, Injectable } from '@nestjs/common';

import { DATABASE, type DrizzleDB } from '../db/database.provider';
import { Ticket, tickets, ticketAttachments } from '../db/schema';
import { StorageService } from '../storage/storage.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { eq } from 'drizzle-orm';

const TICKET_ATTACHMENTS_PREFIX = 'tickets';

@Injectable()
export class TicketsService {
  constructor(
    @Inject(DATABASE) private readonly db: DrizzleDB,
    private readonly storageService: StorageService,
  ) {}

  async create(
    workspaceId: string,
    userId: string,
    createTicketDto: CreateTicketDto,
    files: Express.Multer.File[],
  ): Promise<Ticket> {
    const [ticket] = await this.db
      .insert(tickets)
      .values({
        ...createTicketDto,
        userId,
        workspaceId,
      })
      .returning();

    if (files.length > 0) {
      const uploaded = await Promise.all(
        files.map((file) =>
          this.storageService.uploadFile(
            'private',
            TICKET_ATTACHMENTS_PREFIX,
            file,
          ),
        ),
      );

      await this.db.insert(ticketAttachments).values(
        uploaded.map((file, index) => ({
          ticketId: ticket.id,
          fileName: files[index].originalname,
          filePath: file.key,
          fileSize: file.size,
        })),
      );
    }

    return ticket;
  }

  async getAttachmentDownloadUrls(
    ticketId: string,
  ): Promise<{ fileName: string; url: string }[]> {
    const attachments = await this.db.query.ticketAttachments.findMany({
      where: eq(ticketAttachments.ticketId, ticketId),
    });

    return Promise.all(
      attachments.map(async (attachment) => ({
        fileName: attachment.fileName,
        url: await this.storageService.getSignedDownloadUrl(
          attachment.filePath,
        ),
      })),
    );
  }
}
