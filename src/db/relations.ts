import { relations } from 'drizzle-orm';

import { postVotes } from './schema/post-votes.schema';
import { users } from './schema/users.schema';

export const postVotesRelations = relations(postVotes, ({ one }) => ({
  author: one(users, {
    fields: [postVotes.userId],
    references: [users.id],
  }),
}));
