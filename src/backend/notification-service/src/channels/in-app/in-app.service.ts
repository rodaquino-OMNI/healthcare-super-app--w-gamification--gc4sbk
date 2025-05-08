import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Span } from '@nestjs/opentelemetry';

// Updated imports using standardized path aliases
import { LoggerService } from '@app/shared/logging';
import { RedisService } from '@app/shared/redis';
import { TracingService } from '@app/shared/tracing';
import { JourneyErrorContext } from '@app/errors/journey';
import { ServiceError } from '@app/errors/categories';

// Import interfaces from the centralized interfaces package
import {
  Notification,
  NotificationChannel,
  NotificationStatus,
  NotificationPriority,
  NotificationType,
  NotificationDeliveryResult
} from '@austa/interfaces';

// Local imports
import { WebsocketsGateway } from '../../websockets/websockets.gateway';
import { RetryService } from '../../retry/retry.service';
import { DlqService } from '../../retry/dlq/dlq.service';
import { IRetryableOperation } from '../../retry/interfaces/retryable-operation.interface';
import { NotificationEntity } from '../../notifications/entities/notification.entity';

/**
 * Handles the sending of in-app notifications within the AUSTA SuperApp.
 * This service is responsible for checking user connection status and
 * either delivering notifications via WebSockets or storing them for later delivery.
 * 
 * Enhanced with retry mechanisms, fallback strategies, and journey-specific error handling.
 */
@Injectable()
export class InAppService {
  /**
   * Initializes the InAppService with required dependencies.
   * 
   * @param websocketsGateway - Service for sending WebSocket messages
   * @param redisService - Service for Redis operations and checking connection status
   * @param logger - Service for structured logging
   * @param configService - Service for accessing configuration
   * @param retryService - Service for handling failed notification deliveries
   * @param dlqService - Service for managing the dead-letter queue
   * @param tracingService - Service for distributed tracing
   */
  constructor(
    private readonly websocketsGateway: WebsocketsGateway,
    private readonly redisService: RedisService,
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly retryService: RetryService,
    private readonly dlqService: DlqService,
    private readonly tracingService: TracingService,
  ) {}

  /**
   * Sends an in-app notification to a user.
   * If the user is connected, sends the notification via WebSocket.
   * If the user is not connected, stores the notification for later delivery.
   * Includes retry mechanisms and fallback strategies for failed deliveries.
   * 
   * @param userId - The ID of the user to send the notification to
   * @param notification - The notification entity to send
   * @returns A promise that resolves with a boolean indicating whether the notification was sent successfully
   */
  @Span('inapp.send')
  async send(userId: string, notification: NotificationEntity): Promise<NotificationDeliveryResult> {
    const traceId = this.tracingService.getCurrentTraceId();
    const journey = this.getJourneyFromNotification(notification);
    
    try {
      this.logger.log(
        `Attempting to send in-app notification to user ${userId}`,
        'InAppService',
        { userId, notificationId: notification.id, journey, traceId }
      );

      // Check if user is connected to WebSocket server
      const isConnected = await this.checkUserConnection(userId);

      if (isConnected) {
        // If user is connected, send notification immediately
        await this.sendToConnectedUser(userId, notification, journey, traceId);
        return {
          success: true,
          channel: NotificationChannel.IN_APP,
          timestamp: new Date().toISOString(),
          metadata: {
            traceId,
            journey,
            delivery: 'realtime'
          }
        };
      } else {
        // If user is not connected, store notification for later delivery
        const stored = await this.storeNotificationForLaterDelivery(userId, notification, traceId);
        
        this.logger.debug(
          `User ${userId} not connected. Notification stored for later delivery: ${stored}`,
          'InAppService',
          { userId, notificationId: notification.id, journey, stored, traceId }
        );
        
        return {
          success: stored,
          channel: NotificationChannel.IN_APP,
          timestamp: new Date().toISOString(),
          metadata: {
            traceId,
            journey,
            delivery: 'stored',
            ttl: this.redisService.getJourneyTTL(journey)
          }
        };
      }
    } catch (error) {
      // Create journey-specific error context
      const errorContext = new JourneyErrorContext(journey, {
        userId,
        notificationId: notification.id,
        channel: NotificationChannel.IN_APP,
        traceId
      });
      
      // Create service error with context
      const serviceError = new ServiceError(
        'Failed to send in-app notification',
        {
          cause: error,
          context: errorContext
        }
      );
      
      this.logger.error(
        `Failed to send in-app notification to user ${userId}: ${error.message}`,
        serviceError,
        'InAppService',
        { userId, notificationId: notification.id, journey, traceId, errorName: error.name }
      );
      
      // Create a retryable operation for the failed notification
      const retryableOperation = this.createRetryableOperation(userId, notification, journey);
      
      // Schedule retry with the retry service
      await this.retryService.scheduleRetry(
        retryableOperation,
        serviceError,
        {
          notificationId: Number(notification.id),
          userId,
          channel: NotificationChannel.IN_APP,
          attemptCount: 0
        }
      );
      
      return {
        success: false,
        channel: NotificationChannel.IN_APP,
        timestamp: new Date().toISOString(),
        error: {
          message: serviceError.message,
          code: serviceError.code || 'NOTIFICATION_DELIVERY_FAILED',
          context: journey
        },
        metadata: {
          traceId,
          journey,
          retryScheduled: true
        }
      };
    }
  }

