import { Module } from '@nestjs/common';
import { WebsocketsGateway } from './websockets.gateway';
import { NotificationsService } from '../notifications/notifications.service';

// Updated imports using standardized TypeScript path aliases
import { KafkaModule } from '@app/shared/kafka/kafka.module';
import { RedisModule } from '@app/shared/redis/redis.module';
import { LoggerService } from '@app/shared/logging/logger.service';
import { TracingService } from '@app/shared/tracing/tracing.service';

// Added RetryModule for reliable notification delivery
import { RetryModule } from '../retry/retry.module';

// Import standardized notification interfaces
import {
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  NotificationPriority
} from '@austa/interfaces/notification/types';

/**
 * WebSocketsModule for the notification service.
 * 
 * Provides real-time notification capabilities through WebSockets with:
 * - Reliable delivery through retry mechanisms and dead-letter queues
 * - Kafka integration for event-driven notifications across journeys
 * - Redis for connection state management and presence tracking
 * - Standardized notification payload schemas using @austa/interfaces
 * 
 * This module integrates with the RetryModule to ensure notifications are
 * delivered reliably, with proper error handling and retry policies based
 * on notification channel and error type.
 * 
 * Supported notification channels:
 * - In-app (WebSocket): {@link NotificationChannel.IN_APP}
 * - Push: {@link NotificationChannel.PUSH}
 * - Email: {@link NotificationChannel.EMAIL}
 * - SMS: {@link NotificationChannel.SMS}
 */
@Module({
  imports: [
    // Core infrastructure modules
    KafkaModule, // For event-driven notification processing
    RedisModule, // For connection state and presence tracking
    
    // Added RetryModule for reliable notification delivery with dead-letter queues
    RetryModule, // Provides retry policies and DLQ management
  ],
  providers: [
    WebsocketsGateway, // Handles WebSocket connections and real-time messaging
    NotificationsService, // Core notification processing service
    LoggerService, // Structured logging for observability
    TracingService, // Distributed tracing for request tracking
  ],
  exports: [WebsocketsGateway],
})
export class WebsocketsModule {}