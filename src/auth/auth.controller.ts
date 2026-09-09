import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

import { AuthenticatedUser } from '../users/types/auth-user.type';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { ConfigService } from '@nestjs/config';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Throttle({
    default: {
      limit: 10,
      ttl: 60_000, // 1 minute
    },
  })
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const googleUser = req.user as {
      email: string;
      fullName: string;
      avatarUrl: string;
    };
    const tokens = await this.authService.loginWithGoogle(googleUser);
    const code = await this.authService.createOneTimeCode(tokens);

    let redirectTo = '/';
    if (typeof req.query.state === 'string') {
      try {
        const parsedState = JSON.parse(req.query.state) as {
          redirectTo?: string;
        };
        if (parsedState.redirectTo) {
          redirectTo = parsedState.redirectTo;
        }
      } catch (error) {
        this.logger.warn(
          `Failed to parse Google OAuth state: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    const frontendDomain = this.configService.getOrThrow<string>('app.domain');

    const redirectUrl = new URL(`https://${frontendDomain}/auth/callback`);
    redirectUrl.searchParams.append('code', code);
    redirectUrl.searchParams.append('redirectTo', redirectTo);

    return res.redirect(redirectUrl.toString());
  }

  @Post('exchange-code')
  async exchangeCode(@Body('code') code: string) {
    return this.authService.exchangeOneTimeCode(code);
  }

  @Post('register')
  register(@Body() registerDto: CreateUserDto) {
    return this.authService.register(registerDto);
  }

  @Get('verify-email')
  verifyEmail(@Query() query: VerifyEmailDto) {
    return this.authService.verifyEmailVerificationToken(query.token);
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  login(@Body() _loginDto: LoginDto, @Req() req: Request) {
    return this.authService.login(req.user as AuthenticatedUser);
  }

  @Post('send-otp')
  sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.sendOtp(sendOtpDto.email);
  }

  @Post('verify-otp')
  verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto.email, verifyOtpDto.code);
  }

  @Post('refresh')
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  logout(@Body() refreshTokenDt: RefreshTokenDto) {
    return this.authService.logout(refreshTokenDt.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request) {
    return req.user;
  }

  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.sendForgotPasswordLink(forgotPasswordDto.email);
  }

  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }
}
