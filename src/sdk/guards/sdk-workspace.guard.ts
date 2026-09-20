import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE, type DrizzleDB } from '../../db/database.provider';
import { workspaces } from '../../db/schema';
import { SdkSessionRequest } from '../interfaces/sdk-request.interface';

@Injectable()
export class SdkWorkspaceGuard implements CanActivate {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<SdkSessionRequest>();
    const raw = request.headers['x-sdk-token'];
    const sdkToken = Array.isArray(raw) ? raw[0] : raw;

    if (!sdkToken?.trim()) {
      throw new UnauthorizedException('SDK token is missing or invalid');
    }

    const workspace = await this.db.query.workspaces.findFirst({
      where: eq(workspaces.sdkToken, sdkToken),
    });

    if (!workspace) {
      throw new UnauthorizedException('Invalid SDK token');
    }

    request.workspace = workspace;
    return true;
  }
}
