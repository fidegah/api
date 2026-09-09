import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { Workspace } from '../../db/schema';

export const CurrentWorkspace = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Workspace => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { workspace: Workspace }>();
    return request.workspace;
  },
);
