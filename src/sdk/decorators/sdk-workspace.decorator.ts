import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Workspace } from '../../db/schema';
import type { SdkSessionRequest } from '../interfaces/sdk-request.interface';

export const CurrentSdkWorkspace = createParamDecorator(
  (_data: void, ctx: ExecutionContext): Workspace => {
    const request = ctx.switchToHttp().getRequest<SdkSessionRequest>();
    return request.workspace!;
  },
);
