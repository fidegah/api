import {
  integer,
  pgTable,
  timestamp,
  varchar,
  uuid,
} from 'drizzle-orm/pg-core';

export const changelogTags = pgTable('changelog_tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  icon: varchar('icon', { length: 100 }),
  color: varchar('color', { length: 50 }),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type ChangelogTag = typeof changelogTags.$inferSelect;
export type NewChangelogTag = typeof changelogTags.$inferInsert;
