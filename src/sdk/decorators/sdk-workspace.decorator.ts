import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Workspace } from '../../db/schema';
import type { SdkRequest } from '../guards/sdk.guard';

export const CurrentSdkWorkspace = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Workspace => {
    const request = ctx.switchToHttp().getRequest<SdkRequest>();
    return request.workspace;
  },
);
