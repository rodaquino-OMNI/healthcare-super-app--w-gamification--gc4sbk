import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { LoggerModule } from '@app/shared/logging/logger.module';
import { RedisModule } from '@app/shared/redis/redis.module';
import { KafkaModule } from '@app/shared/kafka/kafka.module';
import { TracingModule } from '@app/shared/tracing/tracing.module';

import { NotificationsModule } from '../notifications/notifications.module';
import { RetryService } from './retry.service';
import { DlqService } from './dlq/dlq.service';
import { DlqEntry } from './dlq/dlq-entry.entity';

/**
 * Module that configures and provides retry functionality for the notification service.
 * It registers the RetryService, DlqService, and configures TypeORM for the DlqEntry entity.
 * 
 * This module implements standardized error handling patterns and retry mechanisms with
 * exponential backoff for failed notification operations. It supports multiple retry policies
 * including fixed interval and exponential backoff, with configurable parameters for each policy.
 * 
 * The retry functionality includes:
 * - Policy-based retry scheduling with support for different notification channels
 * - Dead Letter Queue (DLQ) for notifications that exhaust their retry attempts
 * - Comprehensive error tracking and classification
 * - Integration with structured logging and distributed tracing
 * - Cron-based processing of scheduled retries
 * 
 * This module is part of the enhanced error handling framework that improves notification
 * delivery reliability and helps meet the service level agreement (SLA) of <30s delivery time
 * for 95th percentile of notifications.
 */
@Module({
  imports: [
    // Import ConfigModule for accessing environment variables and configuration
    ConfigModule,
    
    // Configure TypeORM for the DlqEntry entity
    TypeOrmModule.forFeature([DlqEntry]),
    
    // Import NotificationsModule to access NotificationsService
    NotificationsModule,
    
    // Import shared infrastructure modules
    LoggerModule,
    RedisModule,
    KafkaModule,
    TracingModule,
  ],
  providers: [
    RetryService,
    DlqService,
  ],
  exports: [
    RetryService,
    DlqService,
  ],
})
export class RetryModule {}