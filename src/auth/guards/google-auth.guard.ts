import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

interface CustomGoogleState {
  redirectTo?: string;
}

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const rawRedirectTo = req.query?.redirectTo;

    const redirectTo = typeof rawRedirectTo === 'string' ? rawRedirectTo : '/';

    const statePayload: CustomGoogleState = { redirectTo };

    return {
      state: JSON.stringify(statePayload),
    };
  }
}
