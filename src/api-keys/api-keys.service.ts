import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { createHash, randomBytes } from 'crypto';

import { DATABASE, type DrizzleDB } from '../db/database.provider';
import { apiKeys, workspaces } from '../db/schema';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';

@Injectable()
export class ApiKeysService {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  private generateApiKey(): string {
    return `fg_live_${randomBytes(24).toString('hex')}`;
  }

  private hashApiKey(apiKey: string): string {
    return createHash('sha256').update(apiKey).digest('hex');
  }

  async create(
    userId: string,
    workspaceId: string,
    createApiKeyDto: CreateApiKeyDto,
  ) {
    const rawKey = this.generateApiKey();
    const apiKeyHash = this.hashApiKey(rawKey);

    const [apiKey] = await this.db
      .insert(apiKeys)
      .values({
        userId,
        workspaceId,
        name: createApiKeyDto.name,
        apiKeyHash,
      })
      .returning({
        id: apiKeys.id,
        name: apiKeys.name,
        createdAt: apiKeys.createdAt,
      });

    return {
      ...apiKey,
      key: rawKey,
    };
  }

  findAll(workspaceId: string) {
    return this.db.query.apiKeys.findMany({
      where: and(
        eq(apiKeys.workspaceId, workspaceId),
        eq(apiKeys.isActive, true),
      ),
      columns: {
        id: true,
        name: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string, workspaceId: string) {
    const apiKey = await this.db.query.apiKeys.findFirst({
      where: and(eq(apiKeys.id, id), eq(apiKeys.workspaceId, workspaceId)),
      columns: {
        id: true,
        name: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    return apiKey;
  }

  async update(
    id: string,
    workspaceId: string,
    updateApiKeyDto: UpdateApiKeyDto,
  ) {
    await this.findOne(id, workspaceId);

    const [updated] = await this.db
      .update(apiKeys)
      .set(updateApiKeyDto)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.workspaceId, workspaceId)))
      .returning({
        id: apiKeys.id,
        name: apiKeys.name,
        isActive: apiKeys.isActive,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
      });

    return updated;
  }

  async revoke(id: string, workspaceId: string) {
    await this.findOne(id, workspaceId);

    await this.db
      .update(apiKeys)
      .set({ isActive: false })
      .where(and(eq(apiKeys.id, id), eq(apiKeys.workspaceId, workspaceId)));

    return { message: 'API key revoked successfully' };
  }

  async validateApiKey(rawKey: string) {
    const apiKeyHash = this.hashApiKey(rawKey);

    const apiKey = await this.db.query.apiKeys.findFirst({
      where: and(
        eq(apiKeys.apiKeyHash, apiKeyHash),
        eq(apiKeys.isActive, true),
      ),
    });

    if (!apiKey) {
      throw new UnauthorizedException('Invalid or revoked API key');
    }

    const workspace = await this.db.query.workspaces.findFirst({
      where: eq(workspaces.id, apiKey.workspaceId),
    });

    if (!workspace) {
      throw new UnauthorizedException('Workspace not found');
    }

    this.db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, apiKey.id))
      .catch(() => {});

    return { workspace, userId: apiKey.userId };
  }
}
