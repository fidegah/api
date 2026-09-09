import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const postStatuses = pgTable('post_statuses', {
  id: uuid('id').defaultRandom().primaryKey(),
  value: text('value').notNull().unique(),
  label: text('label').notNull(),
  color: text('color'),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type PostStatus = typeof postStatuses.$inferSelect;
export type NewPostStatus = typeof postStatuses.$inferInsert;
