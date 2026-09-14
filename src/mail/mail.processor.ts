import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MailerService } from '@nestjs-modules/mailer';
import { MailJobData } from './mail.types';
import { ConfigService } from '@nestjs/config';

@Processor('mail', { drainDelay: 30, stalledInterval: 300000 })
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);
  private readonly isDevelopment: boolean;
  private readonly siteUrl: string;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    super();
    this.isDevelopment =
      this.configService.get<string>('NODE_ENV') === 'development';
    this.siteUrl = `https://${this.configService.getOrThrow('app.domain')}`;
  }

  async process(job: Job<MailJobData>): Promise<void> {
    const { type, data } = job.data;

    if (this.isDevelopment) {
      this.logger.log(
        `[DEV MAIL LOG] Job: ${type} | Payload: ${JSON.stringify(data)}`,
      );
      return;
    }

    switch (type) {
      case 'email-verification': {
        const { email, verificationUrl } = data;
        await this.mailerService.sendMail({
          to: email,
          subject: 'تایید حساب کاربری',
          template: 'email-verification-link',
          context: {
            email,
            verificationUrl,
            siteUrl: this.siteUrl,
          },
        });
        this.logger.log(`Email verification link sent to ${email}`);
        break;
      }

      case 'send-otp': {
        const { email, code } = data;
        await this.mailerService.sendMail({
          to: email,
          subject: 'کد تایید ورود',
          template: 'otp',
          context: {
            code,
            expiresIn: 2,
            siteUrl: this.siteUrl,
          },
        });
        this.logger.log(`OTP email sent successfully to ${email}`);
        break;
      }

      case 'forgot-password': {
        const { email, resetUrl } = data;
        await this.mailerService.sendMail({
          to: email,
          subject: 'بازیابی رمز عبور',
          template: 'forgot-password',
          context: {
            email,
            resetUrl,
            siteUrl: this.siteUrl,
          },
        });
        this.logger.log(`Forgot password email sent to ${email}`);
        break;
      }

      default: {
        this.logger.warn('Unhandled mail job type');
      }
    }
  }
}
