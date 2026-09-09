import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { changelogTags } from '../schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export async function seedChangelogTags() {
  await db
    .insert(changelogTags)
    .values([
      {
        name: 'قابلیت‌های جدید',
        slug: 'new-features',
        icon: 'sparkles',
        color: '#10b981',
        order: 1,
      },
      {
        name: 'بهبودها',
        slug: 'improvements',
        icon: 'wrench',
        color: '#3b82f6',
        order: 2,
      },
      {
        name: 'رفع باگ',
        slug: 'bug-fixes',
        icon: 'bug',
        color: '#ef4444',
        order: 3,
      },
      {
        name: 'بهینه‌سازی',
        slug: 'optimizations',
        icon: 'rocket',
        color: '#8b5cf6',
        order: 4,
      },
      {
        name: 'امنیت',
        slug: 'security',
        icon: 'shield-check',
        color: '#06b6d4',
        order: 5,
      },
      {
        name: 'تغییرات ظاهری یا تجربه کاربری',
        slug: 'ui-ux',
        icon: 'palette',
        color: '#f59e0b',
        order: 6,
      },
      {
        name: 'منسوخ شده',
        slug: 'deprecated',
        icon: 'triangle-alert',
        color: '#f97316',
        order: 7,
      },
      {
        name: 'حذف شده',
        slug: 'removed',
        icon: 'trash',
        color: '#64748b',
        order: 8,
      },
    ])
    .onConflictDoNothing();

  console.log('Changelog tags seeded successfully');
}
