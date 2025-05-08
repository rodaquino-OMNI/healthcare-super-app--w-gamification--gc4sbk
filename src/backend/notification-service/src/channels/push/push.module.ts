import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { LoggerModule } from 'src/backend/shared/src/logging/logger.module';
import { TracingModule } from 'src/backend/shared/src/tracing/tracing.module';
import { KafkaModule } from 'src/backend/shared/src/kafka/kafka.module';

import { RetryModule } from '../../retry/retry.module';
import { PushService } from './push.service';

/**
 * Module that encapsulates push notification functionality using Firebase Cloud Messaging (FCM).
 * 
 * This module provides the necessary infrastructure for sending push notifications to mobile devices
 * with proper retry handling and dead-letter queue support for failed notifications.
 * 
 * Key features:
 * - Integration with Firebase Cloud Messaging for reliable push notification delivery
 * - Asynchronous retry policies with exponential backoff for transient failures
 * - Dead-letter queue integration for notifications that exhaust retry attempts
 * - Kafka event topics for notification delivery tracking and analytics
 * - Comprehensive error handling and logging for notification delivery issues
 * 
 * The module follows the standardized structure across the notification service,
 * ensuring consistent implementation patterns and dependency management.
 */
@Module({
  imports: [
    // Import ConfigModule for accessing environment variables and configuration
    ConfigModule,
    
    // Import LoggerModule for structured logging
    LoggerModule,
    
    // Import TracingModule for distributed tracing
    TracingModule,
    
    // Import KafkaModule for event streaming
    KafkaModule,
    
    // Import RetryModule for handling failed notification retries
    RetryModule,
    
    // Configure EventEmitterModule for local event handling
    EventEmitterModule.forRoot({
      // Enable wildcard event listeners
      wildcard: true,
      // Maximum number of listeners per event
      maxListeners: 10,
      // Enable verbose error handling
      verboseMemoryLeak: true,
    }),
  ],
  providers: [
    // Register PushService as a provider
    PushService,
  ],
  exports: [
    // Export PushService for use in other modules
    PushService,
  ],
})
export class PushModule {}