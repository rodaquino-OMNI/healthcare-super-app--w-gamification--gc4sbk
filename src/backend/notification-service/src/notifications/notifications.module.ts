import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';

import { PreferencesModule } from '../preferences/preferences.module';
import { TemplatesModule } from '../templates/templates.module';
import { WebsocketsModule } from '../websockets/websockets.module';
import { RetryModule } from '../retry/retry.module';
import { EventsModule } from '../events/events.module';

import { KafkaModule } from '@app/shared/kafka/kafka.module';
import { LoggerModule } from '@app/shared/logging/logger.module';
import { RedisModule } from '@app/shared/redis/redis.module';
import { TracingModule } from '@app/shared/tracing/tracing.module';

import { EmailService } from '../channels/email/email.service';
import { SmsService } from '../channels/sms/sms.service';
import { PushService } from '../channels/push/push.service';
import { InAppService } from '../channels/in-app/in-app.service';

/**
 * Module for the notification feature of the AUSTA SuperApp.
 * Provides controllers and services for sending and managing notifications.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    PreferencesModule,
    TemplatesModule,
    WebsocketsModule,
    RetryModule,
    EventsModule,
    KafkaModule,
    LoggerModule,
    RedisModule,
    TracingModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    EmailService,
    SmsService,
    PushService,
    InAppService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}