export interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface IMessageResponse {
  message: string;
}

export interface IEmailVerificationPayload {
  userId: string;
  email: string;
  type: 'EMAIL_VERIFICATION';
}

export interface IRefreshTokenPayload {
  sub: string;
  email: string;
  type: 'REFRESH';
}

export interface IForgotPasswordPayload {
  userId: string;
  email: string;
  type: 'FORGOT_PASSWORD';
}
