import { Injectable, Logger } from '@nestjs/common';
import { AiService } from './ai.service';

@Injectable()
export class SpamCheckService {
  private readonly logger = new Logger(SpamCheckService.name);

  constructor(private readonly aiService: AiService) {}

  async isSpam(message: string): Promise<boolean> {
    const prompt = `
شما یک سیستم تشخیص اسپم هستید. پیام کاربر را بررسی کنید و فقط true یا false بازگردانید.
اسپم شامل: تبلیغات، لینک، متن بی‌معنی یا تکراری، پیام نامرتبط با محصول، یا کلاهبرداری است.
پیام: """${message}"""
    `;

    try {
      const result = await this.aiService.generate(prompt);
      return result.trim().toLowerCase() === 'true';
    } catch (error) {
      this.logger.error(
        'Spam check failed, defaulting to not-spam',
        error instanceof Error ? error.stack : undefined,
      );
      return false;
    }
  }
}
