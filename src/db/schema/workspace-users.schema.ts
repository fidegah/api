import {
  boolean,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { userRoleEnum, workspaces } from './workspaces.schema';
import { users } from './users.schema';

export const workspaceUsers = pgTable(
  'workspace_users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: userRoleEnum('role').notNull().default('contributor'),
    isBanned: boolean('is_banned').default(false).notNull(),
    bannedAt: timestamp('banned_at', { withTimezone: true }),
    browserName: text('browser_name'),
    engineName: text('engine_name'),
    deviceModel: text('device_model'),
    osName: text('os_name'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique().on(table.workspaceId, table.userId)],
);

export type WorkspaceUser = typeof workspaceUsers.$inferSelect;
export type NewWorkspaceUser = typeof workspaceUsers.$inferInsert;
