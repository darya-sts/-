import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { AppLoggerModule } from './common/logger/logger.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { TelegramModule } from './modules/telegram/telegram.module';
import { DigestModule } from './modules/digest/digest.module';
import { ArticleModule } from './modules/article/article.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { MarvinbotModule } from './modules/marvinbot/marvinbot.module';
import { SourcesModule } from './modules/sources/sources.module';
import { SettingsModule } from './modules/settings/settings.module';
import { StatsModule } from './modules/stats/stats.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    RedisModule,
    AppLoggerModule,
    AuthModule,
    TelegramModule,
    DigestModule,
    ArticleModule,
    SchedulerModule,
    MarvinbotModule,
    SourcesModule,
    SettingsModule,
    StatsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}