  /**
   * Sends a notification to a connected user via WebSocket.
   * Includes fallback strategies for failed deliveries.
   * 
   * @param userId - The ID of the user to send the notification to
   * @param notification - The notification entity to send
   * @param journey - The journey context of the notification
   * @param traceId - The trace ID for correlation
   * @private
   */
  @Span('inapp.sendToConnectedUser')
  private async sendToConnectedUser(
    userId: string,
    notification: NotificationEntity,
    journey: string,
    traceId?: string
  ): Promise<void> {
    try {
      // Create notification payload
      const notificationPayload: Notification = {
        id: notification.id,
        type: notification.type as NotificationType,
        title: notification.title,
        body: notification.body,
        timestamp: notification.createdAt?.toISOString() || new Date().toISOString(),
        channel: NotificationChannel.IN_APP,
        status: notification.status as NotificationStatus,
        priority: this.determinePriority(notification),
        journey,
        data: notification.data || {},
        metadata: {
          traceId,
          correlationId: traceId,
          journeyContext: journey
        }
      };
      
      // Send notification via WebSocket
      await this.websocketsGateway.sendToUser(userId, notificationPayload);
      
      this.logger.debug(
        `In-app notification sent to connected user ${userId}`,
        'InAppService',
        { userId, notificationId: notification.id, journey, traceId }
      );
    } catch (error) {
      this.logger.error(
        `Error sending notification to connected user ${userId}`,
        error,
        'InAppService',
        { userId, notificationId: notification.id, journey, traceId }
      );
      
      // Try fallback strategy - send journey-specific notification
      try {
        this.logger.debug(
          `Attempting fallback delivery for user ${userId}`,
          'InAppService',
          { userId, notificationId: notification.id, journey, traceId }
        );
        
        // Create notification payload with fallback flag
        const fallbackPayload: Notification = {
          id: notification.id,
          type: notification.type as NotificationType,
          title: notification.title,
          body: notification.body,
          timestamp: notification.createdAt?.toISOString() || new Date().toISOString(),
          channel: NotificationChannel.IN_APP,
          status: notification.status as NotificationStatus,
          priority: this.determinePriority(notification),
          journey,
          data: notification.data || {},
          metadata: {
            traceId,
            correlationId: traceId,
            journeyContext: journey,
            fallback: true
          }
        };
        
        // Send to journey-specific room as fallback
        await this.websocketsGateway.sendJourneyNotificationToUser(userId, journey, fallbackPayload);
        
        this.logger.debug(
          `Fallback delivery succeeded for user ${userId}`,
          'InAppService',
          { userId, notificationId: notification.id, journey, traceId }
        );
      } catch (fallbackError) {
        this.logger.error(
          `Fallback delivery failed for user ${userId}`,
          fallbackError,
          'InAppService',
          { userId, notificationId: notification.id, journey, traceId }
        );
        
        // Throw the original error to trigger retry
        throw error;
      }
    }
  }

