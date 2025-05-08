import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { LoggerModule } from '@app/shared/logging/logger.module';
import { TracingModule } from '@app/shared/tracing/tracing.module';
import { RetryModule } from '../../retry/retry.module';

import { SmsService } from './sms.service';

/**
 * Module that configures and provides SMS notification functionality.
 * 
 * This module encapsulates the SMS service and related components, making them
 * available to the notification service while maintaining proper encapsulation.
 * It integrates with the retry mechanism to handle transient failures in SMS delivery,
 * ensuring reliable message delivery even in the face of temporary provider outages
 * or rate limiting.
 * 
 * The SMS channel supports:
 * - Sending text messages via Twilio
 * - Automatic retries with exponential backoff for failed deliveries
 * - Comprehensive error tracking and classification
 * - Integration with structured logging for observability
 * - Distributed tracing for end-to-end request correlation
 * 
 * This module is part of the notification service's multi-channel delivery system
 * and helps meet the service level agreement (SLA) of <30s delivery time for
 * 95th percentile of notifications.
 */
@Module({
  imports: [
    // Import ConfigModule for accessing environment variables and configuration
    ConfigModule,
    
    // Import LoggerModule for structured logging
    LoggerModule,
    
    // Import TracingModule for distributed tracing and request correlation
    TracingModule,
    
    // Import RetryModule for handling transient failures
    RetryModule,
  ],
  providers: [
    SmsService,
  ],
  exports: [
    SmsService,
  ],
})
export class SmsModule {}