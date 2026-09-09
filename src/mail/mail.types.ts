export interface EmailVerificationJobData {
  type: 'email-verification';
  data: {
    email: string;
    verificationUrl: string;
  };
}

export interface OtpJobData {
  type: 'send-otp';
  data: {
    email: string;
    code: string;
  };
}

export interface ForgotPasswordJobData {
  type: 'forgot-password';
  data: {
    email: string;
    resetUrl: string;
  };
}

export type MailJobData =
  EmailVerificationJobData | OtpJobData | ForgotPasswordJobData;