  /**
   * Checks if a user is connected to the WebSocket server.
   * Uses Redis to verify if the user has an active connection.
   * 
   * @param userId - The ID of the user to check
   * @returns A promise that resolves with a boolean indicating whether the user is connected
   */
  @Span('inapp.checkUserConnection')
  async checkUserConnection(userId: string): Promise<boolean> {
    const traceId = this.tracingService.getCurrentTraceId();
    
    try {
      // Check if user has an active WebSocket connection
      const connectionKey = `user:${userId}:connection`;
      const connectionExists = await this.redisService.exists(connectionKey);
      
      this.logger.debug(
        `Checked connection status for user ${userId}: ${connectionExists > 0 ? 'connected' : 'disconnected'}`,
        'InAppService',
        { userId, connectionExists: connectionExists > 0, traceId }
      );
      
      return connectionExists > 0;
    } catch (error) {
      this.logger.error(
        `Error checking connection status for user ${userId}: ${error.message}`,
        error,
        'InAppService',
        { userId, traceId, errorName: error.name }
      );
      
      // Default to false if there's an error checking connection status
      return false;
    }
  }

  /**
   * Stores a notification for later delivery when the user connects.
   * Uses Redis to store the notification with an appropriate TTL based on journey context.
   * 
   * @param userId - The ID of the user to store the notification for
   * @param notification - The notification to store
   * @param traceId - The trace ID for correlation
   * @returns A promise that resolves with a boolean indicating whether the notification was stored successfully
   */
  @Span('inapp.storeNotificationForLaterDelivery')
  async storeNotificationForLaterDelivery(
    userId: string,
    notification: NotificationEntity,
    traceId?: string
  ): Promise<boolean> {
    const journey = this.getJourneyFromNotification(notification);
    
    try {
      // Create a key for the user's pending notifications
      const pendingNotificationsKey = `user:${userId}:pending_notifications`;
      
      // Create notification payload
      const notificationPayload: Notification = {
        id: notification.id,
        type: notification.type as NotificationType,
        title: notification.title,
        body: notification.body,
        timestamp: notification.createdAt?.toISOString() || new Date().toISOString(),
        channel: NotificationChannel.IN_APP,
        status: notification.status as NotificationStatus,
        priority: this.determinePriority(notification),
        journey,
        data: notification.data || {},
        metadata: {
          traceId,
          correlationId: traceId,
          journeyContext: journey,
          storedAt: new Date().toISOString()
        }
      };
      
      // Serialize the notification
      const serializedNotification = JSON.stringify(notificationPayload);
      
      // Generate a unique ID for the notification
      const notificationId = notification.id || `${Date.now()}`;
      
      // Store the notification in a Redis hash
      await this.redisService.hset(
        pendingNotificationsKey,
        notificationId,
        serializedNotification
      );
      
      // Set an appropriate TTL for the pending notifications key
      const ttl = this.redisService.getJourneyTTL(journey);
      
      await this.redisService.expire(pendingNotificationsKey, ttl);
      
      this.logger.debug(
        `Stored notification for later delivery for user ${userId}`,
        'InAppService',
        { userId, notificationId, journey, ttl, traceId }
      );
      
      return true;
    } catch (error) {
      // Create journey-specific error context
      const errorContext = new JourneyErrorContext(journey, {
        userId,
        notificationId: notification.id,
        channel: NotificationChannel.IN_APP,
        operation: 'store',
        traceId
      });
      
      // Create service error with context
      const serviceError = new ServiceError(
        'Failed to store notification for later delivery',
        {
          cause: error,
          context: errorContext
        }
      );
      
      this.logger.error(
        `Error storing notification for later delivery for user ${userId}: ${error.message}`,
        serviceError,
        'InAppService',
        { userId, notificationId: notification.id, journey, traceId, errorName: error.name }
      );
      
      // Create a retryable operation for the failed storage
      const retryableOperation = this.createStorageRetryableOperation(userId, notification, journey);
      
      // Schedule retry with the retry service
      await this.retryService.scheduleRetry(
        retryableOperation,
        serviceError,
        {
          notificationId: Number(notification.id),
          userId,
          channel: NotificationChannel.IN_APP,
          attemptCount: 0
        }
      );
      
      // If storage fails, try to move to DLQ
      try {
        await this.dlqService.addToDlq({
          notificationId: Number(notification.id),
          userId,
          channel: NotificationChannel.IN_APP,
          payload: {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            body: notification.body,
            journey
          },
          errorDetails: {
            message: serviceError.message,
            stack: serviceError.stack,
            name: serviceError.name,
            code: serviceError.code || 'STORAGE_FAILED'
          },
          retryHistory: {
            attemptCount: 1,
            lastAttemptTime: new Date().toISOString(),
            errors: [serviceError.message]
          },
          metadata: {
            journey,
            traceId,
            operation: 'store'
          }
        });
        
        this.logger.log(
          `Added failed notification to DLQ for user ${userId}`,
          'InAppService',
          { userId, notificationId: notification.id, journey, traceId }
        );
      } catch (dlqError) {
        this.logger.error(
          `Failed to add notification to DLQ for user ${userId}`,
          dlqError,
          'InAppService',
          { userId, notificationId: notification.id, journey, traceId }
        );
      }
      
      return false;
    }
  }

