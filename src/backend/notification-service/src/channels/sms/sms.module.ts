import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SmsService } from './sms.service';
import { RetryModule } from '../../retry/retry.module';
import { LoggerModule } from '@austa/logging';
import { TracingModule } from '@austa/tracing';

/**
 * Module that provides SMS notification capabilities.
 * Registers the SmsService and its dependencies.
 */
@Module({
  imports: [
    ConfigModule,
    RetryModule,
    LoggerModule,
    TracingModule
  ],
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}