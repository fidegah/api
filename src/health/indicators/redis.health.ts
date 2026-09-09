import { Inject, Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.module';

@Injectable()
export class RedisHealthIndicator {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    try {
      const response = (await this.redis.ping()) as unknown;

      if (typeof response !== 'string' || response !== 'PONG') {
        const responseString = String(response);
        throw new Error(`Unexpected ping response: ${responseString}`);
      }

      return indicator.up();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown redis error';
      return indicator.down({ message: errorMessage });
    }
  }
}
