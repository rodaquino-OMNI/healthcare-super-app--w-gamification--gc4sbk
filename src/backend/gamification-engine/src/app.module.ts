import { Module } from '@nestjs/common'; // v10.0.0+
import { ConfigModule } from '@nestjs/config'; // v3.1.1
import { TerminusModule } from '@nestjs/terminus'; // v10.0.0+
import { AchievementsModule } from './achievements/achievements.module';
import { EventsModule } from './events/events.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { ProfilesModule } from './profiles/profiles.module';
import { QuestsModule } from './quests/quests.module';
import { RewardsModule } from './rewards/rewards.module';
import { RulesModule } from './rules/rules.module';
import { KafkaModule } from './kafka.module';
import { RedisModule } from 'src/backend/shared/src/redis/redis.module';
import { LoggerModule } from 'src/backend/shared/src/logging/logger.module';
import { TracingModule } from 'src/backend/shared/src/tracing/tracing.module';
import { ExceptionsModule } from 'src/backend/shared/src/exceptions/exceptions.module';
import { PrometheusModule } from '@app/shared/monitoring/prometheus.module';
import { gamificationEngine } from './config/configuration';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';

/**
 * Root module for the Gamification Engine service.
 * It imports and configures all the necessary modules for the service,
 * including feature modules (Achievements, Events, Profiles, Quests, Rewards, Rules),
 * shared modules (Kafka, Redis, Logger, Tracing, Exceptions), and the ConfigModule.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [gamificationEngine],
    }),
    TerminusModule,
    AchievementsModule,
    EventsModule,
    LeaderboardModule,
    ProfilesModule,
    QuestsModule,
    RewardsModule,
    RulesModule,
    KafkaModule.registerWithConfigService(),
    RedisModule,
    LoggerModule,
    TracingModule,
    ExceptionsModule,
    PrometheusModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
  exports: [AppService],
})
export class AppModule {
  /**
   * The constructor is empty as this is a module class.
   */
  constructor() {}
}