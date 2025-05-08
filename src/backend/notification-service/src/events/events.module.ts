import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { KafkaModule } from 'src/backend/shared/src/kafka/kafka.module';
import { LoggerModule } from 'src/backend/shared/src/logging/logger.module';
import { TracingModule } from 'src/backend/shared/src/tracing/tracing.module';
import { RetryModule } from '../retry/retry.module';
import { KafkaConsumer } from './kafka/kafka.consumer';
import { KafkaProducer } from './kafka/kafka.producer';
import { KafkaModule as EventsKafkaModule } from './kafka/kafka.module';

/**
 * Configures the Events module for the notification service, orchestrating event-driven functionality.
 * This module is responsible for processing notification events from all journeys (Health, Care, Plan)
 * and the gamification engine, ensuring reliable notification routing and delivery tracking.
 *
 * Key features:
 * - Kafka integration for reliable event processing with optimistic locking for transactional integrity
 * - Standardized notification payload schemas via @austa/interfaces for consistent type safety
 * - Enhanced error handling with fallback strategies and circuit breakers for external integrations
 * - Integration with retry system for failed notification delivery using exponential backoff
 * - Support for journey-specific notification events with proper context and theming
 * - Comprehensive delivery status tracking across all notification channels
 */
@Module({
  imports: [
    KafkaModule,
    EventsKafkaModule,
    LoggerModule,
    TracingModule,
    RetryModule,
  ],
  controllers: [EventsController],
  providers: [
    EventsService,
    KafkaConsumer,
    KafkaProducer,
  ],
  exports: [EventsService]
})
export class EventsModule {}