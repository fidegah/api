import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { Request } from 'express';
import { DATABASE, type DrizzleDB } from '../../db/database.provider';
import { workspaces, type Workspace } from '../../db/schema';

export interface SdkRequest extends Request {
  workspace: Workspace;
}

@Injectable()
export class SdkGuard implements CanActivate {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<SdkRequest>();
    const sdkToken = request.headers['x-sdk-token'];

    console.log('sdkToken', sdkToken);

    if (!sdkToken || Array.isArray(sdkToken)) {
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
