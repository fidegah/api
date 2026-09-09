import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';

import { DATABASE, type DrizzleDB } from '../db/database.provider';
import { changelogLikes, changelogs } from '../db/schema';

@Injectable()
export class ChangelogLikesService {
  constructor(@Inject(DATABASE) private readonly db: DrizzleDB) {}

  async toggleLike(
    changelogId: string,
    userId: string,
  ): Promise<{ liked: boolean; likesCount: number }> {
    const existing = await this.db.query.changelogLikes.findFirst({
      where: and(
        eq(changelogLikes.changelogId, changelogId),
        eq(changelogLikes.userId, userId),
      ),
    });

    if (existing) {
      await this.db
        .delete(changelogLikes)
        .where(eq(changelogLikes.id, existing.id));

      const [changelog] = await this.db
        .update(changelogs)
        .set({ likesCount: sql`${changelogs.likesCount} - 1` })
        .where(eq(changelogs.id, changelogId))
        .returning({ likesCount: changelogs.likesCount });

      return { liked: false, likesCount: changelog.likesCount };
    }

    await this.db.insert(changelogLikes).values({ changelogId, userId });

    const [changelog] = await this.db
      .update(changelogs)
      .set({ likesCount: sql`${changelogs.likesCount} + 1` })
      .where(eq(changelogs.id, changelogId))
      .returning({ likesCount: changelogs.likesCount });

    return { liked: true, likesCount: changelog.likesCount };
  }
}
