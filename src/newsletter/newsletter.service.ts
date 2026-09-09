import { ConflictException, Inject, Injectable } from '@nestjs/common';

import { DATABASE, type DrizzleDB } from '../db/database.provider';
import { newsletterSubscribers } from '../db/schema';
import { SubscribeNewsletterDto } from './dto/subscribe-newsletter.dto';
import { isUniqueViolation } from '../common/utils/is-unique-violation.util';
import { NewsletterErrorCode } from './constants/newsletter-error-codes.constant';

@Injectable()
export class NewsletterService {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  async subscribe(
    subscribeNewsletterDto: SubscribeNewsletterDto,
  ): Promise<{ message: string }> {
    const normalizedEmail = subscribeNewsletterDto.email.trim().toLowerCase();

    try {
      await this.db
        .insert(newsletterSubscribers)
        .values({ email: normalizedEmail });
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        throw new ConflictException({
          message: 'This email is already subscribed',
          errorCode: NewsletterErrorCode.EMAIL_ALREADY_SUBSCRIBED,
        });
      }
      throw error;
    }

    return { message: 'Subscribed to newsletter successfully' };
  }
}
