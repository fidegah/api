import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { Request } from 'express';
import { DATABASE, type DrizzleDB } from '../../db/database.provider';
import { workspaces, type Workspace } from '../../db/schema';

export interface PortalRequest extends Request {
  workspace: Workspace;
}

@Injectable()
export class PortalWorkspaceGuard implements CanActivate {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<PortalRequest>();
    const subdomain = request.headers['x-subdomain'];

    if (!subdomain || typeof subdomain !== 'string') {
      throw new NotFoundException('Workspace not found');
    }

    const workspace = await this.db.query.workspaces.findFirst({
      where: eq(workspaces.subdomain, subdomain),
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    request.workspace = workspace;

    return true;
  }
}
