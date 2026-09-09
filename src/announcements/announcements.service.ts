import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { and, count, eq, inArray } from 'drizzle-orm';

import { DATABASE, type DrizzleDB } from '../db/database.provider';
import { announcements, announcementViews } from '../db/schema';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { buildPagination } from '../common/utils/build-pagination.util';
import { PaginatedResult } from '../common/types/pagination.type';
import { AnnouncementWithViewStatus } from './types/announcement-with-view-status.type';
import { isUniqueViolation } from '../common/utils/is-unique-violation.util';

@Injectable()
export class AnnouncementsService {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  async findAll(
    userId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResult<AnnouncementWithViewStatus>> {
    const { page, limit, offset } = paginationQuery;

    const [data, [{ total }]] = await Promise.all([
      this.db.query.announcements.findMany({
        orderBy: (announcements, { desc }) => [desc(announcements.createdAt)],
        limit,
        offset,
      }),
      this.db.select({ total: count() }).from(announcements),
    ]);

    const withViewStatus = await this.attachIsViewed(data, userId);

    return {
      data: withViewStatus,
      pagination: buildPagination(page, limit, total),
    };
  }

  async markAsViewed(
    announcementId: string,
    userId: string,
  ): Promise<{ message: string }> {
    try {
      await this.db
        .insert(announcementViews)
        .values({ userId, announcementId });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Announcement already marked as viewed');
      }
      throw error;
    }

    return { message: 'Announcement marked as viewed successfully' };
  }

  private async attachIsViewed(
    announcementsList: (typeof announcements.$inferSelect)[],
    userId: string,
  ): Promise<AnnouncementWithViewStatus[]> {
    if (announcementsList.length === 0) return [];

    const announcementIds = announcementsList.map((a) => a.id);

    const views = await this.db.query.announcementViews.findMany({
      where: and(
        eq(announcementViews.userId, userId),
        inArray(announcementViews.announcementId, announcementIds),
      ),
      columns: { announcementId: true },
    });

    const viewedIds = new Set(views.map((v) => v.announcementId));

    return announcementsList.map((a) => ({
      ...a,
      isViewed: viewedIds.has(a.id),
    }));
  }
}
