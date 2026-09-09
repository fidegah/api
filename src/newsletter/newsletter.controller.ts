import { Body, Controller, Post, VERSION_NEUTRAL } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { NewsletterService } from './newsletter.service';
import { SubscribeNewsletterDto } from './dto/subscribe-newsletter.dto';

@Controller({ path: 'newsletter', version: VERSION_NEUTRAL })
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('subscribe')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  subscribe(@Body() subscribeNewsletterDto: SubscribeNewsletterDto) {
    return this.newsletterService.subscribe(subscribeNewsletterDto);
  }
}
