import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { postComments } from './post-comments.schema';
import { externalUsers } from './external-users.schema';

export const commentLikes = pgTable(
  'comment_likes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    commentId: uuid('comment_id')
      .notNull()
      .references(() => postComments.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'cascade',
    }),
    externalUserId: uuid('external_user_id').references(
      () => externalUsers.id,
      { onDelete: 'cascade' },
    ),
    sessionId: text('session_id'),
  },
  (table) => [
    uniqueIndex('unique_comment_user_like').on(table.commentId, table.userId),
    uniqueIndex('unique_comment_external_user_like').on(
      table.commentId,
      table.externalUserId,
    ),
    uniqueIndex('unique_comment_session_like').on(
      table.commentId,
      table.sessionId,
    ),
  ],
);

export type CommentLike = typeof commentLikes.$inferSelect;
export type NewCommentLike = typeof commentLikes.$inferInsert;
