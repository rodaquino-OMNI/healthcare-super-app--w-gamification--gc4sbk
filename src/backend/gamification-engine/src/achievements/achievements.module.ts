import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AchievementsService } from './achievements.service';
import { AchievementsController } from './achievements.controller';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';

// Import shared modules with path aliases
import { KafkaModule } from '@app/shared/kafka/kafka.module';
import { LoggerModule } from '@app/shared/logging/logger.module';
import { RedisModule } from '@app/shared/redis/redis.module';
import { TracingModule } from '@app/shared/tracing/tracing.module';

// Import interfaces from @austa/interfaces package
import { 
  Achievement as IAchievement,
  UserAchievement as IUserAchievement,
  GamificationEvent,
  EventType
} from '@austa/interfaces/gamification';

// Import achievement consumers
import { ConsumersModule } from './consumers/consumers.module';
import { HealthJourneyConsumer } from './consumers/health-journey.consumer';
import { CareJourneyConsumer } from './consumers/care-journey.consumer';
import { PlanJourneyConsumer } from './consumers/plan-journey.consumer';
import { BaseConsumer } from './consumers/base.consumer';

// Import event processing utilities
import { EventProcessingService } from '@app/shared/events/event-processing.service';
import { DeadLetterQueueService } from '@app/shared/kafka/dead-letter-queue.service';

/**
 * Module for managing achievements in the gamification system.
 * This module is responsible for configuring the necessary dependencies
 * for working with achievements across all journeys.
 *
 * Features:
 * - TypeORM integration for Achievement and UserAchievement entities
 * - Kafka consumers for journey-specific events with dead-letter queues
 * - Redis caching with improved resilience for achievement data
 * - Cross-journey achievement tracking
 * - Integration with @austa/interfaces for type-safe data models
 */
@Module({
  imports: [
    // Entity registration
    TypeOrmModule.forFeature([Achievement, UserAchievement]),
    
    // Shared infrastructure modules with enhanced configuration
    KafkaModule.registerWithRetry({
      retryAttempts: 5,
      retryDelay: 1000,
      exponentialBackoff: true,
      enableDeadLetterQueue: true,
      deadLetterQueueTopic: 'achievements-dlq',
      consumerConfig: {
        groupId: 'achievements-consumer-group',
        allowAutoTopicCreation: true,
        sessionTimeout: 30000,
      },
    }),
    RedisModule.registerWithFailover({
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
      enableReadFromReplicas: true,
      keyPrefix: 'achievement:',
      cacheStrategy: {
        ttl: 3600, // 1 hour cache for achievements
        invalidationEvents: ['achievement:updated', 'achievement:created'],
      },
    }),
    LoggerModule,
    TracingModule,
    
    // Register consumers module
    ConsumersModule,
  ],
  controllers: [AchievementsController],
  providers: [
    AchievementsService,
    // Register journey-specific consumers
    HealthJourneyConsumer,
    CareJourneyConsumer,
    PlanJourneyConsumer,
    // Register event processing services
    EventProcessingService,
    DeadLetterQueueService,
    {
      provide: 'ACHIEVEMENT_EVENT_VALIDATOR',
      useFactory: () => ({
        validate: (event: GamificationEvent) => {
          // Validate event structure and version
          if (!event || !event.type || !event.payload) {
            return { valid: false, errors: ['Invalid event structure'] };
          }
          return { valid: true };
        }
      }),
    },
  ],
  exports: [
    AchievementsService,
    // Export TypeORM repositories for use in other modules
    TypeOrmModule.forFeature([Achievement, UserAchievement]),
  ],
})
export class AchievementsModule {}