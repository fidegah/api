import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type {
  SdkSessionContext,
  SdkSessionRequest,
} from '../interfaces/sdk-request.interface';

export const CurrentSdkSession = createParamDecorator(
  (_data: void, ctx: ExecutionContext): SdkSessionContext => {
    const request = ctx.switchToHttp().getRequest<SdkSessionRequest>();
    return request.sdkSession!;
  },
);
