import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';

export const Subdomain = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const subdomain = request.headers['x-subdomain'];

    if (!subdomain || typeof subdomain !== 'string') {
      throw new BadRequestException('x-subdomain header is required');
    }

    return subdomain;
  },
);
