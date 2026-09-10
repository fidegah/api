import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from '@neondatabase/serverless';
import { drizzle, NeonDatabase } from 'drizzle-orm/neon-serverless';

import * as schema from './schema';
import { setupNeonConfig } from './neon-config';

export const DATABASE = Symbol('DATABASE');

export type DrizzleDB = NeonDatabase<typeof schema>;

export const databaseProvider: Provider = {
  provide: DATABASE,
  inject: [ConfigService],
  useFactory: (configService: ConfigService): DrizzleDB => {
    const databaseUrl = configService.get<string>('database.url');

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined');
    }

    setupNeonConfig();

    const pool = new Pool({ connectionString: databaseUrl });
    return drizzle(pool, { schema });
  },
};
