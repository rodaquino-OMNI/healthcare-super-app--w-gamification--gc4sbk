import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { KafkaModule } from 'src/backend/shared/src/kafka/kafka.module';
import { LoggerModule } from 'src/backend/shared/src/logging/logger.module';
import { TracingModule } from 'src/backend/shared/src/tracing/tracing.module';
import { RetryModule } from '../retry/retry.module';
import { KafkaConsumer } from './kafka/kafka.consumer';
import { KafkaProducer } from './kafka/kafka.producer';

/**
 * Configures the Events module for the notification service, orchestrating event-driven
 * functionality for reliable notification routing and delivery tracking.
 * 
 * This module integrates with Kafka for event processing, the retry system for handling
 * failed notifications, and provides standardized event schemas through @austa/interfaces.
 * 
 * Key responsibilities:
 * - Processing notification events from all journeys (Health, Care, Plan)
 * - Publishing delivery status events for tracking and analytics
 * - Integrating with the retry system for failed notification delivery
 * - Maintaining consistent event schemas across the platform
 */
@Module({
  imports: [
    KafkaModule,
    LoggerModule,
    TracingModule,
    RetryModule
  ],
  controllers: [EventsController],
  providers: [
    EventsService,
    KafkaConsumer,
    KafkaProducer
  ],
  exports: [EventsService]
})
export class EventsModule {}