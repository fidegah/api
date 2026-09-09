import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, inArray } from 'drizzle-orm';

import { DATABASE, type DrizzleDB } from '../db/database.provider';
import { Notification, notifications } from '../db/schema';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { buildPagination } from '../common/utils/build-pagination.util';
import { PaginatedResult } from '../common/types/pagination.type';
import { MarkAsReadDto } from './dto/mark-as-read.dto';

export interface CreateNotificationInput {
  workspaceId: string;
  userId: string;
  title: string;
  description?: string;
  link?: string;
}

@Injectable()
export class NotificationsService {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  async create(input: CreateNotificationInput): Promise<Notification> {
    const [notification] = await this.db
      .insert(notifications)
      .values({
        workspaceId: input.workspaceId,
        userId: input.userId,
        title: input.title,
        description: input.description,
        link: input.link,
      })
      .returning();

    return notification;
  }

  async createMany(inputs: CreateNotificationInput[]): Promise<void> {
    if (inputs.length === 0) return;

    await this.db.insert(notifications).values(
      inputs.map((input) => ({
        workspaceId: input.workspaceId,
        userId: input.userId,
        title: input.title,
        description: input.description,
        link: input.link,
      })),
    );
  }

  async findAll(
    workspaceId: string,
    userId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResult<Notification>> {
    const { page, limit, offset } = paginationQuery;

    const where = and(
      eq(notifications.workspaceId, workspaceId),
      eq(notifications.userId, userId),
    );

    const [data, [{ total }]] = await Promise.all([
      this.db.query.notifications.findMany({
        where,
        orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
        limit,
        offset,
      }),
      this.db.select({ total: count() }).from(notifications).where(where),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  }

  async remove(
    id: string,
    workspaceId: string,
    userId: string,
  ): Promise<{ message: string }> {
    await this.db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.workspaceId, workspaceId),
          eq(notifications.userId, userId),
        ),
      );

    return { message: 'Notification deleted successfully' };
  }

  async markAsRead(
    workspaceId: string,
    userId: string,
    markAsReadDto: MarkAsReadDto,
  ): Promise<{ message: string }> {
    await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          inArray(notifications.id, markAsReadDto.notificationIds),
          eq(notifications.workspaceId, workspaceId),
          eq(notifications.userId, userId),
        ),
      );

    return { message: 'Notifications marked as read successfully' };
  }
}
