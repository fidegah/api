import { pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { posts } from './posts.schema';
import { tags } from './tags.schema';
import { workspaces } from './workspaces.schema';

export const postTags = pgTable(
  'post_tags',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
  },
  (table) => [
    {
      uniquePostTag: unique().on(table.postId, table.tagId),
    },
  ],
);

export type PostTag = typeof postTags.$inferSelect;
export type NewPostTag = typeof postTags.$inferInsert;
