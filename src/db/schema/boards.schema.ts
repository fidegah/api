import {
  bigint,
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces.schema';

export const boards = pgTable('boards', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  url: text('url'),
  isPrivate: boolean('is_private').default(false).notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  postsCount: bigint('posts_count', { mode: 'number' }).default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Board = typeof boards.$inferSelect;
export type NewBoard = typeof boards.$inferInsert;
