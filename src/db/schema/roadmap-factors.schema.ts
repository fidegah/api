import {
  boolean,
  doublePrecision,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { roadmaps } from './roadmaps.schema';

export const factorTypeEnum = pgEnum('factor_type', [
  '0-10',
  '0-100',
  'stars',
  'fibonacci',
  'boolean',
]);

export const factorSourceEnum = pgEnum('factor_source', ['custom', 'built_in']);

export const builtInMetricEnum = pgEnum('built_in_metric', [
  'votes',
  'comments',
  'age',
]);

export const roadmapCustomFactors = pgTable('roadmap_custom_factors', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  roadmapId: uuid('roadmap_id')
    .notNull()
    .references(() => roadmaps.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: factorTypeEnum('type'),
  weight: doublePrecision('weight').notNull().default(1),
  isEffort: boolean('is_effort').notNull().default(false),
  source: factorSourceEnum('source').notNull().default('custom'),
  metric: builtInMetricEnum('metric'),
});

export type RoadmapCustomFactor = typeof roadmapCustomFactors.$inferSelect;
export type NewRoadmapCustomFactor = typeof roadmapCustomFactors.$inferInsert;
