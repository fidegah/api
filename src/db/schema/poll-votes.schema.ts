import { integer, pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { polls } from './polls.schema';
import { pollOptions } from './poll-options.schema';

export const pollVotes = pgTable(
  'poll_votes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    pollId: uuid('poll_id')
      .notNull()
      .references(() => polls.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    optionId: uuid('option_id')
      .notNull()
      .references(() => pollOptions.id, { onDelete: 'cascade' }),
    rank: integer('rank').notNull().default(1),
  },
  (table) => [
    {
      uniqueVote: unique().on(table.userId, table.optionId),
    },
  ],
);

export type PollVote = typeof pollVotes.$inferSelect;
export type NewPollVote = typeof pollVotes.$inferInsert;
