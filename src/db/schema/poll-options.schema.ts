import { integer, pgTable, timestamp, text, uuid } from 'drizzle-orm/pg-core';
import { polls } from './polls.schema';

export const pollOptions = pgTable('poll_options', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  pollId: uuid('poll_id')
    .notNull()
    .references(() => polls.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  order: integer('order').notNull().default(0),
  votesCount: integer('votes_count').default(0).notNull(),
});

export type PollOption = typeof pollOptions.$inferSelect;
export type NewPollOption = typeof pollOptions.$inferInsert;
