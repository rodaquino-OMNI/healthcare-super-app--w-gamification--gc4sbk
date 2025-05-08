import { Module } from '@nestjs/common';
import { KafkaModule as SharedKafkaModule } from '@app/shared/kafka/kafka.module';
import { LoggerModule } from '@app/shared/logging/logger.module';
import { TracingModule } from '@app/shared/tracing/tracing.module';
import { RetryModule } from '@app/notification/retry/retry.module';
import { KafkaConsumerService } from './kafka.consumer';
import { KafkaProducerService } from './kafka.producer';

/**
 * Configures the Kafka integration for the notification service's event processing system.
 * 
 * This module registers both the KafkaConsumerService and KafkaProducerService as providers,
 * making them available for dependency injection throughout the notification service.
 * 
 * The KafkaConsumerService subscribes to notification request topics from various journeys
 * (Health, Care, Plan) and the gamification engine, processing incoming notification requests
 * with standardized validation, error handling, and retry mechanisms.
 * 
 * The KafkaProducerService publishes notification delivery status events (sent, delivered,
 * failed, read) to Kafka topics for consumption by downstream systems, with proper error
 * handling, tracing, and automatic retries.
 * 
 * Key features:
 * - Integration with RetryModule for standardized retry policies with exponential backoff
 * - Structured logging for comprehensive observability and troubleshooting
 * - Distributed tracing with correlation IDs for cross-service request tracking
 * - Type-safe event schemas with validation for reliable message processing
 * - Dead letter queue integration for persistently failing messages
 * 
 * This module is part of the enhanced notification service architecture that implements:
 * - Asynchronous retry policies with dead-letter queues for failed notifications
 * - Kafka event topics for reliable notification routing and delivery tracking
 * - Integration with @austa/interfaces for standardized notification payload schemas
 * - Enhanced delivery channel fallback logic for improved reliability
 * 
 * The module ensures proper initialization order for dependencies and provides
 * a clear public API for Kafka-related functionality within the notification service.
 */
@Module({
  imports: [
    // Import the shared Kafka module for base Kafka functionality
    SharedKafkaModule,
    
    // Import the RetryModule for handling failed operations with standardized retry policies
    RetryModule,
    
    // Import the LoggerModule for structured logging with correlation IDs
    LoggerModule,
    
    // Import the TracingModule for distributed tracing across services
    TracingModule,
  ],
  providers: [
    // Register the KafkaConsumerService for consuming notification requests
    KafkaConsumerService,
    
    // Register the KafkaProducerService for publishing notification status events
    KafkaProducerService,
  ],
  exports: [
    // Export both services for use in other modules
    KafkaConsumerService,
    KafkaProducerService,
  ],
})
export class KafkaModule {
  /**
   * Creates a module that can be used for testing with mock implementations
   * of the Kafka services.
   * 
   * @param options Configuration options for the test module
   * @returns A dynamically configured module for testing
   */
  static forTesting(options?: {
    mockConsumerService?: any;
    mockProducerService?: any;
  }) {
    return {
      module: KafkaModule,
      providers: [
        {
          provide: KafkaConsumerService,
          useValue: options?.mockConsumerService || {
            onModuleInit: jest.fn(),
            processMessage: jest.fn(),
          },
        },
        {
          provide: KafkaProducerService,
          useValue: options?.mockProducerService || {
            publishNotificationStatus: jest.fn(),
            publishBatch: jest.fn(),
          },
        },
      ],
      exports: [KafkaConsumerService, KafkaProducerService],
    };
  }
}