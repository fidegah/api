import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const messageTypeEnum = pgEnum('message_type', [
  'general',
  'info',
  'warning',
  'error',
  'success',
]);

export const announcements = pgTable('announcements', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  type: messageTypeEnum('type').notNull().default('general'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;
