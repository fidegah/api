import { seedPostStatuses } from './post-statuses.seed';
import { seedChangelogTags } from './seed-changelog-tags';

async function runSeeds(): Promise<void> {
  console.log('🌱 Starting database seeding...');

  try {
    await seedChangelogTags();
    await seedPostStatuses();
    console.log('✅ All seeds executed successfully.');
  } catch (error: unknown) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

void runSeeds();
