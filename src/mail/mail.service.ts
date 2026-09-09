import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { MailJobData } from './mail.types';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    @InjectQueue('mail') private readonly mailQueue: Queue<MailJobData>,
  ) {}

  async sendEmailVerificationLink(
    email: string,
    verificationUrl: string,
  ): Promise<void> {
    await this.mailQueue.add(
      'send-email-verification',
      {
        type: 'email-verification',
        data: { email, verificationUrl },
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );

    this.logger.log(`Email verification job queued for ${email}`);
  }

  async sendOtp(email: string, code: string): Promise<void> {
    await this.mailQueue.add(
      'send-otp',
      {
        type: 'send-otp',
        data: { email, code },
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );

    this.logger.log(`OTP email job queued for ${email}`);
  }

  async sendForgotPasswordLink(email: string, resetUrl: string): Promise<void> {
    await this.mailQueue.add(
      'send-forgot-password',
      {
        type: 'forgot-password',
        data: { email, resetUrl },
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );

    this.logger.log(`Forgot password job queued for ${email}`);
  }
}
