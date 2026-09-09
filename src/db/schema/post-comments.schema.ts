import { AnyPgColumn } from 'drizzle-orm/pg-core';
import {
  bigint,
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { workspaces } from './workspaces.schema';
import { posts } from './posts.schema';
import { externalUsers } from './external-users.schema';

export const postComments = pgTable('post_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  externalUserId: uuid('external_user_id').references(() => externalUsers.id, {
    onDelete: 'cascade',
  }),
  content: text('content').notNull(),
  parentId: uuid('parent_id').references((): AnyPgColumn => postComments.id, {
    onDelete: 'cascade',
  }),
  isSpam: boolean('is_spam').default(false).notNull(),
  isPinned: boolean('is_pinned').default(false).notNull(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  likesCount: bigint('likes_count', { mode: 'number' }).default(0).notNull(),
  repliesCount: bigint('replies_count', { mode: 'number' })
    .default(0)
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type PostComment = typeof postComments.$inferSelect;
export type NewPostComment = typeof postComments.$inferInsert;
