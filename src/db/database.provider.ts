import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import {
  drizzle as drizzleNodePg,
  NodePgDatabase,
} from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema';

export const DATABASE = Symbol('DATABASE');

export type DrizzleDB = NodePgDatabase<typeof schema>;

export const databaseProvider: Provider = {
  provide: DATABASE,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): DrizzleDB => {
    const databaseUrl = configService.get<string>('database.url');
    const isProduction = configService.get<string>('NODE_ENV') === 'production';

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined');
    }

    if (isProduction) {
      const sql = neon(databaseUrl);
      return drizzleNeon(sql, { schema }) as unknown as DrizzleDB;
    }

    const pool = new Pool({ connectionString: databaseUrl });
    return drizzleNodePg(pool, { schema });
  },
};
