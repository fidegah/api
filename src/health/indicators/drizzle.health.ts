import { Inject, Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { sql } from 'drizzle-orm';
import { DATABASE, type DrizzleDB } from '../../db/database.provider';

@Injectable()
export class DrizzleHealthIndicator {
  constructor(
    @Inject(DATABASE) private readonly db: DrizzleDB,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    try {
      await this.db.execute(sql`SELECT 1`);
      return indicator.up();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown database error';
      return indicator.down({ message: errorMessage });
    }
  }
}
