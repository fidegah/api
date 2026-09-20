import { pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { workspaces } from './workspaces.schema';
import { externalUsers } from './external-users.schema';

export const deviceSessions = pgTable(
  'device_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    sessionId: text('session_id').notNull().unique(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    externalUserId: uuid('external_user_id').references(
      () => externalUsers.id,
      {
        onDelete: 'set null',
      },
    ),
    browserName: text('browser_name'),
    osName: text('os_name'),
    deviceModel: text('device_model'),
    engineName: text('engine_name'),
    ipAddress: text('ip_address'),
    currentUrl: text('current_url'),
  },
  (table) => [
    unique('device_sessions_workspace_session_unique').on(
      table.workspaceId,
      table.sessionId,
    ),
  ],
);

export type DeviceSession = typeof deviceSessions.$inferSelect;
export type NewDeviceSession = typeof deviceSessions.$inferInsert;
