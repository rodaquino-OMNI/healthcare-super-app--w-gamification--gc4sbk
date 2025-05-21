import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { LoggerModule } from '@austa/logging/logger.module';
import { TracingModule } from '@austa/tracing/tracing.module';
import { RedisModule } from '@austa/redis/redis.module';

import { RetryModule } from '@app/retry/retry.module';
import { TemplatesModule } from '@app/templates/templates.module';
import { WebsocketsModule } from '@app/websockets/websockets.module';

import { EmailService } from './email/email.service';
import { SmsService } from './sms/sms.service';
import { PushService } from './push/push.service';
import { InAppService } from './in-app/in-app.service';

/**
 * Module that configures and provides all notification delivery channels.
 * Integrates with retry mechanism, templates, and shared infrastructure.
 */
@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    TracingModule,
    RedisModule,
    RetryModule,
    TemplatesModule,
    WebsocketsModule,
  ],
  providers: [
    EmailService,
    SmsService,
    PushService,
    InAppService,
  ],
  exports: [
    EmailService,
    SmsService,
    PushService,
    InAppService,
  ],
})
export class ChannelsModule {}