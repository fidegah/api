import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { PortalRequest } from '../guards/portal-workspace.guard';

export const CurrentPortalWorkspace = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<PortalRequest>();
    return request.workspace;
  },
);
