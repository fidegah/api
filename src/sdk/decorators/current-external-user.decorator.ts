import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface SdkRequest extends Request {
  externalUserId?: string;
}

export const CurrentExternalUserId = createParamDecorator(
  (_data: never, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest<SdkRequest>();

    return request.externalUserId || null;
  },
);
