import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { AiService } from './ai.service';

interface CommentForSummary {
  content: string;
}

@Injectable()
export class CommentSummaryService {
  private readonly logger = new Logger(CommentSummaryService.name);

  constructor(private readonly aiService: AiService) {}

  async summarize(comments: CommentForSummary[]): Promise<string> {
    if (!comments.length) {
      return 'داده‌ای برای تحلیل وجود ندارد.';
    }

    const commentsText = comments
      .map((comment, index) => {
        return `${index + 1}. "${comment.content.trim()}"`;
      })
      .join('\n');

    const prompt = `تو تحلیل‌گر حرفه‌ای نظرات کاربران هستی.

متن نظرات:
"""
${commentsText}
"""

فقط بر اساس متن بالا، بدون اضافه کردن نظر شخصی، به فارسی و دقیقاً در این فرمت پاسخ بده:

• نکات مثبت:
  - مورد اول
  - مورد دوم
  (اگر نبود: موردی یافت نشد)

• نکات منفی:
  - مورد اول
  - مورد دوم
  (اگر نبود: موردی یافت نشد)

• احساس کلی:
  یک جمله کوتاه درباره رضایت کاربران
  (اگر مشخص نبود: غیرقابل تشخیص)`;

    try {
      const result = await this.aiService.generate(prompt);

      if (!result?.trim()) {
        throw new InternalServerErrorException(
          'AI service returned an empty response',
        );
      }

      return result.trim();
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      this.logger.error(
        'Failed to summarize comments',
        error instanceof Error ? error.stack : undefined,
      );

      throw new InternalServerErrorException('Failed to summarize comments');
    }
  }
}
