import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AchievementsService } from './achievements.service';
import { AchievementsController } from './achievements.controller';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';

// Updated imports using TypeScript path aliases for consistent module resolution
import { KafkaModule } from '@austa/events/kafka';
import { LoggerModule } from '@austa/logging';
import { RedisModule } from '@austa/database/redis';
import { TracingModule } from '@austa/tracing';

// Import consumers module for achievement event processing
import { AchievementConsumersModule } from './consumers/consumers.module';

// Import interfaces from @austa/interfaces package for type-safe data models
import { Achievement as AchievementInterface, UserAchievement as UserAchievementInterface } from '@austa/interfaces/gamification/achievements';
import { GamificationEvent, EventType } from '@austa/interfaces/gamification/events';

/**
 * Module for managing achievements in the gamification system.
 * 
 * This module serves as the central registration point for all achievement-related
 * functionality in the gamification engine. It orchestrates the integration between
 * database entities, event consumers, caching, and cross-cutting concerns like
 * logging and tracing.
 * 
 * Key responsibilities:
 * - Manages achievement definitions and user progress tracking
 * - Processes achievement-related events from all journeys (Health, Care, Plan)
 * - Provides caching for frequently accessed achievement data
 * - Exposes achievement-related APIs through the controller
 * - Exports the AchievementsService for use in other modules
 * 
 * Integration points:
 * - TypeORM: For database access to achievement entities
 * - Kafka: For event processing with dead-letter queues and retry strategies
 * - Redis: For improved caching resilience and leaderboard data
 * - Logging: For centralized, structured logging
 * - Tracing: For distributed request tracking across services
 * - Consumers: For journey-specific event processing
 */
@Module({
  imports: [
    // Register achievement entities with TypeORM
    TypeOrmModule.forFeature([Achievement, UserAchievement]),
    
    // Import the achievement consumers module which registers all journey-specific consumers
    AchievementConsumersModule,
    
    // Configure Kafka with dead-letter queues and retry strategies
    KafkaModule.forRoot({
      clientId: 'gamification-achievements',
      consumerGroup: 'achievements-consumer-group',
      enableDeadLetterQueue: true,
      dlqTopic: 'achievements-dlq',
      retryStrategy: {
        maxRetries: 3,
        initialDelayMs: 1000,
        backoffFactor: 2,
        maxDelayMs: 30000,
        jitterFactor: 0.1,
      },
      errorHandler: {
        handleRetryableErrors: true,
        logErrors: true,
      },
    }),
    
    // Configure Redis with improved caching resilience
    RedisModule.forRoot({
      connectionName: 'achievements-cache',
      enableHealthCheck: true,
      healthCheckInterval: 30000, // 30 seconds
      retryStrategy: {
        maxRetries: 3,
        retryDelayMs: 1000,
        maxRetryDelayMs: 10000,
      },
      reconnectOnError: true,
      enableAutoPipelining: true,
      enableReadyCheck: true,
      enableOfflineQueue: true,
    }),
    
    // Configure centralized logging
    LoggerModule.forRoot({
      service: 'achievements-service',
      enableStructuredLogging: true,
      logLevel: 'info',
      includeTimestamp: true,
      correlationIdProvider: true,
    }),
    
    // Configure distributed tracing
    TracingModule.forRoot({
      serviceName: 'achievements-service',
      enableTracing: true,
      samplingRate: 0.1, // Sample 10% of requests
      exporterType: 'jaeger',
      tags: {
        component: 'achievements',
        version: '1.0.0',
      },
    }),
  ],
  controllers: [AchievementsController],
  providers: [AchievementsService],
  exports: [AchievementsService],
})
export class AchievementsModule {}