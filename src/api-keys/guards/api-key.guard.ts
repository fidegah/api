import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { ApiKeysService } from '../api-keys.service';
import { Workspace } from '../../db/schema';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { workspace: Workspace; apiKeyUserId: string }>();

    const apiKey = request.headers['x-api-key'];

    if (!apiKey || typeof apiKey !== 'string') {
      throw new UnauthorizedException('API key is required');
    }

    const { workspace, userId } =
      await this.apiKeysService.validateApiKey(apiKey);

    request.workspace = workspace;
    request.apiKeyUserId = userId;

    return true;
  }
}
