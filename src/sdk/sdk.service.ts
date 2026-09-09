import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DATABASE, type DrizzleDB } from '../db/database.provider';
import {
  deviceSessions,
  externalUsers,
  type ExternalUser,
  workspaces,
} from '../db/schema';
import { IdentifyDto } from './dto/identify.dto';
import { InitSessionDto } from './dto/init-session.dto';
import { verifyVerificationToken } from './utils/secure-identify.util';

@Injectable()
export class SdkService {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  async initSession(dto: InitSessionDto) {
    const workspace = await this.db.query.workspaces.findFirst({
      where: eq(workspaces.sdkToken, dto.sdkToken),
    });

    if (!workspace) {
      throw new UnauthorizedException('Invalid SDK token');
    }

    const existingSession = await this.db.query.deviceSessions.findFirst({
      where: eq(deviceSessions.sessionId, dto.device.sessionId),
    });

    if (existingSession) {
      await this.db
        .update(deviceSessions)
        .set({
          currentUrl: dto.device.currentUrl ?? null,
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
    };
  }

  async identify(dto: IdentifyDto): Promise<ExternalUser> {
    const workspace = await this.db.query.workspaces.findFirst({
      where: eq(workspaces.sdkToken, dto.sdkToken),
    });

    if (!workspace) {
      throw new UnauthorizedException('Invalid SDK token');
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

    let externalUser = await this.db.query.externalUsers.findFirst({
      where: and(
        eq(externalUsers.workspaceId, workspace.id),
        eq(externalUsers.externalId, dto.user.id),
      ),
    });

    if (externalUser) {
      const [updated] = await this.db
        .update(externalUsers)
        .set({
          fullName: dto.user.fullName ?? null,
          email: dto.user.email ?? null,
          avatarUrl: dto.user.avatarUrl ?? null,
        })
        .where(eq(externalUsers.id, externalUser.id))
        .returning();

      if (!updated) {
        throw new BadRequestException('Failed to update external user');
      }
      externalUser = updated;
    } else {
      const [created] = await this.db
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

    await this.db
      .update(deviceSessions)
      .set({ externalUserId: externalUser.id })
      .where(
        and(
          eq(deviceSessions.sessionId, dto.sessionId),
          eq(deviceSessions.workspaceId, workspace.id),
        ),
      );

    return externalUser;
  }

  async findExternalUserBySession(
    sessionId: string,
  ): Promise<ExternalUser | null> {
    const session = await this.db.query.deviceSessions.findFirst({
      where: eq(deviceSessions.sessionId, sessionId),
      with: {
        externalUser: true,
      },
    });

    return session?.externalUser ?? null;
  }
}
