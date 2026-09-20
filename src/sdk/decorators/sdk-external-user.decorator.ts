import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SdkSessionRequest } from '../interfaces/sdk-request.interface';

export const SdkExternalUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest<Partial<SdkSessionRequest>>();

    return request.sdkSession?.externalUserId ?? null;
  },
);
