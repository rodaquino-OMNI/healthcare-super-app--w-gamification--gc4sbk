import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebsocketsModule } from '../../websockets/websockets.module';
import { RedisModule } from '@app/shared/redis/redis.module';
import { RetryModule } from '../../retry/retry.module';
import { LoggerService } from '@app/shared/logging/logger.service';
import { TracingService } from '@app/shared/tracing/tracing.service';
import { InAppService } from './in-app.service';

// Import interfaces for standardized notification payload schemas
import {
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  NotificationPriority,
  Notification
} from '@austa/interfaces/notification/types';

// Import journey-specific notification data interfaces
import {
  AchievementNotificationData,
  LevelUpNotificationData,
  AppointmentReminderData,
  ClaimStatusUpdateData
} from '@austa/interfaces/notification/data';

/**
 * InAppModule for the notification service's in-app notification channel.
 * 
 * This module configures the InAppService with required dependencies including
 * WebsocketsModule for real-time message dispatch, RedisModule for connection state
 * management, and RetryModule for handling delivery failures with standardized retry
 * policies and error handling.
 * 
 * The in-app notification channel is responsible for delivering notifications to users
 * through WebSockets when they are connected, or storing notifications for later delivery
 * when users are offline. It integrates with the journey-specific context to provide
 * appropriate notification handling based on the notification type and journey.
 * 
 * Key features:
 * - Real-time notification delivery via WebSockets for connected users
 * - Redis-based connection state management for tracking user connectivity
 * - Persistent storage of notifications for offline users with journey-specific TTLs
 * - Integration with retry mechanisms for failed notification operations
 * - Comprehensive logging and distributed tracing for observability
 * - Journey-specific notification handling for Health, Care, and Plan journeys
 * 
 * This module is part of the enhanced notification delivery system that improves
 * reliability and helps meet the service level agreement (SLA) of <30s delivery time
 * for 95th percentile of notifications.
 */
@Module({
  imports: [
    ConfigModule,
    WebsocketsModule,
    RedisModule,
    RetryModule,
  ],
  providers: [
    InAppService,
    LoggerService,
    TracingService,
  ],
  exports: [InAppService],
})
export class InAppModule {}