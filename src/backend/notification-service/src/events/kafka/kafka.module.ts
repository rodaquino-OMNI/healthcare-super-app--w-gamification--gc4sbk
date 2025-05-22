import { Module } from '@nestjs/common';
import { KafkaModule as SharedKafkaModule } from 'src/backend/shared/src/kafka/kafka.module';
import { LoggerModule } from 'src/backend/shared/src/logging/logger.module';
import { TracingModule } from 'src/backend/shared/src/tracing/tracing.module';
import { RetryModule } from '../../retry/retry.module';
import { KafkaConsumer } from './kafka.consumer';
import { KafkaProducer } from './kafka.producer';

/**
 * Configures the Kafka integration for the notification service, enabling event-driven
 * notification processing and delivery status publication.
 * 
 * This module registers both consumer and producer services for Kafka integration,
 * providing standardized event handling with proper error management, retry policies,
 * and distributed tracing.
 * 
 * Key capabilities:
 * - Consuming notification requests from journey services and gamification engine
 * - Publishing notification delivery status events (sent, delivered, failed, read)
 * - Implementing standardized retry policies for failed operations
 * - Providing distributed tracing for cross-service observability
 */
@Module({
  imports: [
    SharedKafkaModule,
    RetryModule,
    LoggerModule,
    TracingModule,
  ],
  providers: [KafkaConsumer, KafkaProducer],
  exports: [KafkaConsumer, KafkaProducer],
})
export class KafkaModule {}