import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Import entities using standardized patterns
import { Quest } from './entities/quest.entity';
import { UserQuest } from './entities/user-quest.entity';

// Import services and controllers
import { QuestsService } from './quests.service';
import { QuestsController } from './quests.controller';

// Import consumers for event processing
import { QuestsConsumer } from './consumers/quests.consumer';

// Import exception filter from common module
import { ExceptionFilter } from '@app/common/exceptions/exception.filter';

// Import Kafka module with proper configuration
import { KafkaModule } from '@app/common/kafka/kafka.module';

// Import interfaces from @austa/interfaces package
import { QuestEventInterface } from '@austa/interfaces/gamification';

/**
 * Module for managing quests within the gamification engine.
 * Configures the necessary providers, controllers, and database entities
 * to enable quest functionality across the application.
 * 
 * This module integrates with the Kafka event system to process quest-related
 * events from all journeys and update user progress accordingly.
 */
@Module({
  imports: [
    // Register TypeORM entities
    TypeOrmModule.forFeature([Quest, UserQuest]),
    
    // Import Kafka module with configuration for quest topics
    KafkaModule.register({
      clientId: 'gamification-quests',
      consumerGroupId: 'quests-consumer-group',
      topics: ['quest.started', 'quest.completed', 'quest.progress']
    }),
  ],
  controllers: [QuestsController],
  providers: [
    // Core service
    QuestsService,
    
    // Event consumers
    QuestsConsumer,
    
    // Exception filter
    ExceptionFilter,
  ],
  exports: [
    // Export QuestsService for use in other modules
    QuestsService,
  ],
})
export class QuestsModule {}