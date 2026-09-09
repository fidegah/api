import { pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { announcements } from './announcements.schema';

export const announcementViews = pgTable(
  'announcement_views',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    announcementId: uuid('announcement_id')
      .notNull()
      .references(() => announcements.id, { onDelete: 'cascade' }),
  },
  (table) => [
    {
      uniqueView: unique().on(table.userId, table.announcementId),
    },
  ],
);

export type AnnouncementView = typeof announcementViews.$inferSelect;
export type NewAnnouncementView = typeof announcementViews.$inferInsert;
