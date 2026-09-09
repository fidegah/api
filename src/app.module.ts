import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { RedisModule } from './redis/redis.module';
import { DatabaseModule } from './db/database.module';
import { BullModule } from '@nestjs/bullmq';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { SdkModule } from './sdk/sdk.module';
import { BoardsModule } from './boards/boards.module';
import { PostsModule } from './posts/posts.module';
import { PostStatusesModule } from './post-statuses/post-statuses.module';
import { PostCategoriesModule } from './post-categories/post-categories.module';
import { TagsModule } from './tags/tags.module';
import { PostCommentsModule } from './post-comments/post-comments.module';
import { AiModule } from './ai/ai.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ChangelogsModule } from './changelogs/changelogs.module';
import { PollsModule } from './polls/polls.module';
import { RoadmapsModule } from './roadmaps/roadmaps.module';
import { StorageService } from './storage/storage.service';
import { StorageModule } from './storage/storage.module';
import { TicketsModule } from './tickets/tickets.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { NotificationsModule } from './notifications/notifications.module';
import { ContactModule } from './contact/contact.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { PortalModule } from './portal/portal.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      providers: [],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';

        return {
          pinoHttp: {
            transport: !isProduction
              ? {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                    colorize: true,
                    translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
                    ignore: 'pid,hostname',
                  },
                }
              : undefined,
          },
        };
      },
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>('redis.url'),
        },
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/static',
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60_000,
          limit: 100,
        },
      ],
    }),
    DatabaseModule,
    RedisModule.register(),
    UsersModule,
    AuthModule,
    MailModule,
    ApiKeysModule,
    WorkspacesModule,
    SdkModule,
    BoardsModule,
    PostsModule,
    PostStatusesModule,
    PostCategoriesModule,
    TagsModule,
    PostCommentsModule,
    AiModule,
    DashboardModule,
    ChangelogsModule,
    PollsModule,
    RoadmapsModule,
    StorageModule,
    TicketsModule,
    NotificationsModule,
    ContactModule,
    AnnouncementsModule,
    NewsletterModule,
    PortalModule,
    HealthModule,
  ],
  providers: [
    StorageService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
