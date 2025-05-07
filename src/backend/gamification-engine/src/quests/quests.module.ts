import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KafkaModule } from '@austa/events/kafka/kafka.module';
import { LoggerModule } from '@austa/logging/logger.module';
import { ErrorsModule } from '@austa/errors';

// Controllers
import { QuestsController } from './quests.controller';

// Services
import { QuestsService } from './quests.service';

// Entities
import { Quest } from './entities/quest.entity';
import { UserQuest } from './entities/user-quest.entity';

// Consumers
import { QuestsConsumer } from './consumers/quests.consumer';

// Exception Filters
import { QuestNotFoundExceptionFilter } from './exceptions/quest-not-found.exception';
import { QuestAlreadyStartedExceptionFilter } from './exceptions/quest-already-started.exception';
import { QuestAlreadyCompletedExceptionFilter } from './exceptions/quest-already-completed.exception';
import { QuestNotStartedExceptionFilter } from './exceptions/quest-not-started.exception';
import { QuestProcessingExceptionFilter } from './exceptions/quest-processing.exception';

/**
 * Module for managing quests within the gamification engine.
 * Configures the necessary providers, controllers, and database entities
 * to enable quest functionality across the application.
 *
 * This module integrates with Kafka for event-driven quest processing,
 * registers exception filters for standardized error handling, and
 * provides the QuestsService for use in other modules.
 */
@Module({
  imports: [
    // Register TypeORM entities
    TypeOrmModule.forFeature([Quest, UserQuest]),
    
    // Configure Kafka for quest events
    KafkaModule.register({
      clientId: 'gamification-quests',
      consumerGroupId: 'quests-consumer-group',
      topics: [
        'quest.started',
        'quest.completed',
        'quest.progress'
      ],
      retryConfig: {
        maxRetries: 3,
        initialBackoffMs: 1000,
        maxBackoffMs: 10000
      }
    }),
    
    // Logger module for structured logging
    LoggerModule,
    
    // Error handling module
    ErrorsModule.forFeature({
      domain: 'gamification',
      feature: 'quests'
    })
  ],
  controllers: [QuestsController],
  providers: [
    // Core service
    QuestsService,
    
    // Event consumers
    QuestsConsumer,
    
    // Exception filters - these are now provided as exception filters
    // rather than directly as providers to ensure proper exception handling
    {
      provide: 'APP_FILTER',
      useClass: QuestNotFoundExceptionFilter
    },
    {
      provide: 'APP_FILTER',
      useClass: QuestAlreadyStartedExceptionFilter
    },
    {
      provide: 'APP_FILTER',
      useClass: QuestAlreadyCompletedExceptionFilter
    },
    {
      provide: 'APP_FILTER',
      useClass: QuestNotStartedExceptionFilter
    },
    {
      provide: 'APP_FILTER',
      useClass: QuestProcessingExceptionFilter
    }
  ],
  exports: [QuestsService],
})
export class QuestsModule {}