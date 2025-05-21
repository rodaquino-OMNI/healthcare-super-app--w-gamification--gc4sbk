import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Import configuration factories
import configuration from './config/configuration';
import databaseConfig from './config/database.config';
import validationSchema from './config/validation.schema';

// Import database handlers from @austa packages
import { DatabaseModule, PrismaService } from '@austa/database';
import { DatabaseErrorHandler } from './database/database-error.handler';

// Import shared infrastructure modules from @austa packages
import { LoggerModule } from '@austa/logging';
import { ExceptionsModule } from '@austa/errors';
import { TracingModule } from '@austa/tracing';
import { RedisModule } from '@austa/database/redis';
import { KafkaModule } from '@austa/events/kafka';
import { EventsModule as SharedEventsModule } from '@austa/events';

// Import feature modules
import { ProfilesModule } from './profiles/profiles.module';
import { AchievementsModule } from './achievements/achievements.module';
import { RulesModule } from './rules/rules.module';
import { QuestsModule } from './quests/quests.module';
import { RewardsModule } from './rewards/rewards.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { EventsModule } from './events/events.module';

// Import common module for shared utilities
import { CommonModule } from './common/common.module';

/**
 * Root module of the Gamification Engine microservice.
 * 
 * Configures and imports all submodules, establishes database connections,
 * and sets up shared infrastructure services. Implements feature flags for
 * gradual rollout of new functionality and standardized module resolution
 * across the monorepo.
 */
