import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const SdkExternalUserId = createParamDecorator(
  (_data: never, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const sessionId = request.headers['x-sdk-session-id'];

    if (!sessionId) return null;

    return Array.isArray(sessionId) ? sessionId[0] : sessionId;
  },
);
