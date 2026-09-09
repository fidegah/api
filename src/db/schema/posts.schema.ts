import {
  bigint,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { boards } from './boards.schema';
import { externalUsers } from './external-users.schema';
import { postCategories } from './post-categories.schema';
import { postStatuses } from './post-statuses.schema';
import { users } from './users.schema';
import { workspaces } from './workspaces.schema';

export const postVisibilityEnum = pgEnum('post_visibility', [
  'public',
  'private',
]);

export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  statusId: uuid('status_id')
    .notNull()
    .references(() => postStatuses.id),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  boardId: uuid('board_id')
    .notNull()
    .references(() => boards.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').references(() => postCategories.id),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  externalUserId: uuid('external_user_id').references(() => externalUsers.id, {
    onDelete: 'cascade',
  }),
  votesCount: bigint('votes_count', { mode: 'number' }).default(0).notNull(),
  commentsCount: bigint('comments_count', { mode: 'number' })
    .default(0)
    .notNull(),
  visibility: postVisibilityEnum('visibility').default('public').notNull(),
  lastInteractionAt: timestamp('last_interaction_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
