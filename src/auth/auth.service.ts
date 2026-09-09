import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, randomBytes, randomInt } from 'crypto';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';

import { UsersService } from '../users/users.service';
import { AuthenticatedUser } from '../users/types/auth-user.type';
import { CreateUserDto } from '../users/dto/create-user.dto';

import {
  IAuthResponse,
  IEmailVerificationPayload,
  IRefreshTokenPayload,
  IMessageResponse,
  IForgotPasswordPayload,
} from './interfaces/auth-response.interface';

import { REDIS_CLIENT } from '../redis/redis.module';
import { MailService } from '../mail/mail.service';
import { AuthErrorCode } from './constants/auth-error-codes.constant';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly accessTokenExpiresIn = '15m';
  private readonly refreshTokenExpiresIn = '30d';
  private readonly refreshTokenTtl = 30 * 24 * 60 * 60;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  // OAuth One-Time Code

  async createOneTimeCode(tokens: IAuthResponse): Promise<string> {
    const code = randomBytes(32).toString('hex');
    await this.redis.set(
      `oauth-code:${code}`,
      JSON.stringify(tokens),
      'EX',
      60,
    );
    return code;
  }

  async exchangeOneTimeCode(code: string): Promise<IAuthResponse> {
    const key = `oauth-code:${code}`;
    const data = await this.redis.get(key);
    if (!data) {
      throw new UnauthorizedException('Invalid or expired code', {
        errorCode: AuthErrorCode.INVALID_ONE_TIME_CODE,
      });
    }
    await this.redis.del(key);
    return JSON.parse(data) as IAuthResponse;
  }

  // Register

  async register(registerDto: CreateUserDto): Promise<IMessageResponse> {
    const normalizedEmail = registerDto.email.trim().toLowerCase();

    const existingUser = await this.usersService.findByEmail(normalizedEmail);

    if (existingUser) {
      if (existingUser.deletedAt) {
        const daysSinceDeletion =
          (Date.now() - existingUser.deletedAt.getTime()) /
          (1000 * 60 * 60 * 24);

        if (daysSinceDeletion < 20) {
          throw new UnauthorizedException(
            'This email was recently deleted. Please try again later.',
            { errorCode: AuthErrorCode.EMAIL_RECENTLY_DELETED },
          );
        }

        await this.usersService.hardDeleteByEmail(normalizedEmail);

        const user = await this.usersService.create(registerDto);
        await this.sendEmailVerificationLink(user);

        return {
          message: `Verification link sent to ${user.email}`,
        };
      }

      if (existingUser.emailVerified) {
        throw new UnauthorizedException('Email is already registered', {
          errorCode: AuthErrorCode.EMAIL_ALREADY_REGISTERED,
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...authenticatedExistingUser } = existingUser;

      await this.sendEmailVerificationLink(authenticatedExistingUser);

      return {
        message: `Verification link sent to ${existingUser.email}`,
      };
    }

    const user = await this.usersService.create(registerDto);

    await this.sendEmailVerificationLink(user);

    return {
      message: `Verification link sent to ${user.email}`,
    };
  }

  // Email Verification

  async sendEmailVerificationLink(
    user: AuthenticatedUser,
  ): Promise<IMessageResponse> {
    const cooldownKey = `email-verification-cooldown:${user.email}`;

    const isOnCooldown = await this.redis.get(cooldownKey);

    if (isOnCooldown) {
      throw new HttpException(
        'Verification link already sent. Please wait before requesting another.',
        HttpStatus.TOO_MANY_REQUESTS,
        {
          errorCode: AuthErrorCode.EMAIL_VERIFICATION_RATE_LIMITED,
        },
      );
    }

    const payload: IEmailVerificationPayload = {
      userId: user.id,
      email: user.email,
      type: 'EMAIL_VERIFICATION',
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: '10m',
    });

    const appDomain = this.configService.getOrThrow<string>('app.domain');

    const verificationUrl = `https://${appDomain}/auth/verify-email?token=${encodeURIComponent(token)}`;

    await this.mailService.sendEmailVerificationLink(
      user.email,
      verificationUrl,
    );

    await this.redis.set(cooldownKey, '1', 'EX', 120);

    return {
      message: `Verification link sent to ${user.email}`,
    };
  }

  async verifyEmailVerificationToken(token: string): Promise<IMessageResponse> {
    let payload: IEmailVerificationPayload;

    try {
      payload = this.jwtService.verify<IEmailVerificationPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired verification link', {
        errorCode: AuthErrorCode.INVALID_VERIFICATION_LINK,
      });
    }

    if (payload.type !== 'EMAIL_VERIFICATION') {
      throw new UnauthorizedException('Invalid verification link', {
        errorCode: AuthErrorCode.INVALID_VERIFICATION_LINK,
      });
    }

    await this.usersService.verifyEmail(payload.userId);

    return {
      message: 'Email verified successfully',
    };
  }

  // Password Login

  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser> {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user?.password) {
      throw new UnauthorizedException('Invalid email or password', {
        errorCode: AuthErrorCode.INVALID_CREDENTIALS,
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password', {
        errorCode: AuthErrorCode.INVALID_CREDENTIALS,
      });
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email first', {
        errorCode: AuthErrorCode.EMAIL_NOT_VERIFIED,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...authenticatedUser } = user;

    return authenticatedUser;
  }

  async login(user: AuthenticatedUser): Promise<IAuthResponse> {
    return this.generateAuthTokens(user);
  }

  // Google Login

  async loginWithGoogle(googleUser: {
    email: string;
    fullName: string;
    avatarUrl: string;
  }): Promise<IAuthResponse> {
    let user = await this.usersService.findByEmail(googleUser.email);

    if (!user) {
      user = await this.usersService.createFromOAuth({
        email: googleUser.email,
        fullName: googleUser.fullName,
        avatarUrl: googleUser.avatarUrl,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, deletedAt, ...authenticatedUser } = user;

    return this.generateAuthTokens(authenticatedUser);
  }

  // OTP

  private generateOtp(): string {
    return randomInt(100000, 1000000).toString();
  }

  private hashOtp(email: string, code: string): string {
    const secret = this.configService.getOrThrow<string>('otp.secret');

    return createHmac('sha256', secret)
      .update(`${email}:${code}`)
      .digest('hex');
  }

  async sendOtp(email: string): Promise<IMessageResponse> {
    const normalizedEmail = email.trim().toLowerCase();

    const otpKey = `otp:${normalizedEmail}`;

    const existingOtp = await this.redis.get(otpKey);

    if (existingOtp) {
      throw new HttpException(
        'OTP already sent. Please wait before requesting another.',
        HttpStatus.TOO_MANY_REQUESTS,
        {
          errorCode: AuthErrorCode.OTP_RATE_LIMITED,
        },
      );
    }

    const code = this.generateOtp();
    const otpHash = this.hashOtp(normalizedEmail, code);

    await this.redis.set(`otp:${normalizedEmail}`, otpHash, 'EX', 120);

    const isDevelopment =
      this.configService.get<string>('NODE_ENV') === 'development';

    if (isDevelopment) {
      this.logger.log(`[DEV OTP] Code for ${normalizedEmail}: ${code}`);
    } else {
      await this.mailService.sendOtp(normalizedEmail, code);
    }

    return {
      message: 'OTP sent successfully',
    };
  }

  async verifyOtp(email: string, code: string): Promise<IAuthResponse> {
    const normalizedEmail = email.trim().toLowerCase();

    const storedHash = await this.redis.get(`otp:${normalizedEmail}`);

    if (!storedHash) {
      throw new UnauthorizedException('OTP is invalid or expired', {
        errorCode: AuthErrorCode.OTP_INVALID,
      });
    }

    const inputHash = this.hashOtp(normalizedEmail, code);

    if (inputHash !== storedHash) {
      throw new UnauthorizedException('OTP is invalid or expired', {
        errorCode: AuthErrorCode.OTP_INVALID,
      });
    }

    await this.redis.del(`otp:${normalizedEmail}`);

    let user = await this.usersService.findByEmail(normalizedEmail);

    if (!user) {
      user = await this.usersService.createFromOtp(normalizedEmail);
    } else if (!user.emailVerified) {
      await this.usersService.verifyEmail(user.id);
      user.emailVerified = true;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, deletedAt, ...authenticatedUser } = user;

    return this.generateAuthTokens(authenticatedUser);
  }

  // Forgot Password

  async sendForgotPasswordLink(email: string): Promise<IMessageResponse> {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user) {
      return {
        message: `If an account exists with ${normalizedEmail}, a reset link has been sent.`,
      };
    }

    const cooldownKey = `forgot-password-cooldown:${normalizedEmail}`;

    const isOnCooldown = await this.redis.get(cooldownKey);

    if (isOnCooldown) {
      throw new HttpException(
        'Reset link already sent. Please wait before requesting another.',
        HttpStatus.TOO_MANY_REQUESTS,
        {
          errorCode: AuthErrorCode.RESET_PASSWORD_RATE_LIMITED,
        },
      );
    }

    const payload: IForgotPasswordPayload = {
      userId: user.id,
      email: user.email,
      type: 'FORGOT_PASSWORD',
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: '10m',
    });

    const appDomain = this.configService.getOrThrow<string>('app.domain');

    const resetUrl = `https://${appDomain}/auth/reset-password?token=${encodeURIComponent(token)}`;

    await this.mailService.sendForgotPasswordLink(user.email, resetUrl);

    await this.redis.set(cooldownKey, '1', 'EX', 120);

    return {
      message: `If an account exists with ${normalizedEmail}, a reset link has been sent.`,
    };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<IMessageResponse> {
    let payload: IForgotPasswordPayload;

    try {
      payload = this.jwtService.verify<IForgotPasswordPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired reset link', {
        errorCode: AuthErrorCode.INVALID_RESET_LINK,
      });
    }

    if (payload.type !== 'FORGOT_PASSWORD') {
      throw new UnauthorizedException('Invalid reset link', {
        errorCode: AuthErrorCode.INVALID_RESET_LINK,
      });
    }

    await this.usersService.updatePassword(payload.userId, newPassword);

    await this.redis.del(`refresh-token:${payload.userId}`);

    return {
      message: 'Password reset successfully',
    };
  }

  // Access Token

  private generateAccessToken(user: AuthenticatedUser): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
      },
      {
        expiresIn: this.accessTokenExpiresIn,
      },
    );
  }

  // Refresh Token

  private generateRefreshToken(user: AuthenticatedUser): string {
    const payload: IRefreshTokenPayload = {
      sub: user.id,
      email: user.email,
      type: 'REFRESH',
    };

    return this.jwtService.sign(payload, {
      expiresIn: this.refreshTokenExpiresIn,
    });
  }

  private hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  private async saveRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const tokenHash = this.hashRefreshToken(refreshToken);

    await this.redis.set(
      `refresh-token:${userId}`,
      tokenHash,
      'EX',
      this.refreshTokenTtl,
    );
  }

  // Generate Auth Tokens

  private async generateAuthTokens(
    user: AuthenticatedUser,
  ): Promise<IAuthResponse> {
    const accessToken = this.generateAccessToken(user);

    const refreshToken = this.generateRefreshToken(user);

    await this.saveRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  // Refresh

  async refresh(refreshToken: string): Promise<IAuthResponse> {
    let payload: IRefreshTokenPayload;

    try {
      payload = this.jwtService.verify<IRefreshTokenPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token', {
        errorCode: AuthErrorCode.INVALID_REFRESH_TOKEN,
      });
    }

    if (payload.type !== 'REFRESH') {
      throw new UnauthorizedException('Invalid refresh token', {
        errorCode: AuthErrorCode.INVALID_REFRESH_TOKEN,
      });
    }

    const storedHash = await this.redis.get(`refresh-token:${payload.sub}`);

    if (!storedHash) {
      throw new UnauthorizedException('Refresh token is invalid or revoked', {
        errorCode: AuthErrorCode.REFRESH_TOKEN_REVOKED,
      });
    }

    const incomingHash = this.hashRefreshToken(refreshToken);

    if (incomingHash !== storedHash) {
      throw new UnauthorizedException('Refresh token is invalid or revoked', {
        errorCode: AuthErrorCode.REFRESH_TOKEN_REVOKED,
      });
    }

    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found', {
        errorCode: AuthErrorCode.INVALID_CREDENTIALS,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...authenticatedUser } = user;

    // Refresh Token Rotation
    await this.redis.del(`refresh-token:${user.id}`);

    return this.generateAuthTokens(authenticatedUser);
  }

  // Logout

  async logout(refreshToken: string): Promise<IMessageResponse> {
    let payload: IRefreshTokenPayload;

    try {
      payload = this.jwtService.verify<IRefreshTokenPayload>(refreshToken);
    } catch {
      return {
        message: 'Logged out successfully',
      };
    }

    if (payload.type !== 'REFRESH') {
      return {
        message: 'Logged out successfully',
      };
    }

    await this.redis.del(`refresh-token:${payload.sub}`);

    return {
      message: 'Logged out successfully',
    };
  }
}
