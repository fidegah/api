import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { createTransport, Transporter } from 'nodemailer';

@Injectable()
export class MailHealthIndicator {
  private readonly transporter: Transporter;

  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly configService: ConfigService,
  ) {
    this.transporter = createTransport({
      host: this.configService.getOrThrow<string>('mail.host'),
      port: this.configService.getOrThrow<number>('mail.port'),
      auth: {
        user: this.configService.getOrThrow<string>('mail.user'),
        pass: this.configService.getOrThrow<string>('mail.pass'),
      },
    });
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    try {
      await this.transporter.verify();
      return indicator.up();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Mail connection failed';
      return indicator.down({ message: errorMessage });
    }
  }
}
