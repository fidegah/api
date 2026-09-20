import { neon } from '@neondatabase/serverless';
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';

import * as schema from '../schema';
import { setupNeonConfig } from '../neon-config';
import { seedPostStatuses } from './post-statuses.seed';
import { seedChangelogTags } from './changelog-tags.seed';

export type SeedDatabase = NeonHttpDatabase<typeof schema>;

async function runSeeds(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is missing in environment variables');
  }

  setupNeonConfig();

  const sql = neon(databaseUrl);
  const db: SeedDatabase = drizzle(sql, { schema });

  console.log('🌱 Starting database seeding...');

  try {
    await seedChangelogTags(db);
    await seedPostStatuses(db);
    console.log('✅ All seeds executed successfully.');
  } catch (error) {
    console.error('❌ Seeding failed:', error as Error);
    process.exit(1);
  }
}

void runSeeds();
