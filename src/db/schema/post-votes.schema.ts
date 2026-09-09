import { pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { posts } from './posts.schema';
import { workspaces } from './workspaces.schema';
import { externalUsers } from './external-users.schema';

export const postVotes = pgTable(
  'post_votes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    externalUserId: uuid('external_user_id').references(
      () => externalUsers.id,
      { onDelete: 'cascade' },
    ),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
  },
  (table) => [
    {
      uniqueVote: unique().on(table.postId, table.userId),
      uniqueExternalUserVote: unique().on(table.postId, table.externalUserId),
    },
  ],
);

export type PostVote = typeof postVotes.$inferSelect;
export type NewPostVote = typeof postVotes.$inferInsert;
