import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PushService } from './push.service';
import { RetryModule } from '../../retry/retry.module';
import { LoggerModule } from '@austa/logging';
import { TracingModule } from '@austa/tracing';
import { KafkaModule } from '@austa/events/kafka/kafka.module';

/**
 * Module that provides push notification capabilities using Firebase Cloud Messaging.
 * Integrates with the retry system for handling failed notifications and
 * Kafka for dead-letter queue publishing.
 *
 * Key features:
 * - Firebase Cloud Messaging integration for cross-platform push notifications
 * - Retry policies with exponential backoff for failed notifications
 * - Dead-letter queue support for persistently failing notifications
 * - Structured logging and distributed tracing for observability
 *
 * This module is part of the notification service's channel system and follows
 * the standardized module structure across the notification service.
 */
@Module({
  imports: [
    ConfigModule,
    RetryModule,
    LoggerModule,
    TracingModule,
    KafkaModule
  ],
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}