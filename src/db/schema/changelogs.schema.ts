import { bigint, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { workspaces } from './workspaces.schema';

export const changelogs = pgTable('changelogs', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  tagIds: uuid('tag_ids').array().notNull().default([]),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  likesCount: bigint('likes_count', { mode: 'number' }).default(0).notNull(),
  viewsCount: bigint('views_count', { mode: 'number' }).default(0).notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Changelog = typeof changelogs.$inferSelect;
export type NewChangelog = typeof changelogs.$inferInsert;
