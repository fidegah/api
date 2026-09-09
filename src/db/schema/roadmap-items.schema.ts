import { pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { roadmaps } from './roadmaps.schema';
import { posts } from './posts.schema';

export const roadmapItems = pgTable(
  'roadmap_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    roadmapId: uuid('roadmap_id')
      .notNull()
      .references(() => roadmaps.id, { onDelete: 'cascade' }),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    eta: text('eta'),
  },
  (table) => ({
    uniqueItem: unique().on(table.roadmapId, table.postId),
  }),
);

export type RoadmapItem = typeof roadmapItems.$inferSelect;
export type NewRoadmapItem = typeof roadmapItems.$inferInsert;
