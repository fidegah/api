import { Controller, Get } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { DrizzleHealthIndicator } from './indicators/drizzle.health';
import { RedisHealthIndicator } from './indicators/redis.health';
import { StorageHealthIndicator } from './indicators/storage.health';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly drizzleHealth: DrizzleHealthIndicator,
    private readonly redisHealth: RedisHealthIndicator,
    private readonly storageHealth: StorageHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
  ) {}

  @Get('liveness')
  @HealthCheck()
  checkLiveness() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024), // 200MB
      () => this.memory.checkRSS('memory_rss', 500 * 1024 * 1024), // 500MB
    ]);
  }

  @Get('readiness')
  @HealthCheck()
  checkReadiness() {
    return this.health.check([
      () => this.drizzleHealth.isHealthy('database'),
      () => this.redisHealth.isHealthy('redis'),
      () => this.storageHealth.isHealthy('storage'),
      () =>
        this.disk.checkStorage('disk', {
          path: '/',
          thresholdPercent: 0.85,
        }),
    ]);
  }
}
