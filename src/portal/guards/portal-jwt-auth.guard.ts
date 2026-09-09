import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { IS_PORTAL_AUTH_REQUIRED_KEY } from '../decorators/require-portal-auth.decorator';

interface JwtPayload {
  sub: string;
}

interface RequestWithUser extends Request {
  user?: {
    id: string;
  };
}

@Injectable()
export class PortalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAuthRequired = this.reflector.getAllAndOverride<boolean>(
      IS_PORTAL_AUTH_REQUIRED_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractTokenFromHeader(request);

    if (token) {
      try {
        const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
        request.user = { id: payload.sub };
        return true;
      } catch {
        if (isAuthRequired) {
          throw new UnauthorizedException('Invalid or expired token');
        }
      }
    }

    if (isAuthRequired && !request.user) {
      throw new UnauthorizedException('Portal user authentication required');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
