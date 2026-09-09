import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface AiResponse {
  response?: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiUrl: string;
  private readonly timeoutMs = 30_000;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.getOrThrow<string>('ai.serviceUrl');
  }

  async generate(prompt: string): Promise<string> {
    const controller = new AbortController();

    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();

        this.logger.error(
          `AI service returned ${response.status}: ${errorBody}`,
        );

        throw new ServiceUnavailableException('AI service is unavailable');
      }

      const data = (await response.json()) as AiResponse;

      if (!data.response) {
        this.logger.error('AI service returned an invalid response');

        throw new ServiceUnavailableException(
          'Invalid response from AI service',
        );
      }

      return data.response.trim();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        this.logger.error('AI service timeout');

        throw new ServiceUnavailableException('AI service timeout');
      }

      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      this.logger.error(
        'AI service call failed',
        error instanceof Error ? error.stack : undefined,
      );

      throw new ServiceUnavailableException('AI service is unavailable');
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
