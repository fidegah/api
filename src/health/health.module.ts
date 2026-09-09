import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { DrizzleHealthIndicator } from './indicators/drizzle.health';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './indicators/redis.health';
import { DatabaseModule } from '../db/database.module';
import { RedisModule } from '../redis/redis.module';
import { StorageHealthIndicator } from './indicators/storage.health';

@Module({
  imports: [
    TerminusModule.forRoot({
      errorLogStyle: 'pretty',
      gracefulShutdownTimeoutMs: 1000,
    }),
    DatabaseModule,
    RedisModule,
  ],
  controllers: [HealthController],
  providers: [
    DrizzleHealthIndicator,
    RedisHealthIndicator,
    StorageHealthIndicator,
  ],
})
export class HealthModule {}
