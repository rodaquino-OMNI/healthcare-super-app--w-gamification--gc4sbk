import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { LoggerModule } from 'src/backend/shared/src/logging/logger.module';
import { RedisModule } from 'src/backend/shared/src/redis/redis.module';
import { KafkaModule } from 'src/backend/shared/src/kafka/kafka.module';
import { TracingModule } from 'src/backend/shared/src/tracing/tracing.module';

import { RetryService } from './retry.service';
import { DlqService } from './dlq/dlq.service';
import { DlqController } from './dlq/dlq.controller';
import { DlqEntry } from './dlq/dlq-entry.entity';

/**
 * Module that provides retry functionality for the notification service.
 * Handles failed notification delivery attempts with configurable retry policies,
 * exponential backoff, and dead-letter queue management.
 *
 * This module integrates with the notification service to provide reliable
 * delivery with proper error handling and observability for failed operations.
 */
@Module({
  imports: [
    // Register TypeORM for DlqEntry entity
    TypeOrmModule.forFeature([DlqEntry]),
    
    // Import shared modules
    ConfigModule,
    LoggerModule,
    RedisModule,
    KafkaModule,
    TracingModule,
  ],
  controllers: [DlqController],
  providers: [RetryService, DlqService],
  exports: [RetryService, DlqService],
})
export class RetryModule {}