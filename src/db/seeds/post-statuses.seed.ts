import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { postStatuses } from '../schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

export async function seedPostStatuses() {
  await db
    .insert(postStatuses)
    .values([
      {
        value: 'open',
        label: 'باز',
        color: '#64748b',
        order: 1,
      },
      {
        value: 'planned',
        label: 'برنامه‌ریزی شده',
        color: '#3b82f6',
        order: 2,
      },
      {
        value: 'in_progress',
        label: 'در حال انجام',
        color: '#f59e0b',
        order: 3,
      },
      {
        value: 'completed',
        label: 'تکمیل شده',
        color: '#22c55e',
        order: 4,
      },
      {
        value: 'closed',
        label: 'بسته شده',
        color: '#ef4444',
        order: 5,
      },
      {
        value: 'cancelled',
        label: 'لغو شده',
        color: '#71717a',
        order: 6,
      },
    ])
    .onConflictDoNothing();

  console.log('Post statuses seeded successfully');
}
