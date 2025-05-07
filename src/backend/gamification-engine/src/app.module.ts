import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Configuration imports
import configuration from './config/configuration';
import databaseConfig from './config/database.config';
import validationSchema from './config/validation.schema';

// Database imports
import { DatabaseErrorHandler } from './database/database-error.handler';
import { PrismaService } from './database/prisma.service';

// Shared infrastructure modules
import { LoggerModule } from '@austa/logging';
import { ExceptionsModule } from '@austa/errors';
import { TracingModule } from '@austa/tracing';
import { RedisModule } from '@austa/database/redis';
import { KafkaModule } from '@austa/events/kafka';

// Feature modules
import { ProfilesModule } from './profiles/profiles.module';
import { AchievementsModule } from './achievements/achievements.module';
import { RulesModule } from './rules/rules.module';
import { QuestsModule } from './quests/quests.module';
import { RewardsModule } from './rewards/rewards.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { EventsModule } from './events/events.module';

// Common module for cross-cutting concerns
import { CommonModule } from './common/common.module';

/**
 * Root module for the Gamification Engine microservice.
 * 
 * This module orchestrates the complete bootstrap process by:
 * 1. Loading and validating configuration
 * 2. Establishing database connections
 * 3. Registering shared infrastructure modules
 * 4. Registering feature modules in dependency order
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

    // Database connection
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: DatabaseErrorHandler.createTypeOrmOptions,
    }),

    // Shared infrastructure modules
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        serviceName: configService.get('gamificationEngine.serviceName', 'gamification-engine'),
        logLevel: configService.get('gamificationEngine.logLevel', 'info'),
        enableConsoleOutput: configService.get('gamificationEngine.logging.enableConsole', true),
        enableFileOutput: configService.get('gamificationEngine.logging.enableFile', false),
        enableJsonFormat: configService.get('gamificationEngine.logging.enableJson', true),
      }),
    }),
    
    ExceptionsModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        enableGlobalFilters: configService.get('gamificationEngine.exceptions.enableGlobalFilters', true),
        enableSentry: configService.get('gamificationEngine.exceptions.enableSentry', false),
        sentryDsn: configService.get('gamificationEngine.exceptions.sentryDsn', ''),
        environment: configService.get('gamificationEngine.nodeEnv', 'development'),
      }),
    }),
    
    TracingModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        serviceName: configService.get('gamificationEngine.serviceName', 'gamification-engine'),
        enabled: configService.get('gamificationEngine.tracing.enabled', false),
        exporterEndpoint: configService.get('gamificationEngine.tracing.exporterEndpoint', ''),
        samplingRatio: configService.get('gamificationEngine.tracing.samplingRatio', 0.1),
      }),
    }),
    
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        url: configService.get('gamificationEngine.redis.url', 'redis://localhost:6379'),
        password: configService.get('gamificationEngine.redis.password', ''),
        db: configService.get('gamificationEngine.redis.db', 0),
        keyPrefix: configService.get('gamificationEngine.redis.keyPrefix', 'gamification:'),
        ttl: configService.get('gamificationEngine.redis.ttl', 3600),
        enableTLS: configService.get('gamificationEngine.redis.enableTLS', false),
        retryStrategy: {
          maxRetries: configService.get('gamificationEngine.redis.retryStrategy.maxRetries', 10),
          retryDelay: configService.get('gamificationEngine.redis.retryStrategy.retryDelay', 1000),
        },
      }),
    }),
    
    KafkaModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        clientId: configService.get('gamificationEngine.kafka.clientId', 'gamification-engine'),
        brokers: configService.get('gamificationEngine.kafka.brokers', ['localhost:9092']),
        groupId: configService.get('gamificationEngine.kafka.groupId', 'gamification-engine-group'),
        enableRetries: configService.get('gamificationEngine.kafka.enableRetries', true),
        maxRetries: configService.get('gamificationEngine.kafka.maxRetries', 10),
        retryDelay: configService.get('gamificationEngine.kafka.retryDelay', 1000),
        enableDeadLetterQueue: configService.get('gamificationEngine.kafka.enableDeadLetterQueue', true),
        deadLetterQueueTopic: configService.get('gamificationEngine.kafka.deadLetterQueueTopic', 'gamification-engine-dlq'),
        enableSchemaValidation: configService.get('gamificationEngine.kafka.enableSchemaValidation', true),
      }),
    }),

    // Common module for cross-cutting concerns
    CommonModule,

    // Feature modules in dependency order
    ProfilesModule,
    AchievementsModule,
    RulesModule,
    QuestsModule,
    RewardsModule,
    LeaderboardModule,
    EventsModule,
  ],
  providers: [
    PrismaService,
  ],
  exports: [
    PrismaService,
  ],
})
export class AppModule {}