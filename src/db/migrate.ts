import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';

import { setupNeonConfig } from './neon-config';

const runMigration = async (): Promise<void> => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is missing in environment variables');
  }

  setupNeonConfig();

  const sql = neon(databaseUrl);
  const db = drizzle(sql);

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations completed successfully!');
};

runMigration().catch((error: Error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
