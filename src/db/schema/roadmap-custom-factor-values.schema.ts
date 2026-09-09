import { integer, pgTable, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { roadmapItems } from './roadmap-items.schema';
import { roadmapCustomFactors } from './roadmap-factors.schema';

export const roadmapCustomFactorValues = pgTable(
  'roadmap_custom_factor_values',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    roadmapItemId: uuid('roadmap_item_id')
      .notNull()
      .references(() => roadmapItems.id, { onDelete: 'cascade' }),
    factorId: uuid('factor_id')
      .notNull()
      .references(() => roadmapCustomFactors.id, { onDelete: 'cascade' }),
    value: integer('value').notNull(),
  },
  (table) => ({
    uniqueValue: unique().on(table.roadmapItemId, table.factorId),
  }),
);

export type RoadmapCustomFactorValue =
  typeof roadmapCustomFactorValues.$inferSelect;
export type NewRoadmapCustomFactorValue =
  typeof roadmapCustomFactorValues.$inferInsert;
