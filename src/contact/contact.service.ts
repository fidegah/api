import { Inject, Injectable } from '@nestjs/common';

import { DATABASE, type DrizzleDB } from '../db/database.provider';
import { ContactMessage, contactMessages } from '../db/schema';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

@Injectable()
export class ContactService {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  async create(
    createContactMessageDto: CreateContactMessageDto,
  ): Promise<ContactMessage> {
    const [message] = await this.db
      .insert(contactMessages)
      .values(createContactMessageDto)
      .returning();

    return message;
  }
}
