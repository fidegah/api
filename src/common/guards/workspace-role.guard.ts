import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { and, eq } from 'drizzle-orm';
import * as express from 'express';

import { DATABASE, type DrizzleDB } from '../../db/database.provider';
import { workspaceUsers } from '../../db/schema';
import { AuthenticatedUser } from '../../users/types/auth-user.type';
import { ROLES_KEY } from '../decorators/require-role.decorator';

@Injectable()
export class WorkspaceRoleGuard implements CanActivate {
  constructor(
    @Inject(DATABASE) private readonly db: DrizzleDB,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>(
      ROLES_KEY,
      context.getHandler(),
    );

    const request = context.switchToHttp().getRequest<express.Request>();
    const user = request.user as AuthenticatedUser;

    const workspaceIdParam = request.params.workspaceId || request.params.id;
    const workspaceId = Array.isArray(workspaceIdParam)
      ? workspaceIdParam[0]
      : workspaceIdParam;

    if (!workspaceId) {
      throw new ForbiddenException('Workspace ID is missing from the request');
    }

    const membership = await this.db.query.workspaceUsers.findFirst({
      where: and(
        eq(workspaceUsers.workspaceId, workspaceId),
        eq(workspaceUsers.userId, user.id),
      ),
    });

    if (!membership || membership.isBanned) {
      throw new ForbiddenException('You do not have access to this workspace');
    }

    if (
      requiredRoles &&
      requiredRoles.length > 0 &&
      !requiredRoles.includes(membership.role)
    ) {
      throw new ForbiddenException(
        `This action requires one of these roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