  /**
   * Determines the journey context from a notification.
   * Used to set appropriate cache TTLs based on journey type.
   * 
   * @param notification - The notification to analyze
   * @returns The journey identifier (health, care, plan, game)
   * @private
   */
  /**
   * Determines the journey context from a notification.
   * Used to set appropriate cache TTLs based on journey type and for error context.
   * 
   * @param notification - The notification to analyze
   * @returns The journey identifier (health, care, plan, game)
   * @private
   */
  private getJourneyFromNotification(notification: NotificationEntity): string {
    // Default to health journey if no type is available
    if (!notification || !notification.type) return 'health';
    
    // First check data field for explicit journey context if available
    if (notification.data && typeof notification.data === 'object') {
      const data = notification.data as Record<string, any>;
      if (data.journey && typeof data.journey === 'string') {
        const journey = data.journey.toLowerCase();
        // Validate that it's a known journey type
        if (['health', 'care', 'plan', 'game'].includes(journey)) {
          return journey;
        }
      }
    }
    
    // If no explicit journey, infer from notification type
    const type = notification.type.toLowerCase();
    
    if (type.includes('health') || type.includes('metric') || type.includes('goal') || type.includes('device')) {
      return 'health';
    } else if (type.includes('care') || type.includes('appointment') || type.includes('medication') || type.includes('doctor') || type.includes('treatment')) {
      return 'care';
    } else if (type.includes('plan') || type.includes('claim') || type.includes('coverage') || type.includes('benefit') || type.includes('insurance')) {
      return 'plan';
    } else if (type.includes('achievement') || type.includes('quest') || type.includes('level') || type.includes('reward') || type.includes('challenge')) {
      return 'game';
    }
    
    // Default to health journey if type is unknown
    return 'health';
  }

  /**
   * Determines the priority of a notification based on its content.
   * 
   * @param notification - The notification to analyze
   * @returns The priority level for the notification
   * @private
   */
  /**
   * Determines the priority of a notification based on its content and journey context.
   * Used for delivery prioritization and UI display.
   * 
   * @param notification - The notification to analyze
   * @returns The priority level for the notification
   * @private
   */
  private determinePriority(notification: NotificationEntity): NotificationPriority {
    // Check if data contains explicit priority information
    if (notification.data && typeof notification.data === 'object') {
      const data = notification.data as Record<string, any>;
      if (data.priority && Object.values(NotificationPriority).includes(data.priority)) {
        return data.priority as NotificationPriority;
      }
    }
    
    // Check notification type for critical notifications
    const type = notification.type.toLowerCase();
    if (
      type.includes('emergency') || 
      type.includes('critical') ||
      type === 'medication-reminder' ||
      type.includes('alert') ||
      type.includes('urgent')
    ) {
      return NotificationPriority.CRITICAL;
    }
    
    // Journey-specific priorities with more granular type checking
    const journey = this.getJourneyFromNotification(notification);
    
    // Care journey - higher priority for appointment reminders and medication alerts
    if (journey === 'care') {
      if (type.includes('appointment') && type.includes('reminder') && this.isUpcoming(notification)) {
        return NotificationPriority.HIGH;
      }
      if (type.includes('medication')) {
        return NotificationPriority.HIGH;
      }
      return NotificationPriority.MEDIUM;
    }
    
    // Health journey - higher priority for goal completions and important metrics
    if (journey === 'health') {
      if (type.includes('goal') && type.includes('complete')) {
        return NotificationPriority.HIGH;
      }
      if (type.includes('metric') && (type.includes('abnormal') || type.includes('warning'))) {
        return NotificationPriority.HIGH;
      }
      return NotificationPriority.MEDIUM;
    }
    
    // Plan journey - higher priority for claim status updates
    if (journey === 'plan') {
      if (type.includes('claim') && type.includes('status')) {
        return NotificationPriority.MEDIUM;
      }
      return NotificationPriority.LOW;
    }
    
    // Game journey - higher priority for achievements than general updates
    if (journey === 'game') {
      if (type.includes('achievement') || type.includes('level-up')) {
        return NotificationPriority.MEDIUM;
      }
      return NotificationPriority.LOW;
    }
    
    // Default priority if journey is unknown
    return NotificationPriority.MEDIUM;
  }
  
