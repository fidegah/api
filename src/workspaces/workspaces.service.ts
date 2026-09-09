import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, or } from 'drizzle-orm';
import { randomBytes } from 'crypto';

import { DATABASE, type DrizzleDB } from '../db/database.provider';
import {
  boards,
  NewWorkspace,
  Workspace,
  workspaces,
  workspaceUsers,
} from '../db/schema';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { UpdateAllowedDomainsDto } from './dto/update-allowed-domains.dto';
import { RESERVED_SUBDOMAINS } from './constants/reserved-subdomains.constant';
import {
  MAX_ALLOWED_DOMAINS,
  MAX_WORKSPACES_PER_USER,
} from './constants/limits.constant';
import { toPublicWorkspace } from './utils/to-public-workspace.util';
import { PublicWorkspace } from './types/public-workspace.type';

@Injectable()
export class WorkspacesService {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  private async findRawById(workspaceId: string): Promise<Workspace> {
    const workspace = await this.db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  // Create

  async create(
    userId: string,
    createWorkspaceDto: CreateWorkspaceDto,
  ): Promise<PublicWorkspace> {
    const normalizedSubdomain = createWorkspaceDto.subdomain
      .trim()
      .toLowerCase();

    if (RESERVED_SUBDOMAINS.has(normalizedSubdomain)) {
      throw new ConflictException('This subdomain is reserved');
    }

    const userWorkspaces = await this.findAllByUser(userId);

    if (userWorkspaces.length >= MAX_WORKSPACES_PER_USER) {
      throw new ForbiddenException('Workspace limit reached');
    }

    const existingWorkspace = await this.db.query.workspaces.findFirst({
      where: or(
        eq(workspaces.subdomain, normalizedSubdomain),
        and(
          eq(workspaces.userId, userId),
          eq(workspaces.name, createWorkspaceDto.name),
        ),
      ),
    });

    if (existingWorkspace) {
      throw new ConflictException(
        'A workspace with this name or subdomain already exists',
      );
    }

    const secretKey = `fg_secret_${randomBytes(32).toString('hex')}`;
    const sdkToken = `fg_sdk_${randomBytes(24).toString('hex')}`;

    const newWorkspace: NewWorkspace = {
      userId,
      name: createWorkspaceDto.name,
      subdomain: normalizedSubdomain,
      secretKey,
      sdkToken,
      allowedDomains: [],
    };

    return await this.db.transaction(async (tx) => {
      const [workspace] = await tx
        .insert(workspaces)
        .values(newWorkspace)
        .returning();

      await tx.insert(workspaceUsers).values({
        workspaceId: workspace.id,
        userId,
        role: 'owner',
      });

      await tx.insert(boards).values({
        workspaceId: workspace.id,
        userId,
        title: 'پیشنهاد امکانات',
        isDefault: true,
        isPrivate: false,
      });

      return toPublicWorkspace(workspace);
    });
  }

  // Read

  async findAllByUser(userId: string): Promise<PublicWorkspace[]> {
    const list = await this.db.query.workspaces.findMany({
      where: eq(workspaces.userId, userId),
    });

    return list.map(toPublicWorkspace);
  }

  async findBySubdomain(
    subdomain: string,
    userId: string,
  ): Promise<PublicWorkspace> {
    const workspace = await this.db.query.workspaces.findFirst({
      where: eq(workspaces.subdomain, subdomain),
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const membership = await this.db.query.workspaceUsers.findFirst({
      where: and(
        eq(workspaceUsers.workspaceId, workspace.id),
        eq(workspaceUsers.userId, userId),
      ),
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    return toPublicWorkspace(workspace);
  }

  async findByWorkspaceId(workspaceId: string): Promise<PublicWorkspace> {
    const workspace = await this.findRawById(workspaceId);
    return toPublicWorkspace(workspace);
  }

  // Update

  async updateByWorkspaceId(
    workspaceId: string,
    updateWorkspaceDto: UpdateWorkspaceDto,
  ): Promise<PublicWorkspace> {
    if (updateWorkspaceDto.subdomain) {
      const normalizedSubdomain = updateWorkspaceDto.subdomain
        .trim()
        .toLowerCase();

      if (RESERVED_SUBDOMAINS.has(normalizedSubdomain)) {
        throw new ConflictException('This subdomain is reserved');
      }

      const existing = await this.db.query.workspaces.findFirst({
        where: eq(workspaces.subdomain, normalizedSubdomain),
      });

      if (existing && existing.id !== workspaceId) {
        throw new ConflictException('This subdomain is already taken');
      }
    }

    const [updated] = await this.db
      .update(workspaces)
      .set({
        ...updateWorkspaceDto,
        ...(updateWorkspaceDto.subdomain && {
          subdomain: updateWorkspaceDto.subdomain.trim().toLowerCase(),
        }),
      })
      .where(eq(workspaces.id, workspaceId))
      .returning();

    if (!updated) {
      throw new NotFoundException('Workspace not found');
    }

    return toPublicWorkspace(updated);
  }

  // Delete

  async removeByWorkspaceId(workspaceId: string): Promise<void> {
    const result = await this.db
      .delete(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .returning({ id: workspaces.id });

    if (result.length === 0) {
      throw new NotFoundException('Workspace not found');
    }
  }

  // Credentials

  async getCredentialsByWorkspaceId(workspaceId: string): Promise<{
    secretKey: string;
    sdkToken: string;
    allowedDomains: string[];
    enforceSecureIdentify: boolean;
  }> {
    const workspace = await this.findRawById(workspaceId);

    return {
      secretKey: workspace.secretKey,
      sdkToken: workspace.sdkToken,
      allowedDomains: workspace.allowedDomains,
      enforceSecureIdentify: workspace.enforceSecureIdentify,
    };
  }

  // Allowed Domains

  async updateAllowedDomainsByWorkspaceId(
    workspaceId: string,
    updateAllowedDomainsDto: UpdateAllowedDomainsDto,
  ): Promise<{ allowedDomains: string[] }> {
    if (updateAllowedDomainsDto.allowedDomains.length > MAX_ALLOWED_DOMAINS) {
      throw new ForbiddenException(
        `Maximum ${MAX_ALLOWED_DOMAINS} allowed domains`,
      );
    }

    const [updated] = await this.db
      .update(workspaces)
      .set({ allowedDomains: updateAllowedDomainsDto.allowedDomains })
      .where(eq(workspaces.id, workspaceId))
      .returning();

    if (!updated) {
      throw new NotFoundException('Workspace not found');
    }

    return { allowedDomains: updated.allowedDomains };
  }

  // Secure Identify

  async toggleSecureIdentifyByWorkspaceId(
    workspaceId: string,
    enforce: boolean,
  ): Promise<{ enforceSecureIdentify: boolean }> {
    const result = await this.db
      .update(workspaces)
      .set({ enforceSecureIdentify: enforce })
      .where(eq(workspaces.id, workspaceId))
      .returning({ id: workspaces.id });

    if (result.length === 0) {
      throw new NotFoundException('Workspace not found');
    }

    return { enforceSecureIdentify: enforce };
  }
}
