import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { SdkSessionRequest } from '../interfaces/sdk-request.interface';
import { DATABASE, type DrizzleDB } from '../../db/database.provider';
import { deviceSessions, externalUsers } from '../../db/schema';

@Injectable()
export class SdkSessionGuard implements CanActivate {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<SdkSessionRequest>();
    const raw = request.headers['x-sdk-session-id'];
    const sessionId = Array.isArray(raw) ? raw[0] : raw;

    if (!sessionId?.trim()) {
      throw new UnauthorizedException('Session ID is missing');
    }
    if (!request.workspace?.id) {
      throw new UnauthorizedException('Workspace context is missing');
    }
    const workspaceId = request.workspace.id;

    // ۱) سشن باید قبلاً با init-session ساخته شده باشه
    const session = await this.db.query.deviceSessions.findFirst({
      where: and(
        eq(deviceSessions.sessionId, sessionId),
        eq(deviceSessions.workspaceId, workspaceId),
      ),
    });

    if (!session) {
      throw new UnauthorizedException(
        'Unknown session, call init-session first',
      );
    }

    let externalUserId = session.externalUserId;

    if (!externalUserId) {
      const anonExternalId = `anon:${sessionId}`;

      let anon = await this.db.query.externalUsers.findFirst({
        where: and(
          eq(externalUsers.workspaceId, workspaceId),
          eq(externalUsers.externalId, anonExternalId),
        ),
      });

      if (!anon) {
        [anon] = await this.db
          .insert(externalUsers)
          .values({ workspaceId, externalId: anonExternalId })
          .returning();
      }

      externalUserId = anon.id;

      await this.db
        .update(deviceSessions)
        .set({ externalUserId })
        .where(eq(deviceSessions.id, session.id));
    }

    const user = await this.db.query.externalUsers.findFirst({
      where: eq(externalUsers.id, externalUserId),
    });
    if (!user || user.isBanned) {
      throw new ForbiddenException('User is banned');
    }

    request.sdkSession = { id: sessionId, externalUserId };
    return true;
  }
}
