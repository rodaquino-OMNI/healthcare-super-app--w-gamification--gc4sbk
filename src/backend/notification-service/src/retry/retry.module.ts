import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { RetryService } from './retry.service';
import { DlqService } from './dlq/dlq.service';
import { DlqController } from './dlq/dlq.controller';
import { DlqEntry } from './dlq/dlq-entry.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { SharedModule } from '../../shared/shared.module';

/**
 * Module that provides retry functionality for failed notification operations.
 * It includes services for retry scheduling, policy management, and dead-letter queue handling.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, DlqEntry]),
    ScheduleModule.forRoot(),
    NotificationsModule,
    SharedModule,
  ],
  providers: [RetryService, DlqService],
  controllers: [DlqController],
  exports: [RetryService, DlqService],
})
export class RetryModule {}