  /**
   * Checks if a notification is for an upcoming event (like an appointment).
   * Used to determine priority for time-sensitive notifications.
   * 
   * @param notification - The notification to check
   * @returns Whether the notification is for an upcoming event
   * @private
   */
  private isUpcoming(notification: NotificationEntity): boolean {
    if (!notification.data) return false;
    
    try {
      const data = notification.data as Record<string, any>;
      
      // Check if there's a date/time field in the data
      if (data.date || data.time || data.datetime || data.scheduledAt) {
        const dateStr = data.date || data.datetime || data.scheduledAt;
        if (!dateStr) return false;
        
        const eventDate = new Date(dateStr);
        const now = new Date();
        const hoursDifference = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        // If event is within the next 24 hours, consider it upcoming
        return hoursDifference > 0 && hoursDifference <= 24;
      }
    } catch (error) {
      // If there's an error parsing the date, assume it's not upcoming
      return false;
    }
    
    return false;
  }

  /**
   * Creates a retryable operation for sending a notification.
   * 
   * @param userId - The user ID to send the notification to
   * @param notification - The notification entity to send
   * @param journey - The journey context of the notification
   * @returns A retryable operation
   * @private
   */
  private createRetryableOperation(
    userId: string,
    notification: NotificationEntity,
    journey: string
  ): IRetryableOperation {
    return {
      execute: async () => {
        // Check if user is now connected
        const isConnected = await this.checkUserConnection(userId);
        
        if (isConnected) {
          // If user is now connected, send notification
          await this.sendToConnectedUser(userId, notification, journey);
        } else {
          // If user is still not connected, store for later delivery
          await this.storeNotificationForLaterDelivery(userId, notification);
        }
      },
      getPayload: () => ({
        userId,
        notification: {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          channel: NotificationChannel.IN_APP,
          status: notification.status,
          journey
        }
      }),
      getMetadata: () => ({
        notificationId: notification.id,
        type: notification.type,
        userId,
        journey,
        createdAt: notification.createdAt?.toISOString() || new Date().toISOString()
      })
    };
  }

  /**
   * Creates a retryable operation for storing a notification.
   * 
   * @param userId - The user ID to store the notification for
   * @param notification - The notification entity to store
   * @param journey - The journey context of the notification
   * @returns A retryable operation
   * @private
   */
  private createStorageRetryableOperation(
    userId: string,
    notification: NotificationEntity,
    journey: string
  ): IRetryableOperation {
    return {
      execute: async () => {
        // Create a key for the user's pending notifications
        const pendingNotificationsKey = `user:${userId}:pending_notifications`;
        
        // Create notification payload
        const notificationPayload: Notification = {
          id: notification.id,
          type: notification.type as NotificationType,
          title: notification.title,
          body: notification.body,
          timestamp: notification.createdAt?.toISOString() || new Date().toISOString(),
          channel: NotificationChannel.IN_APP,
          status: notification.status as NotificationStatus,
          priority: this.determinePriority(notification),
          journey,
          data: notification.data || {},
          metadata: {
            journeyContext: journey,
            storedAt: new Date().toISOString(),
            retried: true
          }
        };
        
        // Serialize the notification
        const serializedNotification = JSON.stringify(notificationPayload);
        
        // Generate a unique ID for the notification
        const notificationId = notification.id || `${Date.now()}`;
        
        // Store the notification in a Redis hash
        await this.redisService.hset(
          pendingNotificationsKey,
          notificationId,
          serializedNotification
        );
        
        // Set an appropriate TTL for the pending notifications key
        const ttl = this.redisService.getJourneyTTL(journey);
        
        await this.redisService.expire(pendingNotificationsKey, ttl);
      },
      getPayload: () => ({
        userId,
        notification: {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          channel: NotificationChannel.IN_APP,
          status: notification.status,
          journey
        },
        operation: 'store'
      }),
      getMetadata: () => ({
        notificationId: notification.id,
        type: notification.type,
        userId,
        journey,
        createdAt: notification.createdAt?.toISOString() || new Date().toISOString(),
        operation: 'store'
      })
    };
  }
}