@Module({
  imports: [
    // Configuration setup with validation
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration, databaseConfig],
      validationSchema,
      validationOptions: {
        abortEarly: false,
      },
      cache: true,
    }),

    // Database connection setup with TypeORM
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: DatabaseErrorHandler.createTypeOrmOptions,
    }),

    // Enhanced database module with Prisma and journey-specific contexts
    DatabaseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        url: configService.get('gamificationEngine.database.url'),
        logging: configService.get('gamificationEngine.database.logging'),
        maxConnections: configService.get('gamificationEngine.database.maxConnections'),
        connectionTimeout: configService.get('gamificationEngine.database.connectionTimeout'),
        enableSsl: configService.get('gamificationEngine.database.ssl'),
        journeyContexts: {
          health: configService.get('gamificationEngine.features.healthJourney.enabled'),
          care: configService.get('gamificationEngine.features.careJourney.enabled'),
          plan: configService.get('gamificationEngine.features.planJourney.enabled'),
        },
      }),
      isGlobal: true,
    }),

    // Shared infrastructure modules
    LoggerModule.forRoot({
      serviceName: 'gamification-engine',
      isGlobal: true,
    }),
    ExceptionsModule.forRoot({
      isGlobal: true,
      journeyErrorsEnabled: true,
    }),
    TracingModule.forRoot({
      serviceName: 'gamification-engine',
      isGlobal: true,
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        host: configService.get('gamificationEngine.redis.host'),
        port: configService.get('gamificationEngine.redis.port'),
        db: configService.get('gamificationEngine.redis.db'),
        password: configService.get('gamificationEngine.redis.password'),
        keyPrefix: configService.get('gamificationEngine.redis.keyPrefix'),
        tls: configService.get('gamificationEngine.redis.tls'),
        journeyTtl: {
          health: configService.get('gamificationEngine.redis.journeyTtl.health'),
          care: configService.get('gamificationEngine.redis.journeyTtl.care'),
          plan: configService.get('gamificationEngine.redis.journeyTtl.plan'),
          global: configService.get('gamificationEngine.redis.journeyTtl.global'),
        },
      }),
      isGlobal: true,
    }),
    KafkaModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        clientId: configService.get('gamificationEngine.kafka.clientId'),
        brokers: configService.get('gamificationEngine.kafka.brokers'),
        groupId: configService.get('gamificationEngine.kafka.groupId'),
        ssl: configService.get('gamificationEngine.kafka.ssl'),
        sasl: configService.get('gamificationEngine.kafka.sasl') ? {
          mechanism: configService.get('gamificationEngine.kafka.sasl.mechanism'),
          username: configService.get('gamificationEngine.kafka.sasl.username'),
          password: configService.get('gamificationEngine.kafka.sasl.password'),
        } : undefined,
        retry: {
          initialRetryTime: 300,
          retries: 10,
          maxRetryTime: 30000,
        },
        allowAutoTopicCreation: configService.get('gamificationEngine.kafka.allowAutoTopicCreation') || false,
        deadLetterQueue: {
          enabled: configService.get('gamificationEngine.kafka.deadLetterQueue.enabled'),
          topic: configService.get('gamificationEngine.kafka.deadLetterQueue.topic'),
          maxRetries: configService.get('gamificationEngine.kafka.deadLetterQueue.maxRetries'),
        },
      }),
      isGlobal: true,
    }),
    SharedEventsModule.forRoot({
      isGlobal: true,
    }),

    // Common module with shared utilities
    CommonModule,

    // Feature modules in dependency order with feature flags
    ProfilesModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        enabled: true, // Profiles are always enabled as they're core functionality
        cacheEnabled: configService.get('gamificationEngine.features.profileCaching.enabled'),
        cacheTtl: configService.get('gamificationEngine.features.profileCaching.ttl'),
      }),
    }),
    AchievementsModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        enabled: configService.get('gamificationEngine.features.achievements.enabled'),
        notificationsEnabled: configService.get('gamificationEngine.features.achievements.notifications'),
        maxAchievementsPerDay: configService.get('gamificationEngine.features.achievements.maxPerDay'),
      }),
    }),
    RulesModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        enabled: configService.get('gamificationEngine.features.rules.enabled'),
        refreshInterval: configService.get('gamificationEngine.features.rules.refreshInterval'),
        maxRulesPerEvent: configService.get('gamificationEngine.features.rules.maxPerEvent'),
      }),
    }),
    QuestsModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        enabled: configService.get('gamificationEngine.features.quests.enabled'),
        maxActiveQuests: configService.get('gamificationEngine.features.quests.maxActive'),
        notificationsEnabled: configService.get('gamificationEngine.features.quests.notifications'),
      }),
    }),
    RewardsModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        enabled: configService.get('gamificationEngine.features.rewards.enabled'),
        notificationsEnabled: configService.get('gamificationEngine.features.rewards.notifications'),
        maxRewardsPerDay: configService.get('gamificationEngine.features.rewards.maxPerDay'),
      }),
    }),
    LeaderboardModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        enabled: configService.get('gamificationEngine.features.leaderboard.enabled'),
        maxEntries: configService.get('gamificationEngine.features.leaderboard.maxEntries'),
        refreshInterval: configService.get('gamificationEngine.features.leaderboard.refreshInterval'),
      }),
    }),
    EventsModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        enabled: true, // Events are always enabled as they're core functionality
        healthEventsEnabled: configService.get('gamificationEngine.features.healthJourney.enabled'),
        careEventsEnabled: configService.get('gamificationEngine.features.careJourney.enabled'),
        planEventsEnabled: configService.get('gamificationEngine.features.planJourney.enabled'),
        batchSize: configService.get('gamificationEngine.events.batchSize'),
        processingInterval: configService.get('gamificationEngine.events.processingInterval'),
        maxConcurrentProcessing: configService.get('gamificationEngine.events.maxConcurrentProcessing'),
      }),
    }),
  ],
  providers: [
    // Register feature flag service
    {
      provide: 'FEATURE_FLAGS',
      useFactory: (configService: ConfigService) => ({
        achievements: configService.get('gamificationEngine.features.achievements.enabled'),
        quests: configService.get('gamificationEngine.features.quests.enabled'),
        rewards: configService.get('gamificationEngine.features.rewards.enabled'),
        leaderboard: configService.get('gamificationEngine.features.leaderboard.enabled'),
        healthJourney: configService.get('gamificationEngine.features.healthJourney.enabled'),
        careJourney: configService.get('gamificationEngine.features.careJourney.enabled'),
        planJourney: configService.get('gamificationEngine.features.planJourney.enabled'),
        profileCaching: configService.get('gamificationEngine.features.profileCaching.enabled'),
        maintenanceMode: configService.get('gamificationEngine.features.maintenanceMode'),
      }),
      inject: [ConfigService],
    },
  ],
  exports: [
    // Export feature flags for use in other modules
    'FEATURE_FLAGS',
  ],
})
export class AppModule {}