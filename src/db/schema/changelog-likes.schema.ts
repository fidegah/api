import { pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { changelogs } from './changelogs.schema';

export const changelogLikes = pgTable(
  'changelog_likes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    changelogId: uuid('changelog_id')
      .notNull()
      .references(() => changelogs.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    uniqueLike: unique().on(table.changelogId, table.userId),
  }),
);

export type ChangelogLike = typeof changelogLikes.$inferSelect;
export type NewChangelogLike = typeof changelogLikes.$inferInsert;
