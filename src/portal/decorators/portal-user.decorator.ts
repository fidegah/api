import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

interface RequestWithUser extends Request {
  user?: {
    id: string;
  };
}

export const OptionalPortalUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();

    if (request.user && typeof request.user.id === 'string') {
      return request.user.id;
    }

    return null;
  },
);

export const CurrentPortalUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();

    if (request.user && typeof request.user.id === 'string') {
      return request.user.id;
    }

    throw new UnauthorizedException('Portal user authentication required');
  },
);
