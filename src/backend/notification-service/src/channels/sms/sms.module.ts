import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { LoggerModule } from 'src/backend/shared/src/logging/logger.module';
import { RetryModule } from '../../retry/retry.module';

import { SmsService } from './sms.service';

/**
 * Module that provides SMS notification functionality for the notification service.
 * Encapsulates the SMS service and related components, making them available to
 * the notification service while maintaining proper encapsulation.
 *
 * This module integrates with the retry mechanism to handle transient failures
 * in SMS delivery, ensuring reliable notification delivery even when the SMS
 * provider experiences temporary issues.
 */
@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    RetryModule,
  ],
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}