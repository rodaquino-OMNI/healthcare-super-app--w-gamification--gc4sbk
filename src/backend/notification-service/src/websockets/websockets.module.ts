import { Module } from '@nestjs/common';
import { WebsocketsGateway } from './websockets.gateway';
import { NotificationsService } from '../notifications/notifications.service';

// Updated imports using standardized TypeScript path aliases
import { KafkaModule } from '@app/shared/kafka/kafka.module';
import { RedisModule } from '@app/shared/redis/redis.module';
import { LoggerService } from '@app/shared/logging/logger.service';
import { TracingService } from '@app/shared/tracing/tracing.service';

// Import RetryModule for reliable notification delivery
import { RetryModule } from '../retry/retry.module';

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

// Import notification template and preference interfaces
import { NotificationTemplate } from '@austa/interfaces/notification/templates';
import { NotificationPreference } from '@austa/interfaces/notification/preferences';

/**
 * WebSocketsModule for the notification service.
 * 
 * This module configures the WebSocketsGateway with required dependencies including
 * Kafka and Redis integrations, NotificationsService, and RetryService for improved reliability.
 * It enables real-time notification delivery through WebSockets with standardized error handling
 * and retry mechanisms.
 * 
 * The module integrates with the RetryModule to implement asynchronous retry policies with
 * dead-letter queues for failed notifications. This ensures reliable notification delivery
 * even in the presence of transient network issues or service disruptions. The retry mechanism
 * supports multiple policies including fixed interval and exponential backoff strategies.
 * 
 * Integration with @austa/interfaces ensures standardized notification payload schemas
 * across the platform, providing type safety and consistent data structures for all notification
 * types and channels.
 * 
 * Key features:
 * - Real-time notification delivery via WebSockets
 * - Integration with RetryModule for reliable notification delivery
 * - Standardized event handling with Kafka for notification routing
 * - Connection management with Redis for WebSocket session tracking
 * - Comprehensive logging and tracing for observability
 * - Type-safe notification payloads using @austa/interfaces
 * - Support for multiple notification channels (in-app, push, email, SMS)
 * - Journey-specific notification handling for Health, Care, and Plan journeys
 */
@Module({
  imports: [
    // Import infrastructure modules with standardized path aliases
    KafkaModule, 
    RedisModule,
    
    // Import RetryModule for reliable notification delivery with retry policies
    // This enables asynchronous retry policies with dead-letter queues for failed notifications
    RetryModule,
  ],
  providers: [
    // WebsocketsGateway handles real-time notification delivery via WebSockets
    WebsocketsGateway, 
    
    // NotificationsService manages notification creation, storage, and delivery
    NotificationsService, 
    
    // Infrastructure services for logging and distributed tracing
    LoggerService, 
    TracingService
  ],
  exports: [
    // Export WebsocketsGateway for use in other modules
    WebsocketsGateway
  ],
})
export class WebsocketsModule {}