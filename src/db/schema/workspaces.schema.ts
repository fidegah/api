import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const userRoleEnum = pgEnum('user_role', [
  'owner',
  'admin',
  'contributor',
]);

export const workspaces = pgTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  name: text('name').notNull(),
  subdomain: text('subdomain').notNull().unique(),
  secretKey: text('secret_key').notNull(),
  enforceSecureIdentify: boolean('enforce_secure_identify')
    .default(false)
    .notNull(),
  sdkToken: text('sdk_token').notNull(),
  allowedDomains: text('allowed_domains').array().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
