import {
  boolean,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces.schema';

export const externalUsers = pgTable(
  'external_users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    externalId: text('external_id').notNull(),
    fullName: text('full_name'),
    email: text('email'),
    avatarUrl: text('avatar_url'),
    isBanned: boolean('is_banned').default(false).notNull(),
    bannedAt: timestamp('banned_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique('external_users_workspace_external_unique').on(
      table.workspaceId,
      table.externalId,
    ),
  ],
);

export type ExternalUser = typeof externalUsers.$inferSelect;
export type NewExternalUser = typeof externalUsers.$inferInsert;
