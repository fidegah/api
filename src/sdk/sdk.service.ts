import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DATABASE, type DrizzleDB } from '../db/database.provider';
import {
  commentLikes,
  deviceSessions,
  externalUsers,
  type ExternalUser,
  postComments,
  posts,
  postVotes,
  workspaces,
} from '../db/schema';
import { IdentifyDto } from './dto/identify.dto';
import { InitSessionDto } from './dto/init-session.dto';
import { verifyVerificationToken } from './utils/secure-identify.util';

export const ANON_PREFIX = 'anon:';

@Injectable()
export class SdkService {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  async findExternalUserById(id: string): Promise<ExternalUser> {
    const user = await this.db.query.externalUsers.findFirst({
      where: eq(externalUsers.id, id),
    });

    if (!user) {
      throw new NotFoundException('External user not found');
    }

    return user;
  }

  async initSession(dto: InitSessionDto) {
    const workspace = await this.db.query.workspaces.findFirst({
      where: eq(workspaces.sdkToken, dto.sdkToken),
    });

    if (!workspace) {
      throw new UnauthorizedException('Invalid SDK token');
    }

    const existingSession = await this.db.query.deviceSessions.findFirst({
      where: and(
        eq(deviceSessions.sessionId, dto.device.sessionId),
        eq(deviceSessions.workspaceId, workspace.id),
      ),
    });

    if (existingSession) {
      await this.db
        .update(deviceSessions)
        .set({
          currentUrl: dto.device.currentUrl ?? existingSession.currentUrl,
          ipAddress: dto.device.ipAddress ?? existingSession.ipAddress,
        })
        .where(eq(deviceSessions.id, existingSession.id));
    } else {
      await this.db.insert(deviceSessions).values({
        workspaceId: workspace.id,
        sessionId: dto.device.sessionId,
        browserName: dto.device.browserName ?? null,
        osName: dto.device.osName ?? null,
        deviceModel: dto.device.deviceModel ?? null,
        engineName: dto.device.engineName ?? null,
        ipAddress: dto.device.ipAddress ?? null,
        currentUrl: dto.device.currentUrl ?? null,
      });
    }

    return {
      subdomain: workspace.subdomain,
      sessionId: dto.device.sessionId,
    };
  }

  async identify(dto: IdentifyDto): Promise<ExternalUser> {
    const workspace = await this.db.query.workspaces.findFirst({
      where: eq(workspaces.sdkToken, dto.sdkToken),
    });

    if (!workspace) {
      throw new UnauthorizedException('Invalid SDK token');
    }

    if (dto.user.id.startsWith(ANON_PREFIX)) {
      throw new BadRequestException('Invalid user id');
    }

    if (workspace.enforceSecureIdentify) {
      if (!dto.verificationToken) {
        throw new BadRequestException(
          'Verification token is required for this workspace',
        );
      }

      if (!workspace.secretKey) {
        throw new BadRequestException('Workspace secret key is not configured');
      }

      const isValid = verifyVerificationToken(
        dto.user.id,
        dto.verificationToken,
        workspace.secretKey,
      );

      if (!isValid) {
        throw new UnauthorizedException('Invalid verification token');
      }
    }

    return this.db.transaction(async (tx) => {
      const session = await tx.query.deviceSessions.findFirst({
        where: and(
          eq(deviceSessions.sessionId, dto.sessionId),
          eq(deviceSessions.workspaceId, workspace.id),
        ),
      });

      if (!session) {
        throw new NotFoundException(
          'Session not found, call init-session first',
        );
      }

      const patch: Partial<ExternalUser> = {};
      if (dto.user.fullName !== undefined) patch.fullName = dto.user.fullName;
      if (dto.user.email !== undefined) patch.email = dto.user.email;
      if (dto.user.avatarUrl !== undefined)
        patch.avatarUrl = dto.user.avatarUrl;

      let externalUser = await tx.query.externalUsers.findFirst({
        where: and(
          eq(externalUsers.workspaceId, workspace.id),
          eq(externalUsers.externalId, dto.user.id),
        ),
      });

      if (externalUser) {
        if (Object.keys(patch).length > 0) {
          const [updated] = await tx
            .update(externalUsers)
            .set(patch)
            .where(eq(externalUsers.id, externalUser.id))
            .returning();
          externalUser = updated;
        }
      } else {
        const [created] = await tx
          .insert(externalUsers)
          .values({
            workspaceId: workspace.id,
            externalId: dto.user.id,
            fullName: dto.user.fullName ?? null,
            email: dto.user.email ?? null,
            avatarUrl: dto.user.avatarUrl ?? null,
          })
          .returning();

        if (!created) {
          throw new BadRequestException('Failed to create external user');
        }
        externalUser = created;
      }

      if (externalUser.isBanned) {
        throw new ForbiddenException('User is banned');
      }

      const anonId = session.externalUserId;

      if (anonId && anonId !== externalUser.id) {
        const anon = await tx.query.externalUsers.findFirst({
          where: eq(externalUsers.id, anonId),
        });

        if (anon && anon.externalId.startsWith(ANON_PREFIX)) {
          // رای‌های تکراری را حذف کن تا unique نترکد
          await tx.execute(sql`
            DELETE FROM post_votes v
            WHERE v.external_user_id = ${anon.id}
              AND EXISTS (
                SELECT 1 FROM post_votes v2
                WHERE v2.post_id = v.post_id
                  AND v2.external_user_id = ${externalUser.id}
              )
          `);

          await tx
            .update(postVotes)
            .set({ externalUserId: externalUser.id })
            .where(eq(postVotes.externalUserId, anon.id));

          await tx.execute(sql`
            DELETE FROM comment_likes l
            WHERE l.external_user_id = ${anon.id}
              AND EXISTS (
                SELECT 1 FROM comment_likes l2
                WHERE l2.comment_id = l.comment_id
                  AND l2.external_user_id = ${externalUser.id}
              )
          `);

          await tx
            .update(commentLikes)
            .set({ externalUserId: externalUser.id })
            .where(eq(commentLikes.externalUserId, anon.id));

          await tx
            .update(posts)
            .set({ externalUserId: externalUser.id })
            .where(eq(posts.externalUserId, anon.id));

          await tx
            .update(postComments)
            .set({ externalUserId: externalUser.id })
            .where(eq(postComments.externalUserId, anon.id));

          await tx
            .update(deviceSessions)
            .set({ externalUserId: externalUser.id })
            .where(eq(deviceSessions.externalUserId, anon.id));

          await tx.delete(externalUsers).where(eq(externalUsers.id, anon.id));
        }
      }

      await tx
        .update(deviceSessions)
        .set({ externalUserId: externalUser.id })
        .where(eq(deviceSessions.id, session.id));

      return externalUser;
    });
  }

  async findExternalUserBySession(
    workspaceId: string,
    sessionId: string,
  ): Promise<ExternalUser | null> {
    const session = await this.db.query.deviceSessions.findFirst({
      where: and(
        eq(deviceSessions.sessionId, sessionId),
        eq(deviceSessions.workspaceId, workspaceId),
      ),
      with: { externalUser: true },
    });

    return session?.externalUser ?? null;
  }
}
