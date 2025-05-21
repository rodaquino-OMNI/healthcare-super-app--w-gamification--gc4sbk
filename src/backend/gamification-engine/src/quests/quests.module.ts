import { Module, DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

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
 * Configuration options for the QuestsModule
 */
export interface QuestsModuleOptions {
  /**
   * Whether quest functionality is enabled
   * @default true
   */
  enabled: boolean;
  
  /**
   * Maximum number of active quests a user can have at once
   * @default 5
   */
  maxActiveQuests: number;
  
  /**
   * Whether to send notifications for quest events
   * @default true
   */
  notificationsEnabled: boolean;
}

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
  ],
})
export class QuestsModule {
  /**
   * Creates a dynamically configured QuestsModule with the provided options
   * 
   * @param options - Configuration options for the module
   * @returns A dynamically configured module
   */
  static forRoot(options: QuestsModuleOptions): DynamicModule {
    return {
      module: QuestsModule,
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
        // Provide configuration options
        {
          provide: 'QUESTS_MODULE_OPTIONS',
          useValue: options,
        },
        
        // Core service
        QuestsService,
        
        // Event consumers - only register if enabled
        ...(options.enabled ? [QuestsConsumer] : []),
        
        // Exception filter
        ExceptionFilter,
      ],
      exports: [
        // Export QuestsService for use in other modules
        QuestsService,
        'QUESTS_MODULE_OPTIONS',
      ],
    };
  }
  
  /**
   * Creates a dynamically configured QuestsModule with options from a factory function
   * 
   * @param options - Factory for creating module options
   * @returns A dynamically configured module
   */
  static forRootAsync(options: {
    imports: any[];
    inject: any[];
    useFactory: (...args: any[]) => QuestsModuleOptions | Promise<QuestsModuleOptions>;
  }): DynamicModule {
    return {
      module: QuestsModule,
      imports: [
        // Register TypeORM entities
        TypeOrmModule.forFeature([Quest, UserQuest]),
        
        // Import Kafka module with configuration for quest topics
        KafkaModule.register({
          clientId: 'gamification-quests',
          consumerGroupId: 'quests-consumer-group',
          topics: ['quest.started', 'quest.completed', 'quest.progress']
        }),
        
        // Import modules required by the factory
        ...options.imports,
      ],
      controllers: [QuestsController],
      providers: [
        // Provide configuration options using factory
        {
          provide: 'QUESTS_MODULE_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject,
        },
        
        // Core service
        QuestsService,
        
        // Event consumers - registered conditionally in QuestsConsumerProvider
        {
          provide: QuestsConsumer,
          useFactory: (moduleOptions: QuestsModuleOptions) => {
            // Only create the consumer if quests are enabled
            if (moduleOptions.enabled) {
              return new QuestsConsumer(
                /* Dependencies will be injected by NestJS */
              );
            }
            return null;
          },
          inject: ['QUESTS_MODULE_OPTIONS'],
        },
        
        // Exception filter
        ExceptionFilter,
      ],
      exports: [
        // Export QuestsService for use in other modules
        QuestsService,
        'QUESTS_MODULE_OPTIONS',
      ],
    };
  }
}